"use client";

import { useState } from "react";
import {
  VIDEO_MODELS,
  IMAGE_MODELS,
  ASPECT_RATIOS_VIDEO,
  ASPECT_RATIOS_IMAGE,
  DURATIONS,
  IMAGE_STYLES,
  videoCost,
  imageCost,
  type VideoModel,
  type ImageModel,
} from "@/lib/models-catalog";
import TrustChip from "./TrustChip";

type Props = { type: "video" } | { type: "image" };

interface GenerateResponse {
  id: string;
  status: "completed" | "blocked" | "failed";
  reason?: string;
  outputUrl?: string | null;
  isPreviewMode?: boolean;
}

const BADGE_STYLES: Record<string, string> = {
  Popular: "bg-accent/15 text-accent",
  Premium: "bg-purple-500/15 text-purple-300",
  Fast: "bg-success/15 text-success",
  New: "bg-blue-400/15 text-blue-300",
  "4K": "bg-pink-500/15 text-pink-300",
};

export default function GenerateStudio({ type }: Props) {
  const models = (type === "video" ? VIDEO_MODELS : IMAGE_MODELS) as (VideoModel | ImageModel)[];
  const [modelId, setModelId] = useState(models[0].id);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<string>(type === "video" ? ASPECT_RATIOS_VIDEO[0] : ASPECT_RATIOS_IMAGE[0]);
  const [duration, setDuration] = useState<number>(DURATIONS[0]);
  const [style, setStyle] = useState<string>(IMAGE_STYLES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [showExample, setShowExample] = useState(true);

  const cost = type === "video" ? videoCost(modelId, duration) : imageCost(modelId);

  async function handleGenerate() {
    if (!prompt.trim() || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          modelId,
          prompt,
          aspectRatio,
          durationSeconds: type === "video" ? duration : undefined,
          style: type === "image" ? style : undefined,
        }),
      });
      const data = (await res.json()) as GenerateResponse;
      setResult(data);
      setShowExample(false);
    } catch {
      setResult({ id: "", status: "failed", reason: "Network error." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
      {/* Controls */}
      <div className="w-full shrink-0 lg:w-80">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{type === "video" ? "Video Studio" : "Image Studio"}</h1>
          <span className="text-xs uppercase tracking-wide text-muted">{type === "video" ? "Text → Video" : "Text → Image"}</span>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Model</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => setModelId(m.id)}
                className={`rounded-lg border p-2.5 text-left transition ${
                  modelId === m.id ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-border/60"
                } ${!m.live ? "opacity-70" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{m.label}</span>
                  {m.badge && (
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${BADGE_STYLES[m.badge]}`}>{m.badge}</span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-muted">
                  {"creditsPerSecond" in m ? `${m.creditsPerSecond.toFixed(1)} cr/s` : `${m.credits} cr`} · {m.approxTime}
                  {!m.live && " · Preview"}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Describe your {type}</p>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder={type === "video" ? "A neon-lit city drone shot with slow cinematic movement..." : "A majestic mountain landscape at golden hour..."}
            className="mt-2 w-full rounded-lg border border-border bg-surface-2 p-3 text-sm outline-none ring-accent focus:ring-2"
          />
        </div>

        <div className="mt-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Settings</p>
          <div>
            <p className="mb-1.5 text-xs text-muted">Aspect ratio</p>
            <div className="flex flex-wrap gap-2">
              {(type === "video" ? ASPECT_RATIOS_VIDEO : ASPECT_RATIOS_IMAGE).map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${aspectRatio === ar ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"}`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {type === "video" && (
            <div>
              <p className="mb-1.5 text-xs text-muted">Duration</p>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`rounded-md border px-2.5 py-1 text-xs ${duration === d ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"}`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === "image" && (
            <div>
              <p className="mb-1.5 text-xs text-muted">Style</p>
              <div className="flex flex-wrap gap-2">
                {IMAGE_STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`rounded-md border px-2.5 py-1 text-xs ${style === s ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-muted">Estimated cost</span>
          <span className="rounded-md border border-border bg-surface px-2 py-1 text-xs">⚡ {cost} credits</span>
        </div>

        <button
          onClick={handleGenerate}
          disabled={submitting || !prompt.trim()}
          className="mt-4 w-full rounded-md bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting ? "Generating..." : `Generate ${type}`}
        </button>
      </div>

      {/* Preview */}
      <div className="min-h-[420px] flex-1 rounded-2xl border border-border bg-surface">
        {result ? (
          <ResultPanel result={result} type={type} />
        ) : showExample ? (
          <div className="flex h-full min-h-[420px] items-center justify-center p-8 text-center text-sm text-muted">
            <div>
              <div className="mx-auto h-10 w-10 rounded-full border border-border" />
              <p className="mt-3">Example preview — generate your own to replace it.</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-muted">Your creation will appear here</div>
        )}
      </div>
    </div>
  );
}

function ResultPanel({ result, type }: { result: GenerateResponse; type: "video" | "image" }) {
  if (result.status === "blocked") {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 p-8 text-center">
        <TrustChip status="blocked" />
        <p className="max-w-sm text-sm text-muted">{result.reason}</p>
      </div>
    );
  }
  if (result.status === "failed") {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 p-8 text-center">
        <TrustChip status="failed" />
        <p className="max-w-sm text-sm text-muted">{result.reason}</p>
      </div>
    );
  }
  if (result.isPreviewMode) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 p-8 text-center">
        <TrustChip status="passed" />
        <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
          Preview mode
        </span>
        <p className="max-w-sm text-sm text-muted">
          This model isn&apos;t reachable through Vercel AI Gateway in this environment (no provider credentials for
          it here), so this is a labeled placeholder rather than a faked result — the guardrails and credits
          pipeline you just went through was real.
        </p>
      </div>
    );
  }
  return (
    <div className="relative flex h-full min-h-[420px] flex-col items-center justify-center gap-3 p-4">
      <div className="absolute right-4 top-4"><TrustChip status="passed" /></div>
      {type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={result.outputUrl ?? ""} alt="Generated result" className="max-h-[500px] rounded-lg object-contain" />
      ) : (
        <video src={result.outputUrl ?? ""} controls className="max-h-[500px] rounded-lg" />
      )}
    </div>
  );
}
