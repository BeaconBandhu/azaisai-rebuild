import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.goto("https://azaisai.com", { waitUntil: "domcontentloaded", timeout: 30000 });
console.log("TITLE:", await page.title());
await page.screenshot({ path: "screenshots/00-smoke-test.png", fullPage: true });
await browser.close();
console.log("OK");
