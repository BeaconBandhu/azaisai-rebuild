"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
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

type Props = { type: "video" | "image"; balance: number };

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

const EXAMPLES = [
  "/generated/gallery-1.png",
  "/generated/gallery-2.png",
  "/generated/gallery-3.png",
  "/generated/gallery-4.png",
];

function providerGlyph(provider: string): string {
  if (provider === "Runway") return "R";
  if (provider === "Google" || provider === "Veo") return "G";
  return "◉"; // Sora / OpenAI
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-4 border-t border-border/60 pt-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-xs transition ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border text-muted hover:border-border/60 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function GenerateStudio({ type, balance }: Props) {
  const models = (type === "video" ? VIDEO_MODELS : IMAGE_MODELS) as (VideoModel | ImageModel)[];
  // Default to a live model when one exists, so a first-time generation
  // returns real output instead of landing on a preview-mode model by
  // accident (found by testing: sora-standard was models[0] and not live,
  // so every new user's very first generation looked "broken").
  const defaultModel = models.find((m) => m.live) ?? models[0];
  const [modelId, setModelId] = useState(defaultModel.id);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<string>(type === "video" ? ASPECT_RATIOS_VIDEO[0] : ASPECT_RATIOS_IMAGE[0]);
  const [duration, setDuration] = useState<number>(DURATIONS[0]);
  const [style, setStyle] = useState<string>(IMAGE_STYLES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const activeModel = models.find((m) => m.id === modelId);
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
    } catch {
      setResult({ id: "", status: "failed", reason: "Network error." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-2xl border border-border bg-surface lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="border-b border-border p-5 lg:border-b-0 lg:border-r">
          <h1 className="px-1 text-base font-semibold tracking-tight">
            {type === "video" ? "Video Studio" : "Image Studio"}
          </h1>

          <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1 text-xs">
            <Link
              href="/generate/video"
              className={`rounded-md py-2 text-center font-medium transition ${
                type === "video" ? "bg-border/70 text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              Text → Video
            </Link>
            <Link
              href="/generate/image"
              className={`rounded-md py-2 text-center font-medium transition ${
                type === "image" ? "bg-border/70 text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              Text → Image
            </Link>
          </div>

          <p className="mt-6 px-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">Model</p>
          <div className="mt-2 grid gap-1.5">
            {models.map((m) => {
              const active = modelId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModelId(m.id)}
                  className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition ${
                    active ? "border-border bg-surface-2" : "border-transparent hover:bg-surface-2/60"
                  } ${!m.live ? "opacity-80" : ""}`}
                >
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-surface-2 text-[11px] font-bold text-muted">
                    {providerGlyph(m.provider)}
                  </span>
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate text-xs font-medium">{m.label}</span>
                    <span className="text-[10px] text-muted">
                      {"creditsPerSecond" in m ? `${m.creditsPerSecond.toFixed(1)} cr/s` : `${m.credits} cr`} · {m.approxTime}
                    </span>
                  </span>
                  {!m.live ? (
                    <span className="ml-auto flex-none rounded bg-warning/15 px-1.5 py-0.5 text-[9px] font-semibold text-warning">
                      PREVIEW
                    </span>
                  ) : m.badge ? (
                    <span className={`ml-auto flex-none rounded px-1.5 py-0.5 text-[9px] font-semibold ${BADGE_STYLES[m.badge]}`}>
                      {m.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main */}
        <section className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">AI Creator</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {type === "video" ? "Video Studio" : "Text to Image"}
              </h2>
            </div>
            <span className="flex flex-none items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted">
              ⚡ {balance} credits
            </span>
          </div>

          {!activeModel?.live && (
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
              <strong>Preview mode:</strong> this model isn&apos;t reachable through Vercel AI Gateway in this
              environment, so generating returns a labeled placeholder, not a real result. The guardrails and
              credits pipeline still runs for real — pick a model without this badge for actual output.
            </div>
          )}

          {/* Prompt */}
          <div className="mt-4 rounded-xl border border-border bg-surface-2">
            <label htmlFor="prompt" className="block px-4 pt-3 text-[11px] text-muted">
              Describe your {type}
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder={
                type === "video"
                  ? "A cinematic drone shot flying through a futuristic city at night, rain, neon reflections, dramatic lighting..."
                  : "A cinematic portrait of a woman in a futuristic city at night, neon reflections, volumetric light..."
              }
              className="w-full resize-y bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted/50"
            />
            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted">
              <span>Be specific — name the subject, setting, and mood.</span>
              <span>{prompt.length}/2000</span>
            </div>
          </div>

          {/* Settings */}
          <div className="mt-3 rounded-xl border border-border p-4">
            <p className="flex items-center gap-2 text-xs font-semibold">
              <GearIcon /> {type === "video" ? "Settings" : "Style & Settings"}
            </p>

            {type === "image" && (
              <SettingRow label="Style">
                {IMAGE_STYLES.map((s) => (
                  <Choice key={s} active={style === s} onClick={() => setStyle(s)}>
                    {s}
                  </Choice>
                ))}
              </SettingRow>
            )}

            <SettingRow label="Aspect ratio">
              {(type === "video" ? ASPECT_RATIOS_VIDEO : ASPECT_RATIOS_IMAGE).map((ar) => (
                <Choice key={ar} active={aspectRatio === ar} onClick={() => setAspectRatio(ar)}>
                  {ar}
                </Choice>
              ))}
            </SettingRow>

            {type === "video" && (
              <SettingRow label="Duration">
                {DURATIONS.map((d) => (
                  <Choice key={d} active={duration === d} onClick={() => setDuration(d)}>
                    {d}s
                  </Choice>
                ))}
              </SettingRow>
            )}
          </div>

          {/* Generate bar */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="text-xs">
              <p className="text-muted">Estimated cost</p>
              <p className="mt-0.5 font-semibold">{cost} credits</p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={submitting || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
            >
              {submitting ? "Generating…" : `Generate ${type}`}
            </button>
          </div>

          {/* Result */}
          <div className="mt-5 overflow-hidden rounded-xl border border-border bg-surface-2">
            {result ? (
              <ResultPanel result={result} type={type} />
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-1 p-8 text-center text-sm text-muted">
                <span>Your {type} will appear here</span>
                <span className="text-xs text-muted/60">Every generation is screened by the guardrails council first.</span>
              </div>
            )}
          </div>

          {/* Examples */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Example generations</span>
              <Link href="/history" className="hover:text-foreground">
                View all →
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EXAMPLES.map((src) => (
                <div key={src} className="group relative overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt="Example generation"
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white backdrop-blur">
                    {type === "video" ? `${duration}s · ${aspectRatio}` : `AI output · ${aspectRatio}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ResultPanel({ result, type }: { result: GenerateResponse; type: "video" | "image" }) {
  if (result.status === "blocked") {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-8 text-center">
        <TrustChip status="blocked" />
        <p className="max-w-sm text-sm text-muted">{result.reason}</p>
      </div>
    );
  }
  if (result.status === "failed") {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-8 text-center">
        <TrustChip status="failed" />
        <p className="max-w-sm text-sm text-muted">{result.reason}</p>
      </div>
    );
  }
  if (result.isPreviewMode) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-8 text-center">
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
    <div className="relative flex min-h-[300px] flex-col items-center justify-center gap-3 p-4">
      <div className="absolute right-4 top-4">
        <TrustChip status="passed" />
      </div>
      {type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={result.outputUrl ?? ""} alt="Generated result" className="max-h-[500px] rounded-lg object-contain" />
      ) : (
        <video src={result.outputUrl ?? ""} controls className="max-h-[500px] rounded-lg" />
      )}
    </div>
  );
}
