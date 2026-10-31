// Real browser -> HTTP -> Sales handlers -> temporary SQLite -> browser.
// Only model output is injected; no real leads, mail, publication or inference.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { startSalesDemo } from "./sales-demo.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
let modelFails = false;
const demo = await startSalesDemo({ port: 0, salesProbe: async () => ({ available: true, reason: "Synthetic provider for browser verification." }), salesGenerate: async input => {
  if (modelFails) throw new Error("Synthetic provider failure. Saved work is unchanged.");
  return { subject: "A question about enquiries", body: "Hello team, would a brief demonstration of organising enquiries be useful?", evidenceIds: input.evidence.map(e => e.id) };
} });
const browser = await chromium.launch({ headless: true });
const errors = [], external = []; let page;
const output = join(process.cwd(), "shots", "sales-2026-10-31"); mkdirSync(output, { recursive: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route("**/*", route => { if (new URL(route.request().url()).origin !== demo.url) { external.push(route.request().url()); return route.abort(); } return route.continue(); });
  page = await context.newPage(); page.on("pageerror", e => errors.push(e.message));
  await page.goto(`${demo.url}/#sales`);
  await page.getByRole("link", { name: /Juniper Home Services/ }).click();
  await page.getByRole("heading", { name: "Juniper Home Services" }).waitFor();
  assert.equal(await page.locator("#sales-offer").inputValue(), "build");
  await page.getByRole("button", { name: "Start with a template" }).click();
  await page.getByLabel("Email draft", { exact: true }).waitFor();
  await page.getByLabel("Email draft", { exact: true }).fill("Hello team, would you like to discuss how you handle enquiries?");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("[data-save-state]").textContent === "Draft saved");
  await page.reload(); await page.getByLabel("Email draft", { exact: true }).waitFor();
  assert.match(await page.getByLabel("Email draft", { exact: true }).inputValue(), /handle enquiries/);
  await page.getByText("Drafting settings", { exact: true }).click();
  await page.getByLabel("Enable Claude drafting", { exact: true }).check();
  await page.waitForFunction(() => document.querySelector("#toast").textContent === "Claude drafting enabled");
  await page.getByRole("button", { name: "Draft with Claude", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("[data-save-state]").textContent === "Assisted draft saved for review");
  assert.match(await page.locator("#sales-body").inputValue(), /demonstration/);
  modelFails = true;
  await page.getByRole("button", { name: "Draft with Claude", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Synthetic provider failure" }).waitFor();
  assert.match(await page.locator("#sales-body").inputValue(), /demonstration/);
  // A modified source cannot retain its reviewed checkbox.
  await page.locator("[data-field=claim]").fill("The contact page now lists a booking form.");
  assert.equal(await page.locator("[data-field=confirmed]").isChecked(), false);
  await page.getByRole("button", { name: "Save research", exact: true }).click();
  await page.getByText(/The research changed or its evidence/).waitFor();
  assert.equal(await page.getByRole("button", { name: "Copy saved draft" }).isDisabled(), true);
  // Browser uploads use the actual Harvey CSV shape; no recipient is promoted.
  await page.getByText("Add businesses", { exact: true }).click();
  await page.locator("#sales-import").setInputFiles({ name: "harvey.csv", mimeType: "text/csv", buffer: Buffer.from('company_name,website,email,email_status,personalization\nExample Imports,https://imports.example,guess@imports.example,verified,A public services page\n') });
  await page.getByRole("heading", { name: "Example Imports" }).waitFor();
  assert.equal(await page.locator("[data-field=confirmed]").isChecked(), false);
  assert.equal(demo.db.prepare("SELECT email FROM leads WHERE name='Example Imports'").get().email, null);
  // Discovery: fictional finder results become unconfirmed, sourced observations.
  await page.getByText("Discover from the finder", { exact: true }).click();
  const list = page.locator("#discover-list");
  await list.getByText("Birch Lane Heating").waitFor();
  await list.locator("li", { hasText: "Spruce Auto Care" }).getByText(/Checked over 30 days ago/).waitFor();
  await page.locator("#discover-state").selectOption("UT");
  await page.waitForFunction(() => document.querySelectorAll("#discover-list > li").length === 1);
  assert.match(await list.textContent(), /Willow Dental Studio/);
  await page.locator("#discover-state").selectOption("");
  await list.getByText("Birch Lane Heating").waitFor();
  await page.screenshot({ path: join(output, "discover.png"), fullPage: true });
  await list.locator("li", { hasText: "Birch Lane Heating" }).getByRole("button", { name: "Start research" }).click();
  await page.getByRole("heading", { name: "Birch Lane Heating" }).waitFor();
  assert.equal(await page.locator("[data-evidence]").count(), 3);
  assert.equal(await page.locator("[data-field=confirmed]:checked").count(), 0);
  assert.match(await page.locator(".sales-callout").last().textContent(), /Discovery conversation/);
  await page.getByRole("button", { name: "Use site-check findings", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "No new site-check findings" }).waitFor();
  await page.locator("#discover-bucket").selectOption("near");
  await list.locator("li", { hasText: "Maple Street Plumbing" }).getByText(/no business email yet/).waitFor();
  assert.equal(demo.db.prepare("SELECT bucket FROM leads WHERE name='Birch Lane Heating'").get().bucket, "qualified");
  // Responsive rendering and keyboard-visible focus.
  for (const [label, width, height] of [["desktop", 1440, 1000], ["tablet", 820, 1180], ["phone", 390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("link", { name: /Alder Air/ }).click(); await page.getByRole("heading", { name: "Alder Air" }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no horizontal overflow`);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: join(output, `${label}.png`), fullPage: true });
  }
  await page.keyboard.press("Tab"); assert(await page.evaluate(() => document.activeElement !== document.body));
  const unauthed = await fetch(`${demo.url}/api/sales/settings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"enabled":true}' }); assert.equal(unauthed.status, 403);
  assert.equal(demo.db.prepare("SELECT count(*) n FROM emails").get().n, 0);
  assert(demo.requests.every(r => r.path.startsWith("/api/sales"))); assert.deepEqual(external, []); assert.deepEqual(errors, []);
  console.log(JSON.stringify({ result: "passed", requests: demo.requests.length, cases: ["persistent draft", "assisted route", "failure recovery", "evidence invalidation", "CSV import", "discovery list, filters and unconfirmed findings", "three viewports", "CSRF", "no email or external requests"], screenshots: output }));
} catch (error) {
  console.error(JSON.stringify({ errors, requests: demo.requests, alert: await page?.locator("#sales-error").textContent().catch(() => "unavailable") }));
  if (page) await page.screenshot({ path: join(output, "failure.png"), fullPage: true });
  throw error;
} finally { await browser.close(); await demo.close(); }
