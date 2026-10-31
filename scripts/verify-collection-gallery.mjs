// Local fictional gallery only. Does not inspect the private Lead Desk.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const base = process.env.BASE_URL ?? "http://localhost:3101";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const out = "shots/collection-2026-10-28"; mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [1440, 768, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    const errors = []; page.on("pageerror", e => errors.push(e.message));
    const response = await page.goto(base, { waitUntil: "networkidle" }); assert.equal(response.status(), 200);
    assert.equal(await page.locator("article").count(), 26);
    assert.equal(await page.locator("article img").count(), 26);
    for (const img of await page.locator("main img").all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(el => el.complete && el.naturalWidth ? true : new Promise((resolve,reject) => { el.onload=resolve; el.onerror=reject; }));
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
    await page.evaluate(() => scrollTo(0,0)); await page.screenshot({ path: `${out}/gallery-${width}-top.png` });
    await page.getByRole("heading", { name: "Templates", exact: true }).evaluate(el => el.scrollIntoView());
    await page.screenshot({ path: `${out}/gallery-${width}-cards.png` });
    const link = page.getByRole("link", { name: "Open Clear sample", exact: true }); await link.focus(); await page.keyboard.press("Enter");
    await page.waitForURL(`${base}/sample-dental-clear`);
    assert.equal(await page.locator('[data-composition="atrium"]').count(), 1);
    assert.deepEqual(errors, []); await page.close();
  }
  console.log("PASS: 26 actual gallery thumbnails, three widths, keyboard sample navigation");
} finally { await browser.close(); }
