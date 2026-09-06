// Usage: node explore.mjs <path> <screenshot-name>
// Navigates the persistent browser session (via CDP reconnect not needed —
// we just launch fresh each time but reuse storage state) to a page, waits
// for network idle, screenshots it, and dumps a simplified list of form
// fields/buttons/headings so selectors can be chosen without guessing.
import { chromium } from "playwright";
import fs from "node:fs";

const [, , urlPath, shotName] = process.argv;
if (!urlPath || !shotName) {
  console.error("Usage: node explore.mjs <path> <screenshot-name>");
  process.exit(1);
}

const STATE_FILE = "storage-state.json";
const hasState = fs.existsSync(STATE_FILE);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  storageState: hasState ? STATE_FILE : undefined,
});
const page = await context.newPage();

const url = urlPath.startsWith("http") ? urlPath : `https://azaisai.com${urlPath}`;
await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(async () => {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
});
await page.waitForTimeout(1500);

await page.screenshot({ path: `screenshots/${shotName}.png`, fullPage: true });

const dump = await page.evaluate(() => {
  const out = { url: location.href, title: document.title, headings: [], inputs: [], buttons: [], links: [] };
  document.querySelectorAll("h1,h2,h3").forEach((h) => out.headings.push(h.textContent.trim().slice(0, 120)));
  document.querySelectorAll("input,textarea,select").forEach((el) => {
    out.inputs.push({
      tag: el.tagName.toLowerCase(),
      type: el.type || null,
      name: el.name || null,
      id: el.id || null,
      placeholder: el.placeholder || null,
      ariaLabel: el.getAttribute("aria-label") || null,
    });
  });
  document.querySelectorAll("button").forEach((el) => {
    const t = el.textContent.trim().slice(0, 60);
    if (t) out.buttons.push({ text: t, type: el.type || null, id: el.id || null });
  });
  document.querySelectorAll("a[href]").forEach((el) => {
    const t = el.textContent.trim().slice(0, 60);
    const href = el.getAttribute("href");
    if (t && href) out.links.push({ text: t, href });
  });
  return out;
});

console.log(JSON.stringify(dump, null, 2));

await context.storageState({ path: STATE_FILE });
await browser.close();
