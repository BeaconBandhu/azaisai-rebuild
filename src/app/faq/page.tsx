import { TIERS, DURATIONS, SIGNUP_BONUS_CREDITS } from "@/lib/models-catalog";

const faqs = [
  { q: "What is AzaisAi?", a: "AzaisAi is an AI video and image generation platform that gives you access to the world's best AI models — including Sora, Veo, and Runway — in one place." },
  { q: "What AI models do you use?", a: "Sora Standard/Pro, Veo 2/3/3 Fast, and Runway Gen-3/4/4.5 for video; GPT Image, Nano Banana 2, and Gen-4 Image for images." },
  {
    q: "What's the difference between the plans?",
    a: `All plans give you access to the same models. The difference is how many credits you get per month. ${TIERS.map((t) => `${t.label} offers ${t.creditsPerMonth}`).join(", ")}.`,
  },
  { q: "How do credits work? What costs how many credits?", a: "Credits fund generations. Video costs 1–3 credits per second depending on the model; images cost 1–2 credits each." },
  { q: "Can I use generated content commercially?", a: "Yes. All paid plan subscribers can use their generated content for commercial purposes. Free tier outputs are watermarked, for personal use only." },
  { q: "How long does generation take?", a: "Most generations complete within 30–90 seconds depending on the model and current load." },
  { q: "Why did my generation fail or get blocked?", a: "Every prompt passes through a fast safety check, and anything borderline gets a second, independent opinion from a different model before we act on it. Blocked and failed generations are never charged — see your History page for the exact reason." },
  { q: "Do credits expire?", a: "Monthly credits reset each cycle without rollover. One-time top-up purchases remain valid for 12 months." },
  { q: "Can I cancel my subscription?", a: "Yes, any time from Account → Manage billing. Your plan stays active until the end of the current billing period." },
  {
    q: "Is there a free trial or free credits?",
    a: `New accounts receive ${SIGNUP_BONUS_CREDITS} free credits the moment your email is verified — no phone number, no credit card. (The original azaisai.com gates this behind a phone-number step its own signup form doesn't even show; we didn't replicate that friction — see the repo's recon/gap-analysis.md for details.)`,
  },
  { q: "What video formats and durations are supported?", a: `Generated videos are delivered as MP4 in the durations shown on the Video Studio page (${DURATIONS.join("s, ")}s).` },
  { q: "How do I download my generated content?", a: "A download/open action appears on completed results in your History page." },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold">Frequently asked questions</h1>
      <div className="mt-8 divide-y divide-border">
        {faqs.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="cursor-pointer list-none font-medium marker:content-none">
              {f.q}
            </summary>
            <p className="mt-2 text-sm text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
