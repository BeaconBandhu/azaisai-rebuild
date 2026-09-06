const STYLES: Record<string, string> = {
  passed: "bg-success/10 text-success border-success/30",
  flagged: "bg-warning/10 text-warning border-warning/30",
  blocked: "bg-danger/10 text-danger border-danger/30",
  rate_limited: "bg-danger/10 text-danger border-danger/30",
  fallback_used: "bg-warning/10 text-warning border-warning/30",
  failed: "bg-danger/10 text-danger border-danger/30",
};

const LABELS: Record<string, string> = {
  passed: "Passed",
  flagged: "Flagged",
  blocked: "Blocked",
  rate_limited: "Rate limited",
  fallback_used: "Fallback used",
  failed: "Failed — refunded",
};

export default function TrustChip({ status }: { status: string }) {
  const key = status in STYLES ? status : "passed";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${STYLES[key]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[key] ?? status}
    </span>
  );
}
