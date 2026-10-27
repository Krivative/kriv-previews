// Isolated browser exercise: intercepted .test origin, temporary synthetic DB/files only.
// NODE_PATH=$(npm root -g) node scripts/verify-workspace.mjs
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, sep, extname } from "node:path";
import assert from "node:assert/strict";
import { reviewFixture } from "../tests/fixtures/workflow.mjs";
import { now, json, log } from "../lead-desk/lib/db.mjs";
import { publicationVersion } from "../lead-desk/lib/workflow-state.mjs";
import { verifyPublished } from "../lead-desk/lib/publish.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const f = reviewFixture(":temp:");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ reducedMotion: "reduce" });
const root = resolve("lead-desk/public");
const out = resolve("shots/workspace-2026-10-27"); mkdirSync(out, { recursive: true });
const errors = [], requests = [], external = [];
let failDraft = false, publishCount = 0, page;
try {
  const fixturePage = await context.newPage();
  const screenshots = [];
  for (const [, width, height] of [["desktop", 1440, 1700], ["mobile", 390, 1500]]) {
    await fixturePage.setViewportSize({ width, height });
    await fixturePage.setContent(`<html><style>*{box-sizing:border-box}body{margin:0;background:#f5f1e8;color:#163d3c;font:18px/1.6 Arial}header{padding:15px 6%;font-size:12px;background:#153e3a;color:#fff}.nav{padding:24px 6%;border-bottom:1px solid #d8ddd2;display:flex;justify-content:space-between}.hero{padding:90px 8%;background:#d7e6d8;min-height:550px}h1{font:62px/1.1 Georgia;max-width:700px;letter-spacing:-2px}p{max-width:520px}small{font-size:11px;letter-spacing:2px;text-transform:uppercase}.art{height:260px;background:linear-gradient(135deg,#b1cbb9,#e9d9b8);border-radius:150px 150px 8px 8px;margin-top:35px}.services{padding:55px 8%}.services div{padding:25px 0;border-bottom:1px solid #ccd5c9}footer{padding:60px 8%;background:#183e3a;color:#fff}@media(max-width:500px){h1{font-size:45px}.hero{padding:65px 8%}.nav{font-size:13px}}</style><header>Synthetic concept preview · fictional testing fixture · no real business data</header><div class="nav"><b>EXAMPLE STUDIO</b><span>Explore · About · Contact</span></div><section class="hero"><small>Made for the everyday</small><h1>A little more care.<br>A clearer next step.</h1><p>A fictional website used to verify the KRIV review workspace. All information and imagery here are synthetic.</p><div class="art"></div></section><section class="services"><small>Explore the possibilities</small><h2>Thoughtful by design.</h2><div>01 &nbsp; Example service</div><div>02 &nbsp; A clear explanation</div><div>03 &nbsp; Your questions, answered</div></section><footer>Fictional fixture only. No calls, forms, booking or checkout.</footer></html>`);
    screenshots.push(await fixturePage.screenshot({ fullPage: true }));
  }
  await fixturePage.close();
  const add = (name, options) => {
    const id = f.add(name, options);
    f.snapshot(id).screenshots.forEach((s, i) => writeFileSync(s.file, screenshots[i]));
    return id;
  };
  const dental = add("Willow Dental", { niche: "dental" });
  const revision = add("Linen Skin Studio", { niche: "medspa" });
  const decline = add("Harbor Plumbing", { niche: "plumbing" });
  const ready = add("Northline Air", { qa: true }); f.decide(ready, "approved");
  add("Workshop Auto", { niche: "auto", status: "live", qa: true });
  const followup = add("Align Chiropractic", { niche: "chiro", status: "sent" });
  f.call("POST", `/api/workflow/${followup}/followup`, { expectedRevision: 0, due: now().slice(0, 10), note: "Read any reply in Gmail before following up." });
  add("Shore Retreat", { status: "declined" });
  const pending = add("Field Service Company"); f.db.prepare("UPDATE drafts SET screenshots = '[]' WHERE lead_id = ?").run(pending);

  await context.route("**/*", async (route) => {
    const req = route.request(); const url = new URL(req.url());
    if (url.origin !== "https://synthetic-desk.test") { external.push(url.origin); return route.abort(); }
    try {
      if (url.pathname.startsWith("/api/")) {
        requests.push({ path: url.pathname, method: req.method() });
        const body = req.method() === "GET" ? {} : req.postDataJSON();
        if (failDraft && /\/draft$/.test(url.pathname)) return route.fulfill({ status: 503, contentType: "application/json", body: json({ error: "Synthetic save failure. Your text is still here." }) });
        let result;
        if (url.pathname === "/api/job") result = {};
        else if (/\/publish\/plan$/.test(url.pathname)) result = { slug: f.row(ready).slug, url: `https://kriv.agency/${f.row(ready).slug}`, status: "approved" };
        else if (/\/publish$/.test(url.pathname)) {
          assert.equal(body.confirm, f.row(ready).slug); publishCount++;
          log(f.db, ready, "published", { sha: "synthetic-only", version: publicationVersion(f.ctx, f.row(ready)) }); result = { ok: true };
        } else if (/\/verify-live$/.test(url.pathname)) result = await verifyPublished(f.ctx, f.row(ready), async () => true);
        else if (/\/checks$/.test(url.pathname)) result = { httpStatus: 409, body: { error: "Synthetic check job is intentionally paused." } };
        else {
          assert(!/^\/api\/(import|rules|find|check|ai|inbox)/.test(url.pathname), "Unapproved side effect in browser fixture");
          result = await f.call(req.method(), url.pathname + url.search, body);
        }
        return route.fulfill({ status: result?.httpStatus ?? 200, contentType: "application/json", body: json(result?.httpStatus ? result.body : result) });
      }
      if (url.pathname === "/file") {
        const file = resolve(url.searchParams.get("path") ?? "");
        assert(file.startsWith(resolve(f.repo) + sep), "Only synthetic fixture images may be served");
        return route.fulfill({ contentType: "image/png", body: readFileSync(file) });
      }
      const file = resolve(root, url.pathname === "/" ? "index.html" : url.pathname.slice(1));
      assert(file.startsWith(root + sep));
      const type = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" }[extname(file)] ?? "text/plain";
      return route.fulfill({ contentType: type, body: readFileSync(file) });
    } catch (e) { errors.push(`${url.pathname}: ${e.message}`); return route.fulfill({ status: 500, contentType: "application/json", body: json({ error: e.message }) }); }
  });
  page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const noOverflow = async (label) => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: horizontal overflow`);
  const go = async (id, step = "design") => { await page.goto(`https://synthetic-desk.test/#focus/${id}/${step}`); await page.getByRole("heading", { name: f.row(id).name, exact: true }).waitFor(); };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("https://synthetic-desk.test/"); await page.getByRole("heading", { name: "Your lead inbox." }).waitFor();
  await noOverflow("desktop inbox"); await page.screenshot({ path: join(out, "inbox-desktop.png"), fullPage: true });
  await page.getByRole("searchbox", { name: "Search leads" }).fill("Willow");
  assert.equal(await page.locator(".inbox-row").count(), 1);
  await page.getByRole("link", { name: "Willow Dental", exact: true }).click();
  await page.getByRole("button", { name: "✓ APPROVE", exact: true }).click();
  await page.getByText("Design approved.", { exact: true }).waitFor();
  assert.equal(f.row(dental).status, "draft"); assert.equal(publishCount, 0);
  await page.getByRole("button", { name: "Mobile", exact: true }).click(); assert(await page.locator(".device-mobile img").count());
  await page.getByRole("button", { name: "Desktop", exact: true }).click();
  await page.screenshot({ path: join(out, "review-desktop.png"), fullPage: true });

  await go(revision); await page.getByRole("button", { name: "↺ REVISE", exact: true }).click();
  failDraft = true;
  await page.getByRole("textbox", { name: "What would you like changed?" }).fill("Improve the hero and mobile gallery.");
  await page.getByRole("link", { name: "← Back to inbox", exact: true }).click();
  await page.getByText("Synthetic save failure. Your text is still here.", { exact: true }).first().waitFor();
  assert(page.url().includes(`/focus/${revision}/`) || page.url().includes(`#focus/${revision}/`));
  assert.equal(await page.locator("#feedback").inputValue(), "Improve the hero and mobile gallery.");
  failDraft = false;
  await page.getByRole("button", { name: "Refresh lead", exact: true }).click();
  await page.getByText("All changes saved", { exact: true }).waitFor();
  await page.reload(); await page.getByRole("button", { name: "↺ REVISE", exact: true }).click();
  assert.equal(await page.locator("#feedback").inputValue(), "Improve the hero and mobile gallery.");
  await page.getByRole("button", { name: "Save revision request", exact: true }).click();
  await page.getByText("Revision request saved. Your original preview is preserved.", { exact: true }).waitFor();
  assert.equal(f.workflow(revision).decision, "revision"); assert.equal(f.db.prepare("SELECT state FROM preparations WHERE lead_id = ?").get(revision), undefined);

  await go(decline); await page.getByRole("button", { name: "× DECLINE", exact: true }).click();
  await page.getByLabel("Reason (optional)").selectOption("Poor design direction");
  await page.getByRole("button", { name: "Confirm decline", exact: true }).click();
  await page.getByText("Concept declined", { exact: true }).waitFor(); assert.equal(f.row(decline).status, "draft");
  await page.getByRole("button", { name: "History", exact: true }).click();
  await page.getByRole("button", { name: "View version", exact: true }).first().click();
  await page.locator(".archived-notice").waitFor();

  await go(ready, "email");
  await page.getByRole("button", { name: "I've reviewed this email", exact: true }).click();
  await page.getByText("Email review saved.", { exact: true }).waitFor(); assert.equal(publishCount, 0);
  await page.getByRole("button", { name: "Review publication readiness →", exact: true }).click();
  await page.getByRole("button", { name: "Approve for publication", exact: true }).click();
  await page.getByRole("button", { name: "Publish preview…", exact: true }).click();
  await page.getByRole("heading", { name: "Make this concept public?", exact: true }).waitFor(); assert.equal(publishCount, 0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click(); assert.equal(publishCount, 0);
  await page.getByRole("button", { name: "Publish preview…", exact: true }).click();
  await page.getByRole("button", { name: "Confirm: publish preview", exact: true }).click();
  await page.getByText("Publication verification pending", { exact: true }).waitFor(); assert.equal(publishCount, 1);
  await page.getByRole("button", { name: "Check published page", exact: true }).click();
  await page.getByRole("button", { name: "Refresh lead", exact: true }).click();
  await page.getByText("Published and verified", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Email", exact: true }).click();
  await page.getByRole("button", { name: "I sent this email", exact: true }).click();
  await page.getByRole("heading", { name: "A clear place to pick up the conversation.", exact: true }).waitFor();
  await page.getByLabel("Next follow-up date").fill("2026-11-05");
  await page.getByLabel("What needs to happen?").fill("Read the reply manually in Gmail.");
  await page.getByRole("button", { name: "Save follow-up", exact: true }).click();
  await page.getByText("Follow-up saved. It will appear when it's due.", { exact: true }).waitFor();
  assert.equal(f.workflow(ready).followup_due, "2026-11-05");

  const layouts = [];
  for (const [label, width, height] of [["tablet", 768, 1024], ["phone", 390, 844]]) {
    await page.setViewportSize({ width, height }); await go(dental);
    await noOverflow(`${label} focused review`); await page.screenshot({ path: join(out, `review-${label}.png`), fullPage: true });
    await page.goto("https://synthetic-desk.test/#inbox"); await page.getByRole("heading", { name: "Your lead inbox." }).waitFor();
    await page.getByRole("searchbox", { name: "Search leads" }).fill("");
    await noOverflow(`${label} inbox`); await page.screenshot({ path: join(out, `inbox-${label}.png`), fullPage: true });
    layouts.push(`${label}: inbox + focus passed`);
  }
  await page.keyboard.press("Tab"); assert(await page.evaluate(() => document.activeElement !== document.body));
  assert.deepEqual(errors, []);
  const result = { browserErrors: errors.length, actualNetworkRequests: 0, simulatedPublications: publishCount, privateDataAccess: false, checks: ["Search and queues", "Visual approval before QA", "Desktop/mobile switching", "Failed-save navigation protection", "Feedback persistence across reload", "Freeform revision without generation", "Concept decline and saved version", "Separate email review and publication approval", "Explicit publish confirmation and cancel", "Verification-only retry", "Manual sent status and follow-up", ...layouts, "Keyboard navigation"], screenshots: out, externalRequestsBlocked: external.length, syntheticApiRequests: requests.length };
  writeFileSync(join(out, "result.json"), json(result));
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  if (page) { await page.screenshot({ path: join(out, "failure.png"), fullPage: true }); console.error((await page.locator("body").innerText()).slice(0, 2200)); }
  console.error(JSON.stringify({ errors, recentRequests: requests.slice(-8) })); throw e;
} finally { await context.close(); await browser.close(); f.db.close(); }
