import { sql } from "./db";
import { SIGNUP_BONUS_CREDITS } from "./models-catalog";

export type LedgerReason =
  | "signup_bonus"
  | "subscription_grant"
  | "topup_purchase"
  | "generation_spend"
  | "generation_refund"
  | "admin_adjustment";

/** Ensures a profiles row exists for this Clerk user, granting the signup
 * bonus exactly once (idempotent — safe to call on every request). */
export async function ensureProfile(clerkUserId: string, email: string) {
  const rows = await sql<{ credits_balance: number }[]>`
    insert into profiles (clerk_user_id, email, credits_balance)
    values (${clerkUserId}, ${email}, 0)
    on conflict (clerk_user_id) do update set email = excluded.email
    returning credits_balance
  `;
  const existed = await sql<{ n: number }[]>`
    select count(*)::int as n from credit_ledger
    where clerk_user_id = ${clerkUserId} and reason = 'signup_bonus'
  `;
  if (existed[0].n === 0) {
    await grantCredits(clerkUserId, SIGNUP_BONUS_CREDITS, "signup_bonus");
  }
  return rows[0];
}

export async function getBalance(clerkUserId: string): Promise<number> {
  const rows = await sql<{ credits_balance: number }[]>`
    select credits_balance from profiles where clerk_user_id = ${clerkUserId}
  `;
  return rows[0]?.credits_balance ?? 0;
}

async function adjustBalance(clerkUserId: string, delta: number, reason: LedgerReason, relatedGenerationId?: string) {
  return sql.begin(async (tx) => {
    await tx`
      insert into credit_ledger (clerk_user_id, delta, reason, related_generation_id)
      values (${clerkUserId}, ${delta}, ${reason}, ${relatedGenerationId ?? null})
    `;
    const rows = await tx<{ credits_balance: number }[]>`
      update profiles set credits_balance = credits_balance + ${delta}, updated_at = now()
      where clerk_user_id = ${clerkUserId}
      returning credits_balance
    `;
    return rows[0]?.credits_balance ?? 0;
  });
}

export function grantCredits(clerkUserId: string, amount: number, reason: LedgerReason) {
  return adjustBalance(clerkUserId, Math.abs(amount), reason);
}

/** Atomically spends credits only if the balance covers it; returns null if
 * insufficient (never leaves a negative balance from a race). */
export async function trySpendCredits(clerkUserId: string, amount: number, relatedGenerationId?: string) {
  return sql.begin(async (tx) => {
    const rows = await tx<{ credits_balance: number }[]>`
      update profiles set credits_balance = credits_balance - ${amount}, updated_at = now()
      where clerk_user_id = ${clerkUserId} and credits_balance >= ${amount}
      returning credits_balance
    `;
    if (rows.length === 0) return null;
    await tx`
      insert into credit_ledger (clerk_user_id, delta, reason, related_generation_id)
      values (${clerkUserId}, ${-amount}, 'generation_spend', ${relatedGenerationId ?? null})
    `;
    return rows[0].credits_balance;
  });
}

export function refundCredits(clerkUserId: string, amount: number, relatedGenerationId?: string) {
  return adjustBalance(clerkUserId, Math.abs(amount), "generation_refund", relatedGenerationId);
}
