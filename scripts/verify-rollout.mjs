// Fictional samples + isolated gallery fixture only. Never opens the real Lead Desk.
import { createRequire } from "node:module";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn, execFile } from "node:child_process";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const source = resolve("shots/site-arsenal-source"), out = resolve("shots/interaction-rollout");
mkdirSync(out, { recursive: true });
const sites = readdirSync(join(source, "src/sites")).filter((f) => /^sample-.*\.json$/.test(f)).map((f) => JSON.parse(readFileSync(join(source, "src/sites", f), "utf8")));
assert.equal(sites.length, 26);
const photos = JSON.parse(readFileSync("shots/sample-photos.json", "utf8"));
const port = 3324, base = `http://localhost:${port}`;
const server = spawn(process.execPath, [join(source, "node_modules/next/dist/bin/next"), "start", "-p", String(port)], { cwd: source, stdio: "ignore" });
const browser = await chromium.launch();
const results = [], errors = []; let fixtureServer, page;
async function assets(context) {
  await context.route("https://images.unsplash.com/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const photo = photos.find((p) => new URL(p.url).pathname === path);
    assert(photo, `Unreviewed image: ${path}`);
    await route.fulfill({ contentType: "image/jpeg", body: readFileSync(`shots/asset-review/${photo.niche}.jpg`) });
  });
}
async function capture(area, path, width) {
  const bounds = await area.boundingBox();
  if (bounds.height > 950) await page.setViewportSize({ width, height: Math.ceil(bounds.height + 100) });
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await area.screenshot({ path, animations: "disabled" });
  await page.setViewportSize({ width, height: 950 });
}
try {
  let up = false;
  for (let n = 0; n < 80; n++) { try { if ((await fetch(`${base}/${sites[0].slug}`)).status === 200) { up = true; break; } } catch { /* own server starting */ } await new Promise((r) => setTimeout(r, 250)); }
  assert(up, "Local synthetic sample server failed to start");
  for (const motion of ["reduce", "no-preference"]) {
    const context = await browser.newContext({ reducedMotion: motion }); await assets(context);
    for (const [label, width] of [["desktop", 1440], ["tablet", 768], ["phone", 390]]) {
      page = await context.newPage(); await page.setViewportSize({ width, height: 950 });
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (e) => { if (e.type() === "error") errors.push(e.text()); });
      for (const site of sites) {
        const response = await page.goto(`${base}/${site.slug}`, { waitUntil: "networkidle" }); assert.equal(response.status(), 200);
        await page.evaluate(() => document.fonts.ready);
        assert.deepEqual(errors, [], "Page resources and hydration must be error-free");
        const service = page.locator("#services");
        // A zero-overflow page can still squeeze readable copy into a number gutter.
        const blurbs = service.locator('ol > li > span:nth-child(3)');
        for (const blurb of await blurbs.all()) assert((await blurb.boundingBox()).width >= 200, `${site.template}: numbered-row copy must have readable width`);
        const offering = service.locator('[data-interaction="offering-detail"]');
        const summaries = offering.count().then((n) => n ? offering.locator("summary") : service.locator("details summary"));
        const summary = (await summaries).first(); assert(await summary.count(), `Missing interaction: ${site.template}`);
        await summary.scrollIntoViewIfNeeded(); await summary.click();
        const detail = summary.locator("..");
        // The explorer starts open, while progressive service detail starts closed.
        if (!(await detail.getAttribute("open") === "")) await summary.click();
        assert.equal(await detail.getAttribute("open"), ""); assert(await detail.locator("p,li").first().isVisible());
        assert.equal(await summary.locator("a,button").count(), 0, "Disclosure and navigation stay separate");
        await summary.focus(); await page.keyboard.press("Space"); assert.equal(await detail.getAttribute("open"), null);
        await page.keyboard.press("Enter"); assert.equal(await detail.getAttribute("open"), "");
        assert((await summary.boundingBox()).height >= 44, "Touch target is too small");
        const animated = detail.locator("p").first();
        if (motion === "reduce") assert.equal(await animated.evaluate((el) => getComputedStyle(el).animationName), "none");
        if (motion === "reduce" && label !== "tablet") await capture(service, join(out, `${site.template}-${label}-services.png`), width);
        const process = page.locator('[data-interaction="process-steps"] details');
        if (await process.count()) { const step = process.last(); await step.locator("summary").click(); assert(await step.locator("p").isVisible()); if (motion === "reduce" && label !== "tablet") await capture(page.locator("#custom"), join(out, `${site.template}-${label}-steps.png`), width); }
        const image = page.locator('#gallery button[aria-haspopup="dialog"]').first();
        if (await image.count()) {
          await image.click(); const dialog = page.getByRole("dialog"); assert(await dialog.isVisible());
          await page.getByRole("button", { name: "Close gallery", exact: true }).focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
          assert(await page.evaluate(() => !!document.activeElement.closest("dialog")));
          if (motion === "reduce" && label === "phone") await page.screenshot({ path: join(out, `${site.template}-phone-dialog.png`) });
          await page.keyboard.press("Escape"); assert.equal(await page.getByRole("dialog").count(), 0);
          assert(await image.evaluate((el) => el === document.activeElement));
          if (motion === "reduce" && label !== "tablet") await capture(page.locator("#gallery"), join(out, `${site.template}-${label}-gallery.png`), width);
        }
        const evidence = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, forms: document.querySelectorAll("form,input,textarea").length, badActions: [...document.querySelectorAll('a[aria-disabled="true"]')].some((a) => a.hasAttribute("href")), broken: [...document.images].filter((i) => i.getBoundingClientRect().width > 0 && i.complete && !i.naturalWidth).length, heroLoading: document.querySelector('[data-composition="canvas"] img[fetchpriority="high"],main img')?.getAttribute("loading"), jsBytes: performance.getEntriesByType("resource").filter((r) => r.name.includes(".js")).reduce((n, r) => n + r.encodedBodySize, 0) }));
        assert.equal(evidence.overflow, 0, `${site.template}: overflow`); assert.equal(evidence.forms, 0); assert.equal(evidence.badActions, false); assert.equal(evidence.broken, 0); assert.equal(evidence.heroLoading, "eager");
        results.push({ template: site.template, label, motion, ...evidence });
      }
      console.log(`PASS: ${label}/${motion}, all 26 templates`); await page.close();
    }
    await context.close();
  }
  const fallback = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce", viewport: { width: 390, height: 844 } }); await assets(fallback);
  page = await fallback.newPage();
  for (const site of sites) {
    await page.goto(`${base}/${site.slug}`, { waitUntil: "networkidle" });
    const summary = page.locator("#services details summary").first(); await summary.click();
    if (await summary.locator("..").getAttribute("open") !== "") await summary.click();
    assert(await summary.locator("..").locator("p,li").first().isVisible());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
  }
  await fallback.close(); console.log("PASS: 26 JavaScript-disabled native fallbacks");
  // Vite is already supplied by Vitest. An isolated fixture tests multiple images,
  // missing image slots and changing props without altering a sample or lead record.
  const fixture = resolve("shots/rollout-gallery-fixture"); mkdirSync(fixture, { recursive: true });
  writeFileSync(join(fixture, "index.html"), '<html><body style="--bg:#fff;--ink:#111;--surface:#eee;--muted:#444;--line:#ccc;--radius:8px;--font-body:Arial;--font-display:Georgia"><div id="fixture"></div><script type="module" src="/main.tsx"></script></body></html>');
  writeFileSync(join(fixture, "main.tsx"), `import React from 'react'; import {createRoot} from 'react-dom/client'; import {GalleryViewer} from '../../src/sections/GalleryViewer';
const image=(color)=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="'+color+'"/></svg>');
const photos=[{label:'Label only'},{src:image('blue'),label:'Fixture blue'},{src:image('gold'),label:'Fixture gold'}];
function Fixture(){const [items,setItems]=React.useState(photos);return <><button id="single" onClick={()=>setItems([photos[1]])}>Use single photo</button><button id="empty" onClick={()=>setItems([])}>Use no photos</button><button id="restore" onClick={()=>setItems(photos)}>Restore photos</button><GalleryViewer businessName="Synthetic gallery fixture" layout="mosaic" photos={items}/></>;}createRoot(document.getElementById('fixture')).render(<Fixture/>);`);
  const vitePath = require.resolve("vite", { paths: [dirname(require.resolve("vitest/package.json"))] });
  const { createServer } = await import(pathToFileURL(vitePath).href);
  fixtureServer = await createServer({ configFile: false, root: fixture, esbuild: { jsx: "automatic" }, server: { host: "127.0.0.1", port: 3325, strictPort: true, fs: { allow: [resolve(".")] } } });
  await fixtureServer.listen();
  for (const width of [1440, 390]) {
    page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:3325", { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", { name: "Open image: Fixture blue", exact: true }); await trigger.click();
    const modal = page.getByRole("dialog"); assert(await modal.isVisible());
    await page.getByRole("button", { name: "Next →", exact: true }).click(); assert(await modal.getByText("2 / 2 · Fixture gold", { exact: true }).isVisible());
    await page.keyboard.press("ArrowRight"); assert(await modal.getByText("1 / 2 · Fixture blue", { exact: true }).isVisible());
    await page.keyboard.press("ArrowLeft"); assert(await modal.getByText("2 / 2 · Fixture gold", { exact: true }).isVisible());
    await page.evaluate(() => document.querySelector("#single").click()); assert(await modal.getByText("1 / 1 · Fixture blue", { exact: true }).isVisible()); assert.equal(await modal.getByRole("button", { name: "Next →", exact: true }).count(), 0);
    await page.keyboard.press("Escape"); await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Open image: Fixture blue");
    await page.locator("#empty").click(); assert.equal(await page.locator("dialog").count(), 0);
    await page.locator("#restore").click(); assert.equal(await page.locator('[aria-haspopup="dialog"]').count(), 2);
    await page.screenshot({ path: join(out, `multiple-images-${width}.png`) }); await page.close();
  }
  assert.deepEqual(errors, []);
  writeFileSync(join(out, "results.json"), JSON.stringify({ results, browserErrors: errors, nativeFallbacks: 26, galleryFixture: "Two actual fixture images, label-only slot, arrows/wrap/prop shrink/empty/restore at 1440 and 390", assets: "Reviewed local photo copies; public configured fonts" }, null, 2));
  console.log(`PASS: ${results.length} template/device/motion combinations + 26 native fallbacks + two multi-image fixtures`);
  for (const script of ["verify-pages.mjs", "verify-navigation.mjs"]) {
    const output = await new Promise((res, reject) => execFile(process.execPath, [join(source, "scripts", script)], { cwd: source, env: { ...process.env, BASE_URL: base }, maxBuffer: 1 << 22 }, (e, stdout, stderr) => e ? reject(new Error(`${script}: ${stderr || stdout}`)) : res(stdout)));
    console.log(String(output).trim());
  }
  const sheets = await new Promise((res, reject) => execFile(process.execPath, [resolve("scripts/review-rollout.mjs")], { cwd: resolve("."), env: process.env }, (e, stdout, stderr) => e ? reject(new Error(stderr || stdout)) : res(stdout)));
  console.log(String(sheets).trim());
} catch (e) { if (page && !page.isClosed()) await page.screenshot({ path: join(out, "failure.png") }).catch(() => {}); console.error(JSON.stringify({ errors, lastCompleted: results.at(-1) })); throw e; }
finally { await fixtureServer?.close(); await browser.close(); server.kill(); }
