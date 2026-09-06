# AzaisAi — Rebuild

An independent rebuild of [azaisai.com](https://azaisai.com) for the 8x take-home assignment, built end-to-end by Claude Code (Claude Sonnet 5) in a single directed session.

- **Live**: https://azaisai-rebuild-eight.vercel.app
- **Repo**: https://github.com/BeaconBandhu/azaisai-rebuild (includes `.agent-logs/`, per the assignment's capture requirement)

## What this is

AzaisAi is a credit-based AI video/image generation aggregator (Sora, Veo, Runway, GPT Image, Nano Banana). This rebuild keeps ~90% of the original's UI/UX intact — same page set, same dark/blue visual language, same generate-studio layout — while fixing real gaps found during recon and adding a genuinely new feature: a multi-model **guardrails/harness layer** that reviews every generation, not just charges for it.

Full recon notes and the gap analysis that drove these decisions live in [`recon/gap-analysis.md`](recon/gap-analysis.md).

## What's real vs. what's honestly simulated

| Area | Status |
|---|---|
| Auth (email + one-time code, no password) | **Real** — Clerk, custom flow |
| Database (profiles, credits, generations, subscriptions) | **Real** — Supabase Postgres |
| Billing (3 tiers + 3 credit top-ups) | **Real** — Stripe, **test mode** (no real charges) |
| Media storage | **Real** — Vercel Blob |
| Image generation: GPT Image | **Real** — via OpenAI directly (BYOK) or Vercel AI Gateway |
| Video generation: Veo 3 / Veo 3 Fast | **Real** — via Vercel AI Gateway |
| Video generation: Sora, Runway; legacy Veo 2 | **Preview mode** — not reachable through AI Gateway in this environment (no direct provider credentials for them); the full guardrails/credits/job pipeline still runs for real, the output is an honest labeled placeholder instead of a faked result |
| Image generation: Nano Banana 2 / 4K, Gen-4 Image | **Preview mode** — Gemini's image-output models return images through `generateText`'s multimodal output, not a dedicated `generateImage()` endpoint (confirmed by testing, not assumed); building that separate extraction path was out of scope for the time available |
| Guardrails council (2 independent judges + chairman) | **Real** — see below |
| Analytics (PostHog) | Provisioned but not yet terms-accepted at time of submission; the app degrades gracefully (no-ops) without it |
| Email (Resend) | Contact form stores to Postgres regardless; email send is best-effort and silently skipped without a key |

## The guardrails/harness layer (the prominent addition)

The brief asked for a real, prominent fix to a gap — not just a visual clone — and for this to be reviewed with an AI-harness-engineering lens. Recon found the original has **no visible trust/safety signal anywhere** in its generation flow: nothing tells a user why a prompt might fail, whether it was screened, or what happens to credits on failure.

Every generation now goes through:

1. **Rate limiting** — a sliding window per user (defense against runaway cost/abuse).
2. **Fast classifier** — a single cheap model call classifies the prompt. Clean prompts pass straight through.
3. **Escalation council** (only for prompts that aren't a clean pass) — two *architecturally independent* judges review the prompt in parallel: Claude via Vercel AI Gateway, and GPT-4o-mini called **directly against OpenAI's API** with a user-supplied key (not through the gateway) — a different network path and billing account, not just a different model string through the same proxy. If they agree, that's the verdict. If they disagree, a **chairman** model casts the deciding vote.
4. Every stage — pass or fail — is logged to `guardrail_events` and visible at `/admin/guardrails` (a demo view; gated behind sign-in in this build, not a real admin role).
5. Every generation shows a **Trust chip** (Passed / Flagged / Blocked / Failed—refunded) — the verdict is never hidden.

This is a three-stage pattern — independent responses → cross-review → chairman synthesis — credited to [karpathy/llm-council](https://github.com/karpathy/llm-council), applied here to moderation instead of general Q&A, per the assignment author's explicit request to bring in a second model for eval/harness work.

**A real bug this caught during testing**: this Vercel account is on the free AI Gateway tier, which rate-limits (429) under real load — including, on the first test run, the exact call meant to review a genuinely unsafe prompt (`scripts/test-pipeline.mjs`). That failure was being silently swallowed into a weak "flag" default, which would have let the prompt through. Fixed by preferring the reliable direct-OpenAI path over the shared gateway quota wherever possible, and by fixing the chairman's own failure fallback to resolve to the *stricter* of the two disputed verdicts instead of a hardcoded default. `scripts/test-pipeline.mjs` now passes 9/9 against live production infrastructure and is worth reading as the actual proof this works, not just compiles.

## Real gaps found in the original, and what we did about them

See [`recon/gap-analysis.md`](recon/gap-analysis.md) for the full list. The headline one: azaisai.com's marketing promises "8 free credits, no card required," but a freshly created, **email-verified** account actually shows **0 credits** with a dead-end "No credits available" button — the FAQ says the real gate is an undisclosed phone-number verification the signup form never even mentions. This rebuild grants the signup bonus immediately on verified email, with no phone gate at all, and documents the removed phone-OTP dependency as a deliberate, disclosed substitution (not a silent omission) since SMS delivery needs a paid provider this build doesn't have budget for.

Other small inconsistencies fixed by construction: the real site's own FAQ disagrees with its own UI on tier names and video durations. Here, `src/lib/models-catalog.ts` is the single source of truth the FAQ, pricing page, and generate studios all read from — they can't drift apart.

## Deliberately left out (conscious cuts, not oversights)

- **Team/workspace multi-seat access** — the original's copy targets "marketing teams" but the product has no team features at all. A real gap, real effort to do properly; cut for time.
- **Public developer API** — same reasoning; an aggregator like this is exactly what a team would want to script against.
- **Referral program.**
- **Output-side (post-generation) content spot-check** — the design supports it (`guardrail_verdict` has room for it), but doing it properly needs a vision-capable moderation call on the actual generated media, which was scoped out given the time budget; the pre-flight prompt council is the real line of defense in this build.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS 4 · Clerk (auth) · Supabase (Postgres) · Stripe (billing, test mode) · Vercel AI Gateway + direct OpenAI (BYOK) for generation and guardrails · Vercel Blob (media storage) · PostHog (analytics, pending) · deployed on Vercel.

## Local development

```bash
npm install
vercel env pull        # requires the project to be linked: vercel link
node scripts/migrate.mjs   # applies supabase/migrations/*.sql
npm run dev
```

## Testing

- `scripts/test-pipeline.mjs` — direct integration test of guardrails, credit ledger, real AI Gateway/direct-OpenAI generation, and Blob storage against production env vars. `npx tsx --env-file=.env.local scripts/test-pipeline.mjs`
- `recon/e2e-smoke.mjs` — browser-driven signup → generate → history smoke test using Clerk's documented test-email pattern. Currently blocked in this sandboxed environment by a Chrome-specific DNS resolution quirk on Clerk's Cloudflare Turnstile bot-protection widget (curl/nslookup resolve the same hostname fine from the same machine — it's specific to that Chrome process, not a system-wide or code issue); documented in the script's own header.
- `scripts/setup-stripe.mjs` — idempotent creation of the Stripe sandbox products/prices this app expects.

## Capture logs

`.agent-logs/` and `CAPTURE-TEST.md` document the Claude Code hook setup used to capture this entire build's prompts and final responses, verified across independent sessions before any product code was written, per the assignment's own requirement.
