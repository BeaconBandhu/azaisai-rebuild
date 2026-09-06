import { sql } from "../db";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 6;

/** Sliding-window abuse guard: counts this user's generation rows created in
 * the last WINDOW_SECONDS. Cheap (one indexed query), no Redis needed for a
 * 12-hour build's traffic scale. */
export async function checkRateLimit(clerkUserId: string): Promise<{ ok: boolean; reason?: string }> {
  const rows = await sql<{ n: number }[]>`
    select count(*)::int as n from generations
    where clerk_user_id = ${clerkUserId}
      and created_at > now() - (${WINDOW_SECONDS} || ' seconds')::interval
  `;
  if (rows[0].n >= MAX_REQUESTS_PER_WINDOW) {
    return { ok: false, reason: `Rate limit: max ${MAX_REQUESTS_PER_WINDOW} generations per ${WINDOW_SECONDS}s.` };
  }
  return { ok: true };
}
