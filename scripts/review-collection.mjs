// Contact sheets from fictional local screenshots only; no network or private records.
import { createRequire } from "node:module";
import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const out = resolve("shots/collection-2026-10-28");
const ids = readdirSync(out).filter((f) => f.endsWith("-desktop-hero.png")).map((f) => f.replace("-desktop-hero.png", "")).sort();
assert.equal(ids.length, 26);
const browser = await chromium.launch();
try {
  for (const kind of ["hero", "detail"]) for (let i = 0; i < ids.length; i += 4) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 2200 } });
    const rows = ids.slice(i, i + 4).map((id) => `<section><h2>${id}</h2><div class="pair">${["desktop", "phone"].map((label) => `<img alt="${label}" src="data:image/png;base64,${readFileSync(join(out, `${id}-${label}-${kind}.png`)).toString("base64")}">`).join("")}</div></section>`).join("");
    await page.setContent(`<html><head><style>body{margin:0;padding:24px;background:#ddd;font:16px Arial}h1{margin:0}h2{font-size:16px;margin:14px 0 6px}section{display:flow-root}.pair{display:grid;grid-template-columns:minmax(0,1fr) 250px;grid-template-rows:480px;gap:12px;height:480px}.pair img{display:block;min-width:0;min-height:0;width:100%;height:480px;object-fit:contain;background:white}</style></head><body><h1>KRIV collection: ${kind}, desktop and phone</h1>${rows}</body></html>`, { waitUntil: "load" });
    await page.screenshot({ path: join(out, `review-${kind}-${i / 4 + 1}.png`), fullPage: true }); await page.close();
  }
  console.log("14 visual review sheets generated for all 26 compositions");
} finally { await browser.close(); }
