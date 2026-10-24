// node scripts/shoot.mjs <slug> [more slugs...]   (BASE_URL defaults to http://localhost:3100/for; needs Playwright installed)
// Full-page screenshots at 1440 and 390 px into shots/, plus console errors and
// horizontal-overflow checks. Exit code 1 if any check fails.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3100/for";
const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error("usage: node scripts/shoot.mjs <slug> [slug...]");
  process.exit(1);
}
mkdirSync("shots", { recursive: true });

const browser = await chromium.launch();
let failed = false;
for (const slug of slugs) {
  for (const [label, width, height] of [
    ["desktop", 1440, 900],
    ["phone", 390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`${base}/${slug}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const file = `shots/${slug}-${label}.png`;
    await page.screenshot({ path: file, fullPage: true });
    const ok = errors.length === 0 && overflow <= 0;
    if (!ok) failed = true;
    console.log(`${ok ? "ok  " : "FAIL"} ${file}  overflow=${overflow}px errors=${errors.length}`);
    errors.forEach((e) => console.log("     " + e));
    await page.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
