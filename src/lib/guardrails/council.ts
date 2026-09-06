import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { verdictSchema, MODERATION_SYSTEM_PROMPT, type Verdict } from "./schema";

// Judge A goes through Vercel AI Gateway (Anthropic). Judge B goes directly
// to OpenAI's API with the user's own key -- a genuinely separate network
// path and billing account, not just a different model string through the
// same proxy, so the two judges are architecturally independent the way
// karpathy/llm-council's multi-provider panel is (see README for credit).
const directOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

async function judge(model: string, prompt: string, useDirectOpenAI: boolean): Promise<{ verdict: Verdict; latencyMs: number }> {
  const start = Date.now();
  try {
    const { object } = await generateObject({
      model: useDirectOpenAI ? directOpenAI(model) : model,
      schema: verdictSchema,
      system: MODERATION_SYSTEM_PROMPT,
      prompt,
    });
    return { verdict: object, latencyMs: Date.now() - start };
  } catch {
    return {
      verdict: { verdict: "flag", reason: "Judge unavailable; defaulting to flag.", category: "other_policy" },
      latencyMs: Date.now() - start,
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

  const [a, b] = await Promise.all([
    judge("anthropic/claude-haiku-4.5", prompt, false),
    process.env.OPENAI_API_KEY
      ? judge("gpt-4o-mini", prompt, true)
      : judge("openai/gpt-4o-mini", prompt, false), // fall back to gateway if no BYOK
  ]);
  entries.push({ stage: "council_judge_a", verdict: a.verdict, modelUsed: "anthropic/claude-haiku-4.5", latencyMs: a.latencyMs });
  entries.push({ stage: "council_judge_b", verdict: b.verdict, modelUsed: process.env.OPENAI_API_KEY ? "openai/gpt-4o-mini (direct, BYOK)" : "openai/gpt-4o-mini (gateway)", latencyMs: b.latencyMs });

  if (a.verdict.verdict === b.verdict.verdict) {
    return { finalVerdict: a.verdict, entries };
  }

  const start = Date.now();
  const chairmanPrompt = `Two independent safety reviewers disagreed on this generation prompt.

Prompt: """${prompt}"""

Reviewer A verdict: ${a.verdict.verdict} (${a.verdict.category}) — ${a.verdict.reason}
Reviewer B verdict: ${b.verdict.verdict} (${b.verdict.category}) — ${b.verdict.reason}

Cast the deciding vote.`;
  const { object: chairmanVerdict } = await generateObject({
    model: "anthropic/claude-sonnet-5",
    schema: verdictSchema,
    system: MODERATION_SYSTEM_PROMPT,
    prompt: chairmanPrompt,
  }).catch(() => ({
    object: { verdict: "flag" as const, reason: "Chairman unavailable; defaulting to the stricter of the two verdicts.", category: "other_policy" as const },
  }));
  entries.push({ stage: "chairman", verdict: chairmanVerdict, modelUsed: "anthropic/claude-sonnet-5", latencyMs: Date.now() - start });

  return { finalVerdict: chairmanVerdict, entries };
}
