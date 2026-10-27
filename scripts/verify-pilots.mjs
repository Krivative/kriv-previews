// Browser QA for the three fictional Site Arsenal pilots. No real leads or Desk server.
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawn, execFile } from "node:child_process";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const source = resolve("shots/site-arsenal-source");
const out = resolve("shots/interaction-pilots"); mkdirSync(out, { recursive: true });
const port = 3322, base = `http://localhost:${port}`;
const server = spawn(process.execPath, [join(source, "node_modules/next/dist/bin/next"), "start", "-p", String(port)], { cwd: source, stdio: "ignore" });
const browser = await chromium.launch();
const photos = JSON.parse(readFileSync("shots/sample-photos.json", "utf8"));
const results = [], errors = [];
async function assets(context) {
  await context.route("https://images.unsplash.com/**", async (route) => {
    const url = new URL(route.request().url());
    const photo = photos.find((p) => new URL(p.url).pathname === url.pathname);
    assert(photo, `Unreviewed image ${url.pathname}`);
    await route.fulfill({ contentType: "image/jpeg", body: readFileSync(`shots/asset-review/${photo.niche}.jpg`) });
  });
}
try {
  let up = false;
  for (let n = 0; n < 80; n++) { try { if ((await fetch(`${base}/sample-hvac-calm`)).status === 200) { up = true; break; } } catch { /* own server starting */ } await new Promise((r) => setTimeout(r, 250)); }
  assert(up, "Synthetic source server did not start");
  for (const motion of ["reduce", "no-preference"]) {
    const context = await browser.newContext({ reducedMotion: motion }); await assets(context);
    for (const [label, width] of [["desktop", 1440], ["tablet", 768], ["phone", 390]]) {
      const page = await context.newPage(); await page.setViewportSize({ width, height: 950 });
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (e) => { if (e.type() === "error") errors.push(e.text()); });
      for (const [template, signature] of [["hvac-calm", "service-explorer"], ["aesthetic-calm", "editorial-gallery"], ["chiro-calm", "visit-journey"]]) {
        const response = await page.goto(`${base}/sample-${template}`, { waitUntil: "networkidle" }); assert.equal(response.status(), 200);
        await page.evaluate(() => document.fonts.ready);
        const area = page.locator(`[data-signature="${signature}"]`); await area.scrollIntoViewIfNeeded();
        if (signature === "service-explorer" || signature === "visit-journey") {
          const details = area.locator("details"); assert((await details.count()) >= 2);
          await details.nth(1).locator("summary").click();
          assert.equal(await details.nth(1).getAttribute("open"), ""); assert.equal(await details.first().getAttribute("open"), null);
          const copy = details.nth(1).locator("p").first(); assert(await copy.isVisible());
          if (motion === "reduce") assert.equal(await copy.evaluate((el) => getComputedStyle(el.parentElement).animationName), "none");
          const summary = details.first().locator("summary"); await summary.focus(); await page.keyboard.press("Enter"); assert.equal(await details.first().getAttribute("open"), "");
        } else {
          const trigger = area.getByRole("button", { name: /^Open image:/ }).first(); await trigger.click();
          const dialog = page.getByRole("dialog"); assert(await dialog.isVisible());
          if (motion === "reduce") await page.screenshot({ path: join(out, `gallery-dialog-${label}.png`) });
          await page.getByRole("button", { name: "Close gallery", exact: true }).focus();
          await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
          assert(await page.evaluate(() => !!document.activeElement.closest("dialog")), "Focus must stay inside the modal");
          await page.keyboard.press("Escape"); assert.equal(await page.getByRole("dialog").count(), 0);
          assert(await trigger.evaluate((el) => el === document.activeElement), "Focus should return to the image trigger");
        }
        await area.scrollIntoViewIfNeeded();
        const evidence = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, forms: document.querySelectorAll("form,input,textarea").length, badActions: [...document.querySelectorAll('a[aria-disabled="true"]')].some((a) => a.hasAttribute("href")), broken: [...document.images].filter((i) => i.getBoundingClientRect().width > 0 && i.complete && !i.naturalWidth).length, heroLoading: document.querySelector("main img")?.getAttribute("loading"), jsBytes: performance.getEntriesByType("resource").filter((r) => r.name.includes(".js")).reduce((n, r) => n + r.encodedBodySize, 0) }));
        assert.equal(evidence.overflow, 0); assert.equal(evidence.forms, 0); assert.equal(evidence.badActions, false); assert.equal(evidence.broken, 0); assert.equal(evidence.heroLoading, "eager");
        await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
        const viewport = page.viewportSize();
        const bounds = await area.boundingBox();
        // Fit the whole section inside the capture viewport; offscreen fixed skip links
        // otherwise leak into Chromium's oversized element screenshots.
        if (bounds.height > viewport.height) await page.setViewportSize({ width, height: Math.ceil(bounds.height + 100) });
        await area.screenshot({ path: join(out, `${template}-${label}-${motion}.png`), animations: "disabled" });
        await page.setViewportSize(viewport);
        results.push({ template, label, motion, ...evidence });
      }
      await page.close();
    }
    await context.close();
  }
  // Native exploration survives JavaScript being disabled; gallery images remain readable.
  const fallback = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce", viewport: { width: 390, height: 844 } }); await assets(fallback);
  const page = await fallback.newPage();
  for (const [template, signature] of [["hvac-calm", "service-explorer"], ["chiro-calm", "visit-journey"]]) {
    await page.goto(`${base}/sample-${template}`, { waitUntil: "networkidle" });
    const details = page.locator(`[data-signature="${signature}"] details`).nth(1);
    await details.locator("summary").click(); assert.equal(await details.getAttribute("open"), ""); assert(await details.locator("p").first().isVisible());
  }
  await page.goto(`${base}/sample-aesthetic-calm`, { waitUntil: "networkidle" });
  assert(await page.locator('[data-signature="editorial-gallery"] figure').count()); await fallback.close();
  assert.deepEqual(errors, []);
  writeFileSync(join(out, "results.json"), JSON.stringify({ results, browserErrors: errors, fallback: "Native service/journey exploration and visible gallery images", assets: "Existing reviewed local stock copies; configured public web fonts" }, null, 2));
  console.log(`PASS: ${results.length} pilot/device/motion combinations; native fallbacks; no errors/overflow/broken images/live actions. Screenshots: ${out}`);
  // Required companion-library regression checks across every niche and known page.
  for (const script of ["verify-pages.mjs", "verify-navigation.mjs"]) {
    const output = await new Promise((res, reject) => execFile(process.execPath, [join(source, "scripts", script)], { cwd: source, env: { ...process.env, BASE_URL: base }, maxBuffer: 1 << 22 }, (e, stdout, stderr) => e ? reject(new Error(`${script}: ${stderr || stdout}`)) : res(stdout)));
    console.log(String(output).trim());
  }
} catch (e) { console.error(JSON.stringify({ errors, lastCompleted: results.at(-1) })); throw e; }
finally { await browser.close(); server.kill(); }
