// Cloudflare Turnstile correctly detects Playwright's automated Chrome and
// keeps the "Send code" button disabled, no matter how long we wait — that's
// the bot protection working as intended, and we're not going to fight it
// with stealth/evasion tooling. Instead: open a real, visible Chrome window,
// pre-fill the email, and let a human (you) solve the Turnstile challenge and
// enter the emailed code by hand in that same window. Once the URL moves off
// /auth/signup we resume automated screenshotting with the now-authenticated
// session (cookies persisted to storage-state.json for reuse by other scripts).
import { chromium } from "playwright";
import fs from "node:fs";

const EMAIL = process.argv[2];
if (!EMAIL) {
  console.error("Usage: node assisted-signup.mjs <email>");
  process.exit(1);
}

const browser = await chromium.launch({ channel: "chrome", headless: false });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

await page.goto("https://azaisai.com/auth/signup", { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(1500);
await page.fill("#email", EMAIL).catch(() => {});

console.log("\n>>> Browser window is open on your screen. Please:");
console.log("    1. Solve the Turnstile check if prompted.");
console.log("    2. Click 'Send code'.");
console.log("    3. Check your email for the sign-in code and enter it.");
console.log("    Waiting up to 5 minutes for you to finish (URL will leave /auth/signup)...\n");

await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 300000 });
console.log("Detected navigation away from /auth — landed at:", page.url());
await page.waitForTimeout(2000);
await page.screenshot({ path: "screenshots/04-post-login-landing.png", fullPage: true });

await context.storageState({ path: "storage-state.json" });
console.log("Session saved to storage-state.json. Keeping browser open 10s, then closing...");
await page.waitForTimeout(10000);
await browser.close();
