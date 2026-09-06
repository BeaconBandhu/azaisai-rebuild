import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import TrustChip from "@/components/TrustChip";
import Link from "next/link";

interface Row {
  id: string;
  type: string;
  model_id: string;
  prompt: string;
  status: string;
  guardrail_verdict: string | null;
  output_url: string | null;
  is_preview_mode: boolean;
  created_at: string;
}

export default async function HistoryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?returnUrl=/history");
  const rows = await sql<Row[]>`
    select id, type, model_id, prompt, status, guardrail_verdict, output_url, is_preview_mode, created_at
    from generations where clerk_user_id = ${userId} order by created_at desc limit 60
  `;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">Workspace</p>
      <h1 className="mt-1 text-3xl font-semibold">History</h1>
      <p className="mt-1 text-sm text-muted">Review every generation, track status, and revisit past prompts.</p>

      {rows.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <p className="text-lg font-medium">No generations yet</p>
          <p className="text-sm text-muted">Start creating to see history here.</p>
          <Link href="/generate/video" className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
            Create your first video
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted">{r.type} · {r.model_id}</span>
                <TrustChip status={r.status === "completed" ? (r.guardrail_verdict ?? "passed") : r.status === "blocked" ? "blocked" : r.status} />
              </div>
              {r.output_url && r.type === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.output_url} alt={r.prompt} className="mt-3 aspect-video w-full rounded-lg object-cover" />
              )}
              {r.output_url && r.type === "video" && (
                <video src={r.output_url} controls className="mt-3 aspect-video w-full rounded-lg" />
              )}
              {r.is_preview_mode && !r.output_url && (
                <div className="mt-3 flex aspect-video items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted">
                  Preview mode — no live model
                </div>
              )}
              <p className="mt-3 line-clamp-2 text-sm text-muted">{r.prompt}</p>
              <p className="mt-2 text-xs text-muted">{new Date(r.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
