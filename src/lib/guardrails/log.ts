import { sql } from "../db";

export async function logGuardrailEvent(entry: {
  generationId?: string;
  clerkUserId: string;
  stage: string;
  verdict: string;
  reasoning?: string;
  modelUsed?: string;
  latencyMs?: number;
}) {
  await sql`
    insert into guardrail_events (generation_id, clerk_user_id, stage, verdict, reasoning, model_used, latency_ms)
    values (${entry.generationId ?? null}, ${entry.clerkUserId}, ${entry.stage}, ${entry.verdict}, ${entry.reasoning ?? null}, ${entry.modelUsed ?? null}, ${entry.latencyMs ?? null})
  `;
}
