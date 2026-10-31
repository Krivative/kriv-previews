// One LIVE Claude draft through the fictional Sales demo UI: real browser -> HTTP ->
// Sales handlers -> isolated Claude runtime -> temporary SQLite. Uses ONE subscription
// request. Never opens kriv-leads, the normal Desk or automation; sends nothing.
// Run: NODE_PATH=$(npm root -g) node scripts/verify-sales-live.mjs [screenshot-dir]
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { startSalesDemo } from "./sales-demo.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const out = process.argv[2] ?? "shots/sales-live";
mkdirSync(out, { recursive: true });
const demo = await startSalesDemo({ port: 0 });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [], external = [];
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => m.type() === "error" && errors.push(m.text()));
page.on("request", r => { if (!r.url().startsWith(demo.url) && !r.url().startsWith("data:")) external.push(r.url()); });
try {
  await page.goto(`${demo.url}/#sales`);
  await page.getByRole("link", { name: /Alder Air/ }).click();
  await page.locator("summary", { hasText: "Drafting settings" }).click();
  await page.locator("#sales-enable").check();
  await page.waitForTimeout(500);
  const started = Date.now();
  await page.locator("#sales-generate").click();
  await page.getByText("Prepared with Claude and Harvey guidance").waitFor({ timeout: 200000 });
  const elapsedMs = Date.now() - started;
  const body = await page.locator("#sales-body").inputValue();
  await page.screenshot({ path: join(out, "live-draft.png"), fullPage: true });
  // Edit, save and reload: the edit persists and the Claude version is archived.
  await page.locator("#sales-body").fill(`${body}\n\n(edited in live check)`);
  await page.locator("#sales-draft button[type=submit]").click();
  await page.getByText("Edited by you").waitFor({ timeout: 10000 });
  await page.reload();
  await page.locator("#sales-body").waitFor();
  assert.ok((await page.locator("#sales-body").inputValue()).includes("(edited in live check)"), "edited draft persists after reload");
  assert.equal(demo.db.prepare("SELECT COUNT(*) n FROM sales_draft_versions").get().n, 1, "Claude version archived");
  assert.deepEqual(demo.db.prepare("SELECT status FROM sales_runs").all().map(r => r.status), ["done"], "one completed run");
  assert.deepEqual(errors, [], "no browser errors");
  assert.deepEqual(external, [], "browser made no external requests");
  // Report counts only; the draft text stays in the screenshot of fictional data.
  console.log(JSON.stringify({ result: "live-ui-draft-passed", elapsedMs, words: body.split(/\s+/).length }, null, 2));
} catch (e) {
  await page.screenshot({ path: join(out, "live-failure.png"), fullPage: true }).catch(() => {});
  console.error(`Live Sales UI check failed: ${e.message}`);
  process.exitCode = 1;
} finally { await browser.close(); await demo.close(); }
