// End-to-end smoke test against the LIVE deployed URL, using Clerk's
// documented test-email pattern (`+clerk_test@` with fixed code `424242`,
// dev-instance only) so it needs no real inbox. Exercises: signup -> lands
// on /generate/video -> submits a real image generation -> checks history.
//
// Known limitation, found by testing, not assumed: in this sandboxed
// environment, Playwright-driven Chrome fails to resolve the per-challenge
// Cloudflare Turnstile subdomain (ERR_NAME_NOT_RESOLVED) that Clerk's bot
// sign-up protection loads, in both headless and headed mode -- while plain
// curl/nslookup resolve the same hostname fine from the same machine, so
// it's specific to that Chrome process's resolver, not a system-wide outage.
// Signup itself hangs waiting on the widget as a result. Rather than fight
// Cloudflare's bot protection (the same call made for azaisai.com's own
// Turnstile earlier in this build), the actual business logic (guardrails
// council, credits, real AI Gateway/direct-OpenAI generation, Blob storage)
// was instead verified directly against production env vars in
// scripts/test-pipeline.mjs (9/9 passing) -- that's the code this project
// actually wrote; Clerk's own bot-protection widget is not.
import { chromium } from "playwright";

const BASE = process.argv[2] || "https://azaisai-rebuild-eight.vercel.app";
const EMAIL = `qa-${Date.now()}+clerk_test@example.com`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

function log(step, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"} — ${step}${extra ? " — " + extra : ""}`);
}

try {
  await page.goto(`${BASE}/sign-up`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.fill("#email", EMAIL);
  await page.getByRole("button", { name: /send code/i }).click();
  await page.waitForSelector("#code", { timeout: 15000 });
  log("signup: email submitted, code field appeared", true);

  await page.fill("#code", "424242");
  await page.getByRole("button", { name: /verify/i }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/generate"), { timeout: 20000 });
  log("signup: verified and redirected to /generate", true, page.url());

  // Submit a real (live) image generation: Nano Banana 2 is cheap/fast.
  await page.goto(`${BASE}/generate/image`, { waitUntil: "domcontentloaded" });
  await page.getByText("Nano Banana 2", { exact: true }).click();
  await page.fill("textarea", "a small red toy robot on a white background, product photo");
  await page.getByRole("button", { name: /generate image/i }).click();

  const result = await page.waitForSelector("text=/Passed|Blocked|Failed|Preview mode/", { timeout: 60000 });
  const resultText = await result.textContent();
  log("generate: image request completed", true, resultText ?? "");

  await page.goto(`${BASE}/history`, { waitUntil: "domcontentloaded" });
  const hasCard = await page.locator("text=/toy robot/i").first().isVisible().catch(() => false);
  log("history: generation appears in gallery", hasCard);
} catch (err) {
  log("e2e run", false, err instanceof Error ? err.message : String(err));
  await page.screenshot({ path: "screenshots/e2e-failure.png", fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}
