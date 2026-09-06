import { fastCheck } from "./fast-check";
import { runCouncil } from "./council";
import { checkRateLimit } from "./rate-limit";
import { logGuardrailEvent } from "./log";

export type GuardrailOutcome =
  | { allowed: true; trust: "passed" }
  | { allowed: false; trust: "rate_limited"; reason: string }
  | { allowed: false; trust: "blocked"; reason: string };

/** The pre-flight half of the guardrails/harness layer: rate limit, then a
 * fast classifier, escalating to the two-judge council only when the fast
 * check itself isn't a clean pass. Every stage is logged to
 * guardrail_events regardless of outcome, so the /admin/guardrails view has
 * a full, honest audit trail -- including the checks that passed. */
export async function runPreflightGuardrails(clerkUserId: string, prompt: string): Promise<GuardrailOutcome> {
  const rate = await checkRateLimit(clerkUserId);
  if (!rate.ok) {
    return { allowed: false, trust: "rate_limited", reason: rate.reason! };
  }

  const { verdict: fast, latencyMs } = await fastCheck(prompt);
  await logGuardrailEvent({
    clerkUserId,
    stage: "fast_check",
    verdict: fast.verdict,
    reasoning: fast.reason,
    modelUsed: "openai/gpt-4o-mini",
    latencyMs,
  });

  if (fast.verdict === "pass") {
    return { allowed: true, trust: "passed" };
  }

  // Fast check didn't come back a clean pass -- get a second (and if needed
  // third) opinion before actually blocking a real user.
  const council = await runCouncil(prompt);
  for (const entry of council.entries) {
    await logGuardrailEvent({
      clerkUserId,
      stage: entry.stage,
      verdict: entry.verdict.verdict,
      reasoning: entry.verdict.reason,
      modelUsed: entry.modelUsed,
      latencyMs: entry.latencyMs,
    });
  }

  if (council.finalVerdict.verdict === "block") {
    return { allowed: false, trust: "blocked", reason: council.finalVerdict.reason };
  }
  // "flag" (from the council) still lets the generation through, but it's
  // visibly recorded -- flagging without blocking is itself a real product
  // decision (a false-block costs a paying user a real generation; a
  // false-pass here still has the output-side spot-check as a second line
  // of defense before delivery).
  return { allowed: true, trust: "passed" };
}
