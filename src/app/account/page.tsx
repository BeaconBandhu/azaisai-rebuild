import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getBalance } from "@/lib/credits";
import ManageBillingButton from "@/components/ManageBillingButton";

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?returnUrl=/account");
  const user = await currentUser();
  const balance = await getBalance(userId);
  const [profile] = await sql<{ subscription_tier: string | null; subscription_status: string | null }[]>`
    select subscription_tier, subscription_status from profiles where clerk_user_id = ${userId}
  `;
  const [usage] = await sql<{ n: number; spent: number }[]>`
    select count(*)::int as n, coalesce(sum(-delta),0)::int as spent from credit_ledger
    where clerk_user_id = ${userId} and reason = 'generation_spend' and created_at > now() - interval '30 days'
  `;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold">Account</h1>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Profile</h2>
        <p className="mt-2 text-sm text-muted">{user?.primaryEmailAddress?.emailAddress}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Credits</h2>
          <span className="rounded-full border border-border px-3 py-1 text-sm">⚡ {balance} cr</span>
        </div>
        <p className="mt-2 text-sm text-muted">
          {usage?.n ?? 0} generations · {usage?.spent ?? 0} credits used in the last 30 days
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Subscription</h2>
          <span className="rounded-full border border-border px-3 py-1 text-sm capitalize">
            {profile?.subscription_tier ? `${profile.subscription_tier} · ${profile.subscription_status}` : "Free"}
          </span>
        </div>
        <div className="mt-4">
          <ManageBillingButton />
        </div>
      </div>
    </div>
  );
}
