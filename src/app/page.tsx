import Link from "next/link";
import GalleryShowcase from "@/components/GalleryShowcase";

const SHOWCASE_BRANDS = ["Sora", "Veo", "Runway", "GPT Image", "Nano Banana"];

export default function HomePage() {

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-24 text-center sm:px-6 lg:px-8">
        <h1 className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-6xl">
          Turn Ideas Into Reality
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
          Create videos and visuals so captivating, your audience can&apos;t scroll past. One prompt is all it takes.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/generate/video"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Get Started →
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted">8 free credits · No card required</p>

        <div className="relative mx-auto mt-12 aspect-video max-w-3xl overflow-hidden rounded-2xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/generated/studio-example-video.png" alt="Example generation" className="h-full w-full object-cover" />
        </div>
      </section>

      {/* 3-step */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          {[
            { n: "01", title: "Pick Your Model", body: "Choose the model that fits your project. Each has strengths — pick one and go." },
            { n: "02", title: "Describe It", body: "Write what you want to see. A sentence is enough — the AI fills in the rest." },
            { n: "03", title: "Download & Use", body: "Your video is ready in seconds. Download it, post it, use it however you want." },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <div className="text-4xl font-bold text-muted/40">{s.n}</div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Model showcase */}
      <section className="border-y border-border/80 bg-surface/40 py-14">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Production Grade Outputs</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {SHOWCASE_BRANDS.map((p) => (
              <span key={p} className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted">
                {p}
              </span>
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
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/sign-up" className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover">
            Get Started
          </Link>
          <Link href="/upgrade" className="rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:bg-surface">
            View Pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
