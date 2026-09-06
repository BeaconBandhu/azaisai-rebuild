# AzaisAi — Recon & Gap Analysis

Sources: unauthenticated marketing/FAQ/pricing pages (fetched directly), plus a real
signed-in walkthrough (email-OTP signup, `/generate/video`, `/generate/image`,
`/history`, `/upgrade`) done manually by the account owner in their own Chrome
profile — Cloudflare Turnstile correctly blocks Playwright automation on the
signup form, so that one step stayed human-in-the-loop rather than fought with
stealth tooling. Screenshots were reviewed live in this conversation.

## Confirmed structure

- **Public nav**: Video Generation, Image Generation, FAQ, Pricing, Sign in, Sign Up Free — plus About/Contact in the footer only.
- **Authenticated nav**: Video Generation, Image Generation, History, FAQ, Pricing pill, credit balance (`⚡ N cr`), avatar initials, language selector. No About/Contact in the authenticated header.
- **Auth**: passwordless, email + one-time code only. No password field anywhere, no phone number field on the signup form itself. Cloudflare Turnstile gates the "Send code" button.
- **Video Studio** (`/generate/video`): Text/Image mode toggle · 8 models in a 2-col grid (Sora Standard "Popular" 1.0cr/s ~2m, Sora Pro "Premium" 2.0cr/s ~3m, Veo 2 3.0cr/s ~45s, Veo 3 Fast "Fast" 1.5cr/s ~35s, Veo 3 "New" 3.0cr/s ~1m, Gen-4 Turbo "Popular" 1.0cr/s ~2m, Gen-4.5 "Premium" 1.2cr/s ~2m, Gen-3 Alpha Turbo "Fast" 1.0cr/s ~1m) · prompt box with Enhance/Variation actions · aspect ratio (16:9/9:16) · duration (4s/8s/12s — FAQ claims 4/6/8s, actual UI disagrees) · live estimated-cost readout · right-hand preview pane that shows a toggleable "Example" until a real generation exists.
- **Image Studio** (`/generate/image`): 4 models (GPT Image "Premium" 2cr ~10s, Nano Banana 2 "New" 1cr ~8s, Nano Banana 2 4K 2cr ~15s, Gen-4 Image "New" 1cr ~20s) · style swatches (None/Cinematic/Anime/Photo/Illustration/…) · 5 aspect ratios (16:9, 1:1, 9:16, 4:3, 3:4) · same prompt/cost pattern as video.
- **History**: filter chips (All/Video/Image/Processing) + search, clean empty state ("No generations yet" + "Create your first video" CTA).
- **Pricing** (`/upgrade`): 3 subscription cards — Starter $16.90/mo (60 credits), Pro $32.90/mo (180 credits, "Most Popular"), Business $65.90/mo (420 credits) — plus 3 one-time top-up cards (100/200/300 credits at $37.90/$53.90/$62.90). Note the FAQ calls the entry tier "Premium"; the real UI calls it "Starter" — their own docs disagree with their own product.

## Gaps found (and what we do about them)

1. **Free-credit bait-and-switch.** Marketing everywhere says "8 free credits · no card required," but a freshly created, email-verified account shows **0 credits** and a blocked "No credits available" generate button, with no visible next step on that same screen. The FAQ says the 8 credits actually require a *phone-number* verification the signup form never mentions — a second, hidden gate. This is a real conversion killer: a brand-new user's first action in the product is a dead end.
   - **Fix in the rebuild**: grant a small number of credits immediately on verified email (no phone gate at all — see item 2), and if we ever add a secondary verification tier, surface it as an explicit, visible next step exactly where the block happens ("Verify your phone for 5 more free credits →"), never as a silent zero.
2. **SMS/phone OTP is a paid, unfree dependency we're not going to fake.** Removed entirely; email verification is the only gate in the rebuild. Documented as a deliberate, disclosed substitution in the README, not a silent omission.
3. **No contextual upgrade nudge at the point of blockage.** When blocked by credits, the only path forward is to notice the "Pricing" pill in the header yourself. The rebuild puts a "Get credits" affordance directly inline with the block.
4. **Internal copy inconsistency** (FAQ vs. real UI on tier names and durations) — small, but it's the kind of thing that erodes trust. The rebuild keeps FAQ copy and UI copy generated from the same source of truth (one model/tier catalog file) so they can't drift.
5. **No visible trust/safety signal anywhere in the generation flow.** Nothing tells a user why a prompt might fail, whether it was screened, or what happens to their credits if a model call errors (the FAQ states credits aren't charged on failure, but nothing in the UI itself says so). This is the opening for the rebuild's prominent addition: a per-generation guardrails/"Trust" chip (Passed / Flagged / Fallback used / Refunded) — see the main plan.
6. **No team/workspace access despite "marketing teams" being a named target audience**, and **no developer/API access** despite the product being an aggregator marketing teams would want to script against. Both are real, legible gaps — explicitly left out of the 12-hour rebuild and noted in the README as conscious cuts, not oversights.

## Patterns worth keeping almost exactly (the 90% parity target)

- Two-pane studio layout: controls on the left, a large live preview on the right with a toggleable "Example" state before the user's first real generation.
- Per-model cost/time transparency shown inline on every model card, plus a running estimated-cost readout before committing.
- Consistent badge vocabulary (Popular / Premium / Fast / New / 4K) and a dark, blue-accented visual language throughout.
- Clean, friendly empty states with a direct CTA (History's "No generations yet → Create your first video").
- Pricing page split into subscription tiers vs. one-time top-ups as two visually distinct sections.
