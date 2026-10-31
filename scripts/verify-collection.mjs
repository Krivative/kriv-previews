// Fictional source samples only. One server owned by this script; no Desk or real lead access.
import { createRequire } from "node:module";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawn, execFile } from "node:child_process";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const source = resolve("shots/site-arsenal-source"), out = resolve("shots/collection-2026-10-28");
mkdirSync(out, { recursive: true }); mkdirSync(join(source, "public/template-previews"), { recursive: true });
const sites = readdirSync(join(source, "src/sites")).filter((file) => /^sample-.*\.json$/.test(file)).map((file) => JSON.parse(readFileSync(join(source, "src/sites", file), "utf8")));
assert.equal(sites.length, 26);
const photos = JSON.parse(readFileSync("shots/sample-photos.json", "utf8"));
const port = 3342, base = `http://localhost:${port}`;
const server = spawn(process.execPath, [join(source, "node_modules/next/dist/bin/next"), "start", "-p", String(port)], { cwd: source, stdio: "ignore" });
const browser = await chromium.launch();
const results = [], errors = [], compositions = new Set(); let page;
async function assets(context) {
  await context.route("https://images.unsplash.com/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const photo = photos.find((item) => new URL(item.url).pathname === path);
    assert(photo, `Unreviewed image ${path}`);
    await route.fulfill({ contentType: "image/jpeg", body: readFileSync(`shots/asset-review/${photo.niche}.jpg`) });
  });
}
async function noOverflow(label) {
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
  assert.equal(dimensions.scroll, dimensions.width, `${label}: horizontal overflow`);
}
async function loadImages() {
  // Closed native dialogs are intentionally hidden; test only rendered images.
  for (const img of await page.locator("main img:visible").all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate((element) => element.complete && element.naturalWidth ? true : new Promise((resolve, reject) => { element.addEventListener("load", resolve, { once: true }); element.addEventListener("error", reject, { once: true }); }));
  }
  await page.evaluate(() => scrollTo(0, 0));
}
try {
  let ready = false;
  for (let i = 0; i < 80; i++) { try { if ((await fetch(`${base}/${sites[0].slug}`)).ok) { ready = true; break; } } catch { /* own server startup */ } await new Promise((r) => setTimeout(r, 250)); }
  assert(ready, "Sample server failed to start");
  for (const motion of ["reduce", "no-preference"]) for (const [device, width] of [["desktop", 1440], ["tablet", 768], ["phone", 390]]) {
    const context = await browser.newContext({ reducedMotion: motion, viewport: { width, height: 1000 }, hasTouch: device === "phone", isMobile: device === "phone" }); await assets(context);
    page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message)); page.on("console", (event) => { if (event.type() === "error") errors.push(event.text()); });
    for (const site of sites) {
      const response = await page.goto(`${base}/${site.slug}`, { waitUntil: "networkidle" }); assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready); await noOverflow(`${site.template}/${device}/${motion}`);
      assert.equal(await page.locator("h1:visible").count(), 1); assert.equal(await page.locator("form,input,textarea").count(), 0);
      assert.equal(await page.locator('a[aria-disabled="true"][href]').count(), 0);
      assert((await page.locator('meta[name="robots"]').getAttribute("content")).includes("noindex"));
      const composition = await page.locator("[data-composition]").getAttribute("data-composition"); assert(composition); compositions.add(composition);
      const hero = page.locator('img[fetchpriority="high"]').first(); assert.equal(await hero.getAttribute("loading"), "eager");
      await loadImages(); assert.deepEqual(errors, []);
      for (const emphasis of await page.locator("main h1 em, #visit h2 em").all()) {
        assert(await emphasis.evaluate((el) => {
          const color = getComputedStyle(el).color;
          for (let parent = el; parent; parent = parent.parentElement) {
            const bg = getComputedStyle(parent).backgroundColor;
            if (bg !== "rgba(0, 0, 0, 0)") return bg !== color;
          }
          return true;
        }), `${site.template}: emphasis blends into its surface`);
      }
      if (motion === "reduce") {
        await page.screenshot({ path: join(out, `${site.template}-${device}-hero.png`) });
        if (device !== "tablet") await page.screenshot({ path: join(out, `${site.template}-${device}-full.png`), fullPage: true });
        if (device === "desktop") await page.screenshot({ path: join(source, "public/template-previews", `${composition}.jpg`), type: "jpeg", quality: 78 });
      }
      const details = page.locator("#services details").first(), summary = details.locator("summary");
      await summary.scrollIntoViewIfNeeded();
      if (await details.getAttribute("open") !== "") { if (device === "phone") await summary.tap(); else await summary.click(); }
      assert(await details.locator("p").first().isVisible()); assert((await summary.boundingBox()).height >= 44);
      assert.equal(await summary.locator("a,button").count(), 0);
      await summary.focus(); await page.keyboard.press("Space"); assert.equal(await details.getAttribute("open"), null);
      await page.keyboard.press("Enter"); assert.equal(await details.getAttribute("open"), "");
      await noOverflow(`${site.template}/${device} expanded`);
      for (const number of await page.locator("[data-offering-layout] summary > span:first-child:visible").all()) {
        assert(await number.evaluate((el) => { const range = document.createRange(); range.selectNodeContents(el); return range.getClientRects().length === 1; }), `${site.template}/${device}: offering number wraps`);
      }
      if (motion === "reduce") {
        assert.equal(await details.locator("p").first().evaluate((el) => getComputedStyle(el).animationName), "none");
        if (device !== "tablet") { await details.evaluate((el) => { document.activeElement.blur(); getSelection()?.removeAllRanges(); el.scrollIntoView({ block: "center" }); }); await page.screenshot({ path: join(out, `${site.template}-${device}-detail.png`) }); }
      }
      if (motion === "reduce" && device !== "tablet") {
        const mainNav = page.getByRole("navigation", { name: "Main navigation", exact: true });
        const menu = !(await mainNav.isVisible()); if (menu) await page.locator("header details > summary").click();
        const navigation = page.getByRole("navigation", { name: menu ? "Mobile navigation" : "Main navigation", exact: true });
        await navigation.getByRole("link", { name: "About", exact: true }).click(); await page.waitForURL(`${base}/${site.slug}/about`); await page.waitForLoadState("networkidle");
        await loadImages(); await noOverflow(`${site.template}/${device}/about`); assert.equal(await page.locator("h1:visible").count(), 1);
        if (menu) assert.equal(await page.locator("header details[open]:visible").count(), 0);
        await page.screenshot({ path: join(out, `${site.template}-${device}-about.png`) });
      }
      results.push({ template: site.template, composition, device, motion });
    }
    console.log(`PASS: all 26 compositions ${device}/${motion}`); await context.close();
  }
  assert.equal(compositions.size, 26);
  const fallback = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce", viewport: { width: 320, height: 900 } }); await assets(fallback); page = await fallback.newPage();
  for (const site of sites) {
    await page.goto(`${base}/${site.slug}`, { waitUntil: "networkidle" }); await noOverflow(`${site.template}/320/no-js`);
    const details = page.locator("#services details").first(); if (await details.getAttribute("open") !== "") await details.locator("summary").click();
    assert(await details.locator("p").first().isVisible()); await noOverflow(`${site.template}/320/expanded`);
  }
  await fallback.close(); assert.deepEqual(errors, []);
  writeFileSync(join(out, "results.json"), JSON.stringify({ results, compositions: [...compositions], nativeFallbacksAt320: 26, nestedAboutNavigation: 52, browserErrors: errors, data: "Fictional samples only; reviewed photo fixtures; public configured fonts" }, null, 2));
  console.log(`PASS: ${results.length} cases, 26 distinct compositions, 26 native fallbacks at 320, 52 About click-throughs`);
  for (const script of ["verify-pages.mjs", "verify-navigation.mjs"]) {
    const stdout = await new Promise((res, reject) => execFile(process.execPath, [join(source, "scripts", script)], { cwd: source, env: { ...process.env, BASE_URL: base }, maxBuffer: 1 << 22 }, (error, output, stderr) => error ? reject(new Error(stderr || output)) : res(output)));
    console.log(String(stdout).trim());
  }
} catch (error) { if (page && !page.isClosed()) await page.screenshot({ path: join(out, "failure.png") }).catch(() => {}); console.error(JSON.stringify({ last: results.at(-1), errors })); throw error; }
finally { await browser.close(); server.kill(); }
