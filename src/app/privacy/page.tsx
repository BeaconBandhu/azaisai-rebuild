export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-muted sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-foreground">Privacy Policy</h1>
      <p className="mt-6">
        This is a rebuild built for the 8x take-home assignment. We store your email (via Clerk), your generation
        history and credit ledger (via Supabase), and billing records (via Stripe, test mode). Prompts sent for
        moderation review may be processed by Anthropic and OpenAI models through Vercel AI Gateway or directly.
        Nothing is sold to third parties. This is a demo product — do not submit sensitive personal information.
      </p>
    </div>
  );
}
