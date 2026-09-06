import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { verdictSchema, MODERATION_SYSTEM_PROMPT, type Verdict } from "./schema";

// Judge A goes through Vercel AI Gateway (Anthropic). Judge B goes directly
// to OpenAI's API with the user's own key -- a genuinely separate network
// path and billing account, not just a different model string through the
// same proxy, so the two judges are architecturally independent the way
// karpathy/llm-council's multi-provider panel is (see README for credit).
//
// Known infra constraint, found by testing (scripts/test-pipeline.mjs), not
// assumed: this Vercel account is on the free AI Gateway tier, which
// rate-limits (429) under any real load -- including, ironically, the exact
// moderation call meant to review a genuinely unsafe prompt. Judge B's
// direct-OpenAI path has its own dedicated quota and doesn't share that
// limit, so it's the one call in this module we can actually rely on; judge
// A and the chairman both retry through it before falling back further.
const directOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const hasDirectOpenAI = Boolean(process.env.OPENAI_API_KEY);

export interface CouncilEntry {
  stage: "council_judge_a" | "council_judge_b" | "chairman";
  verdict: Verdict;
  modelUsed: string;
  latencyMs: number;
}

export interface CouncilResult {
  finalVerdict: Verdict;
  entries: CouncilEntry[];
}

const SEVERITY: Record<Verdict["verdict"], number> = { pass: 0, flag: 1, block: 2 };
function stricterOf(a: Verdict, b: Verdict): Verdict {
  return SEVERITY[a.verdict] >= SEVERITY[b.verdict] ? a : b;
}

async function judgeVia(model: string, prompt: string, direct: boolean) {
  const { object } = await generateObject({
    model: direct ? directOpenAI(model) : model,
    schema: verdictSchema,
    system: MODERATION_SYSTEM_PROMPT,
    prompt,
  });
  return object;
}

/** Judge A: Claude via gateway (primary), falling back to the reliable
 * direct-OpenAI path if the gateway call fails, before finally giving up to
 * a `flag`. */
async function judgeA(prompt: string): Promise<{ verdict: Verdict; latencyMs: number; modelUsed: string }> {
  const start = Date.now();
  try {
    const verdict = await judgeVia("anthropic/claude-haiku-4.5", prompt, false);
    return { verdict, latencyMs: Date.now() - start, modelUsed: "anthropic/claude-haiku-4.5" };
  } catch (primaryErr) {
    if (hasDirectOpenAI) {
      try {
        const verdict = await judgeVia("gpt-4o-mini", prompt, true);
        return { verdict, latencyMs: Date.now() - start, modelUsed: "anthropic/claude-haiku-4.5 (failed, fell back to openai/gpt-4o-mini direct)" };
      } catch {
        // fall through to the flag default below
      }
    }
    return {
      verdict: { verdict: "flag", reason: `Judge unavailable (${primaryErr instanceof Error ? primaryErr.message.slice(0, 80) : "error"}); defaulting to flag.`, category: "other_policy" },
      latencyMs: Date.now() - start,
      modelUsed: "anthropic/claude-haiku-4.5",
    };
  }
}

/** Judge B: direct OpenAI with the user's own key (primary) -- a separate
 * network path and billing account from the gateway, so it doesn't share
 * judge A's rate limit. Falls back to the gateway if no key is configured. */
async function judgeB(prompt: string): Promise<{ verdict: Verdict; latencyMs: number; modelUsed: string }> {
  const start = Date.now();
  if (hasDirectOpenAI) {
    try {
      const verdict = await judgeVia("gpt-4o-mini", prompt, true);
      return { verdict, latencyMs: Date.now() - start, modelUsed: "openai/gpt-4o-mini (direct, BYOK)" };
    } catch (err) {
      return {
        verdict: { verdict: "flag", reason: `Direct OpenAI judge failed (${err instanceof Error ? err.message.slice(0, 80) : "error"}); defaulting to flag.`, category: "other_policy" },
        latencyMs: Date.now() - start,
        modelUsed: "openai/gpt-4o-mini (direct, BYOK)",
      };
    }
  }
  try {
    const verdict = await judgeVia("openai/gpt-4o-mini", prompt, false);
    return { verdict, latencyMs: Date.now() - start, modelUsed: "openai/gpt-4o-mini (gateway, no BYOK configured)" };
  } catch (err) {
    return {
      verdict: { verdict: "flag", reason: `Judge unavailable (${err instanceof Error ? err.message.slice(0, 80) : "error"}); defaulting to flag.`, category: "other_policy" },
      latencyMs: Date.now() - start,
      modelUsed: "openai/gpt-4o-mini (gateway)",
    };
  }
}

/** Full council: two independent judges review the prompt in parallel; if
 * they agree, that's the final verdict. If they disagree, a chairman model
 * (with both judges' reasoning as context) casts the deciding vote -- the
 * same three-stage pattern as karpathy/llm-council (independent responses ->
 * cross-review -> chairman synthesis), applied to moderation instead of
 * general Q&A. */
export async function runCouncil(prompt: string): Promise<CouncilResult> {
  const entries: CouncilEntry[] = [];

  const [a, b] = await Promise.all([judgeA(prompt), judgeB(prompt)]);
  entries.push({ stage: "council_judge_a", verdict: a.verdict, modelUsed: a.modelUsed, latencyMs: a.latencyMs });
  entries.push({ stage: "council_judge_b", verdict: b.verdict, modelUsed: b.modelUsed, latencyMs: b.latencyMs });

  if (a.verdict.verdict === b.verdict.verdict) {
    return { finalVerdict: a.verdict, entries };
  }

  const start = Date.now();
  const chairmanPrompt = `Two independent safety reviewers disagreed on this generation prompt.

Prompt: """${prompt}"""

Reviewer A verdict: ${a.verdict.verdict} (${a.verdict.category}) — ${a.verdict.reason}
Reviewer B verdict: ${b.verdict.verdict} (${b.verdict.category}) — ${b.verdict.reason}

Cast the deciding vote.`;

  let chairmanVerdict: Verdict;
  let chairmanModel = "anthropic/claude-sonnet-5";
  try {
    chairmanVerdict = await judgeVia(chairmanModel, chairmanPrompt, false);
  } catch {
    if (hasDirectOpenAI) {
      try {
        chairmanModel = "openai/gpt-4o-mini (direct, chairman fallback)";
        chairmanVerdict = await judgeVia("gpt-4o-mini", chairmanPrompt, true);
      } catch {
        chairmanVerdict = stricterOf(a.verdict, b.verdict);
        chairmanModel = "none (both chairman attempts failed; used stricter-of-two)";
      }
    } else {
      chairmanVerdict = stricterOf(a.verdict, b.verdict);
      chairmanModel = "none (chairman failed; used stricter-of-two)";
    }
  }
  entries.push({ stage: "chairman", verdict: chairmanVerdict, modelUsed: chairmanModel, latencyMs: Date.now() - start });

  return { finalVerdict: chairmanVerdict, entries };
}
