import Link from "next/link";
import GalleryShowcase from "@/components/GalleryShowcase";

const BRANDS = ["Sora", "Veo", "Runway", "GPT Image", "Nano Banana"];

const STEPS = [
  { n: "01", title: "Pick Your Model", body: "Choose the model that fits your project. Each has strengths — pick one and go." },
  { n: "02", title: "Describe It", body: "Write what you want to see. A sentence is enough — the AI fills in the rest." },
  { n: "03", title: "Download & Use", body: "Your result is ready in seconds. Download it, post it, use it however you want." },
];

const TRIAL_POINTS = [
  "8 free credits, no card required",
  "Live image generation via GPT Image",
  "Every prompt screened by the guardrails council",
  "One free allowance per account",
];

const MOSAIC = [
  { src: "/generated/studio-example-image.png", label: "Cinematic still", wide: true },
  { src: "/generated/gallery-1.png", label: "Astronaut, balloons", wide: false },
  { src: "/generated/gallery-2.png", label: "Golden hour", wide: false },
  { src: "/generated/gallery-3.png", label: "Neon city", wide: false },
  { src: "/generated/gallery-4.png", label: "Workshop", wide: false },
];

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Sparkle() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.9 5.6L19.5 9.5 13.9 11.4 12 17l-1.9-5.6L4.5 9.5l5.6-1.9z" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-accent">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <video
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          src="/hero-bg.webm"
          poster="/generated/gallery-2.png"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-background/80 via-background/55 to-background"
        />

        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted backdrop-blur">
            <Sparkle />
            AI Video &amp; Image Creation
          </span>
          <h1 className="mt-6 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-6xl">
            Turn Ideas Into Reality
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Create videos and visuals so captivating, your audience can&apos;t scroll past. One prompt is all it takes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/generate/video"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Get Started <ArrowRight />
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:bg-surface"
            >
              Start Free Trial
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">8 free credits · No card required</p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted">
            <span className="uppercase tracking-widest">Powered by</span>
            {BRANDS.map((b) => (
              <span key={b} className="font-medium text-foreground/70">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Free credits panel */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-2xl border border-border bg-gradient-to-br from-surface to-background p-8 sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Free AI Credits</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Create anything. Start free.</h2>
            <p className="mt-3 max-w-md text-muted">
              8 free credits to generate AI videos and images with GPT Image, Veo, and more. No credit card, no commitment.
            </p>
            <Link
              href="/sign-up"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
            >
              Claim Free Credits <ArrowRight />
            </Link>
            <p className="mt-3 text-xs text-muted">Failed generations are never charged.</p>
          </div>
          <ul className="grid gap-3">
            {TRIAL_POINTS.map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm text-muted">
                <Check />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3-step */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Simple Workflow</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">From prompt to production.</h2>
        </div>
        <div className="grid gap-10 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="text-4xl font-bold text-muted/40">{s.n}</div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Production mosaic */}
      <section className="border-y border-border/80 bg-surface/40 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Production Grade Outputs</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Made for the big screen.</h2>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {MOSAIC.map((m) => (
              <div
                key={m.src}
                className={`group relative overflow-hidden rounded-xl border border-border ${m.wide ? "col-span-2 h-48 sm:h-64" : "h-40 sm:h-52"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.src}
                  alt={m.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GalleryShowcase />

      {/* Guardrails callout — the prominent, better-than-original addition */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Built-in trust &amp; safety</p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Every generation is checked, not just charged</h2>
          <p className="mt-3 max-w-2xl text-muted">
            A fast classifier screens every prompt; anything borderline gets a second, independent opinion from a
            different model provider before we act on it — never a single model&apos;s call alone. Failed generations
            are never charged. You can see the verdict on every single result.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-24 text-center sm:px-6 lg:px-8">
        <p className="text-xs text-muted">8 free credits · No card required</p>
        <h2 className="mt-2 text-3xl font-semibold">
          Start Creating <span className="text-accent">Today.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          One prompt. Cinematic videos and stunning visuals that stop the scroll — created in seconds, not hours.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/sign-up" className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover">
            Get Started
          </Link>
          <Link href="/upgrade" className="rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:bg-surface">
            View Pricing
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted">Most results ready in under a minute.</p>
      </section>
    </div>
  );
}
