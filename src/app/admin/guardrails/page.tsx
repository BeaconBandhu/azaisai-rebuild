import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import TrustChip from "@/components/TrustChip";

interface EventRow {
  id: string;
  generation_id: string | null;
  stage: string;
  verdict: string;
  reasoning: string | null;
  model_used: string | null;
  latency_ms: number | null;
  created_at: string;
}

export default async function AdminGuardrailsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?returnUrl=/admin/guardrails");

  const events = await sql<EventRow[]>`
    select id, generation_id, stage, verdict, reasoning, model_used, latency_ms, created_at
    from guardrail_events order by created_at desc limit 100
  `;
  const [stats] = await sql<{ total: number; blocked: number; flagged: number; council_escalations: number }[]>`
    select
      count(*) filter (where stage = 'fast_check')::int as total,
      count(*) filter (where stage = 'fast_check' and verdict = 'block')::int as blocked,
      count(*) filter (where stage = 'fast_check' and verdict = 'flag')::int as flagged,
      count(distinct generation_id) filter (where stage in ('council_judge_a','chairman'))::int as council_escalations
    from guardrail_events
  `;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">Trust &amp; Safety</p>
      <h1 className="mt-1 text-3xl font-semibold">Guardrails observability</h1>
      <p className="mt-1 text-sm text-muted">
        Demo admin view — visible to any signed-in user in this build; a real deployment would gate this behind an
        admin role. Every decision below is real, not illustrative.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Fast checks run", value: stats?.total ?? 0 },
          { label: "Blocked at fast check", value: stats?.blocked ?? 0 },
          { label: "Flagged → escalated", value: stats?.flagged ?? 0 },
          { label: "Council escalations", value: stats?.council_escalations ?? 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Stage</th>
              <th className="px-4 py-2">Verdict</th>
              <th className="px-4 py-2">Model</th>
              <th className="px-4 py-2">Latency</th>
              <th className="px-4 py-2">Reasoning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2 text-xs text-muted">{new Date(e.created_at).toLocaleTimeString()}</td>
                <td className="px-4 py-2 text-xs">{e.stage}</td>
                <td className="px-4 py-2"><TrustChip status={e.verdict === "pass" ? "passed" : e.verdict === "flag" ? "flagged" : "blocked"} /></td>
                <td className="px-4 py-2 text-xs text-muted">{e.model_used ?? "—"}</td>
                <td className="px-4 py-2 text-xs text-muted">{e.latency_ms ? `${e.latency_ms}ms` : "—"}</td>
                <td className="px-4 py-2 max-w-xs truncate text-xs text-muted" title={e.reasoning ?? ""}>{e.reasoning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
