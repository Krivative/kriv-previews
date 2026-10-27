// Three independently composed fictional samples; no real leads or Desk API access.
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const source = resolve("shots/site-arsenal-source"), out = resolve("shots/composition-pilots"); mkdirSync(out, { recursive: true });
const port = 3340, base = `http://localhost:${port}`;
const server = spawn(process.execPath, [join(source, "node_modules/next/dist/bin/next"), "start", "-p", String(port)], { cwd: source, stdio: "ignore" });
const browser = await chromium.launch();
const results = [], errors = [], designs = [["aesthetic-calm", "canvas"], ["office-calm", "index"], ["auto-bold", "stage"]];
const photos = JSON.parse(readFileSync("shots/sample-photos.json", "utf8"));
async function assets(context) { await context.route("https://images.unsplash.com/**", async (route) => { const path = new URL(route.request().url()).pathname; const photo = photos.find((p) => new URL(p.url).pathname === path); assert(photo, `Unreviewed photo: ${path}`); await route.fulfill({ contentType: "image/jpeg", body: readFileSync(`shots/asset-review/${photo.niche}.jpg`) }); }); }
let page;
try {
  let ready = false;
  for (let i = 0; i < 80; i++) { try { if ((await fetch(`${base}/sample-aesthetic-calm`)).status === 200) { ready = true; break; } } catch { /* own server starting */ } await new Promise((r) => setTimeout(r, 250)); }
  assert(ready, "Synthetic sample server did not start");
  for (const motion of ["reduce", "no-preference"]) {
    for (const [label, width] of [["desktop", 1440], ["tablet", 768], ["phone", 390]]) {
      const context = await browser.newContext({ reducedMotion: motion, hasTouch: label === "phone", isMobile: label === "phone" }); await assets(context);
      page = await context.newPage(); await page.setViewportSize({ width, height: 1000 });
      page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (e) => { if (e.type() === "error") errors.push(e.text()); });
      for (const [template, composition] of designs) {
        const response = await page.goto(`${base}/sample-${template}`, { waitUntil: "networkidle" }); assert.equal(response.status(), 200); await page.evaluate(() => document.fonts.ready); assert.deepEqual(errors, []);
        const root = page.locator(`[data-composition="${composition}"]`); assert.equal(await root.count(), 1);
        assert.equal((await page.locator("h1:visible").textContent()).replace(/\s+/g, " "), "An hour that belongs to you.");
        const evidence = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, forms: document.querySelectorAll("form,input,textarea").length, broken: [...document.images].filter((i) => i.complete && !i.naturalWidth).length, activeBusinessLinks: [...document.querySelectorAll('a[aria-disabled="true"]')].some((a) => a.hasAttribute("href")), images: [...new Set([...document.images].map((i) => new URL(i.currentSrc).pathname))].length, hero: document.querySelector('img[fetchpriority="high"]')?.getAttribute("loading"), headline: document.querySelector("h1").getBoundingClientRect().toJSON(), navigation: document.querySelector("header").getBoundingClientRect().toJSON(), imageWidth: document.querySelector('img[fetchpriority="high"]')?.sizes }));
        assert.equal(evidence.overflow, 0); assert.equal(evidence.forms, 0); assert.equal(evidence.broken, 0); assert.equal(evidence.activeBusinessLinks, false); assert.equal(evidence.images, 1); assert.equal(evidence.hero, "eager");
        if (composition === "index" && width > 1000) assert(evidence.navigation.height > 700, "Index must have its own vertical navigation structure");
        if (composition === "canvas") assert.equal(await root.locator('[aria-hidden="true"] > img').count(), 1);
        if (motion === "reduce") { await page.screenshot({ path: join(out, `${composition}-${label}-hero.png`) }); await page.screenshot({ path: join(out, `${composition}-${label}-full.png`), fullPage: true }); if (label === "desktop") { mkdirSync(join(source, "public/template-previews"), { recursive: true }); await page.screenshot({ path: join(source, "public/template-previews", `${composition}.jpg`), type: "jpeg", quality: 78 }); } }
        const details = page.locator("#services details").first(); await details.locator("summary").scrollIntoViewIfNeeded();
        if (await details.getAttribute("open") !== "") { if (label === "phone") await details.locator("summary").tap(); else await details.locator("summary").click(); }
        assert(await details.locator("p").first().isVisible());
        await details.locator("summary").focus(); await page.keyboard.press("Space"); assert.equal(await details.getAttribute("open"), null); await page.keyboard.press("Enter"); assert.equal(await details.getAttribute("open"), "");
        if (motion === "reduce") await page.screenshot({ path: join(out, `${composition}-${label}-services.png`) });
        const mainNav = page.getByRole("navigation", { name: "Main navigation", exact: true });
        const useMenu = !(await mainNav.isVisible());
        if (useMenu) await page.locator("header details > summary").click();
        const nav = page.getByRole("navigation", { name: useMenu ? "Mobile navigation" : "Main navigation", exact: true });
        await nav.getByRole("link", { name: "About", exact: true }).click(); await page.waitForURL(`${base}/sample-${template}/about`); await page.waitForLoadState("networkidle");
        assert.equal(await page.locator("h1:visible").count(), 1);
        const photo = page.locator("main img").first(); await photo.scrollIntoViewIfNeeded(); await photo.evaluate((el) => el.complete && el.naturalWidth ? true : new Promise((resolve, reject) => { el.addEventListener("load", resolve, { once: true }); el.addEventListener("error", reject, { once: true }); }));
        if (useMenu) assert.equal(await page.locator("header details[open]:visible").count(), 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
        results.push({ template, composition, label, motion, ...evidence });
      }
      console.log(`PASS: three compositions at ${label}/${motion}`); await page.close(); await context.close();
    }
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } }); await assets(context); page = await context.newPage();
  for (const [template] of designs) { await page.goto(`${base}/sample-${template}`, { waitUntil: "networkidle" }); const details = page.locator("#services details").first(); if (await details.getAttribute("open") !== "") await details.locator("summary").click(); assert(await details.locator("p").first().isVisible()); }
  await context.close(); assert.deepEqual(errors, []);
  writeFileSync(join(out, "results.json"), JSON.stringify({ results, errors, sameFictionalContent: true, sourceImagesPerHomepage: 1, nativeFallbacks: 3 }, null, 2));
  console.log(`PASS: ${results.length} composition/device/motion cases; same fictional content; one credited image each; native fallbacks; keyboard and navigation`);
} catch (e) { if (page && !page.isClosed()) await page.screenshot({ path: join(out, "failure.png") }).catch(() => {}); console.error(JSON.stringify({ errors, last: results.at(-1) })); throw e; }
finally { await browser.close(); server.kill(); }
