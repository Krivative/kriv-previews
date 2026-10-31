// NODE_PATH=$(npm root -g) node lead-desk/site-shots.mjs <outDir> <url...>
// For the visual review: each site's homepage as a visitor sees it on load, desktop 1440x900 and
// the top of the phone view, saved as <outDir>/<host>-desktop.png and <host>-phone.png (outside Git).
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const searchPaths = [process.cwd(), ...(process.env.NODE_PATH ?? "").split(/[;:](?![\\/])/).filter(Boolean)];
const { chromium, devices } = require(require.resolve("playwright", { paths: searchPaths }));

const [outDir, ...urls] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const url of urls) {
  const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  for (const [label, opts] of [["desktop", { viewport: { width: 1440, height: 900 } }], ["phone", devices["iPhone 13"]]]) {
    const context = await browser.newContext(opts);
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "load", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(800);
      await page.screenshot({ path: join(outDir, `${host}-${label}.png`) });
      console.error(`ok   ${label} ${url}`);
    } catch (e) {
      console.error(`ERR  ${label} ${url} ${String(e.message).split("\n")[0]}`);
    }
    await context.close();
  }
}
await browser.close();
