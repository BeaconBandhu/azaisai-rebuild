import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { verdictSchema, MODERATION_SYSTEM_PROMPT, type Verdict } from "./schema";

// Direct OpenAI (BYOK), not the gateway: found by testing that gateway calls
// on this free-tier Vercel account 429 under real load (see council.ts for
// the full explanation), and this fast check runs on *every* prompt, so it's
// the one call in the whole guardrails layer that most needs a reliable path.
const directOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const hasDirectOpenAI = Boolean(process.env.OPENAI_API_KEY);

/** Single cheap/fast classifier used on every generation. Only prompts that
 * come back "flag" or "block" here get escalated to the full two-judge
 * council -- this keeps the common (clean) case fast and cheap while still
 * giving borderline/unsafe cases a rigorous second opinion before we act. */
export async function fastCheck(prompt: string): Promise<{ verdict: Verdict; latencyMs: number }> {
  const start = Date.now();
  try {
    const { object } = await generateObject({
      model: hasDirectOpenAI ? directOpenAI("gpt-4o-mini") : "openai/gpt-4o-mini",
      schema: verdictSchema,
      system: MODERATION_SYSTEM_PROMPT,
      prompt,
    });
    return { verdict: object, latencyMs: Date.now() - start };
  } catch {
    // Fail closed to "flag" (never silently "pass" on an infra error) so a
    // provider hiccup escalates to the council instead of skipping review.
    return {
      verdict: { verdict: "flag", reason: "Fast classifier unavailable; escalating to council.", category: "other_policy" },
      latencyMs: Date.now() - start,
    };
  }
}
