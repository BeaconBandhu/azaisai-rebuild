import { generateObject } from "ai";
import { verdictSchema, MODERATION_SYSTEM_PROMPT, type Verdict } from "./schema";

/** Single cheap/fast classifier used on every generation. Only prompts that
 * come back "flag" or "block" here get escalated to the full two-judge
 * council -- this keeps the common (clean) case fast and cheap while still
 * giving borderline/unsafe cases a rigorous second opinion before we act. */
export async function fastCheck(prompt: string): Promise<{ verdict: Verdict; latencyMs: number }> {
  const start = Date.now();
  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: verdictSchema,
      system: MODERATION_SYSTEM_PROMPT,
      prompt,
    });
    return { verdict: object, latencyMs: Date.now() - start };
  } catch {
    // Fail closed to "flag" (never silently "pass" on an infra error) so a
    // gateway hiccup escalates to the council instead of skipping review.
    return {
      verdict: { verdict: "flag", reason: "Fast classifier unavailable; escalating to council.", category: "other_policy" },
      latencyMs: Date.now() - start,
    };
  }
}
