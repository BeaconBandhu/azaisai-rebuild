export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold">About AzaisAi</h1>
      <div className="mt-6 space-y-4 text-muted">
        <p>
          AzaisAi was built to make professional-grade AI video and image generation accessible without needing
          technical expertise, a dev team, or five separate subscriptions.
        </p>
        <p>
          We consolidate leading generation models — Sora, Veo, Runway, GPT Image and more — into a single
          interface, so going from a prompt to a finished asset takes one platform, not five tabs.
        </p>
        <p>
          This build is an independent rebuild made for the 8x take-home assignment, not affiliated with the
          original azaisai.com. It keeps the product&apos;s visual language and core flows while fixing a few things
          we found along the way — see <a href="/faq" className="text-accent hover:underline">the FAQ</a> for specifics.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-foreground">Our commitments</h2>
        <ul className="space-y-2">
          <li>No watermarks on paid plans</li>
          <li>Your content stays private — no sharing, no training on your prompts</li>
          <li>No charges for failed generations, ever</li>
          <li>Cancel anytime, no retention dark patterns</li>
        </ul>
      </div>
    </div>
  );
}
