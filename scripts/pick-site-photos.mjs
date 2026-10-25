// NODE_PATH=$(npm root -g) node scripts/pick-site-photos.mjs list <slug> <pageUrl...>
//   Loads the business's own pages and lists its large photos and likely logo, with a
//   contact sheet at shots/site-photos/<slug>.html to review.
// node scripts/pick-site-photos.mjs use <slug> [--logo <url>] <photoUrl...>
//   Sets brand.logo and brand.photos on leads/<slug>.json with "Business" credits and adds the
//   pages they came from to `sources`. Kriv, 2026-10-25: a lead's own photos and logo may be used
//   when they clearly show that business (team, vans, premises, finished work). Never its
//   licensed stock photos; never another business's images. Images are hotlinked, not copied.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const [cmd, slug, ...rest] = process.argv.slice(2);
const leadPath = `leads/${slug}.json`;
const listPath = `shots/site-photos/${slug}.json`;

if (cmd === "list") {
  const require = createRequire(import.meta.url);
  const searchPaths = [process.cwd(), ...(process.env.NODE_PATH ?? "").split(":").filter(Boolean)];
  const { chromium } = require(require.resolve("playwright", { paths: searchPaths }));
  const browser = await chromium.launch();
  const found = new Map();
  let logo = null;
  for (const url of rest) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.goto(url, { waitUntil: "load", timeout: 30000 });
      await page.waitForTimeout(2500);
      const res = await page.evaluate(() => {
        const out = [];
        for (const img of document.querySelectorAll("img")) {
          const src = img.currentSrc || img.src;
          if (src) out.push({ src, w: img.naturalWidth, h: img.naturalHeight, alt: img.alt || "", logo: /logo/i.test(src + img.alt + img.className + (img.closest("header") ? " header" : "")) });
        }
        for (const el of document.querySelectorAll("*")) {
          const bg = getComputedStyle(el).backgroundImage;
          const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
          if (m && el.clientWidth >= 600) out.push({ src: new URL(m[1], location.href).href, w: el.clientWidth, h: el.clientHeight, alt: "background", logo: false });
        }
        return out;
      });
      for (const r of res) {
        if (r.logo && !logo && r.w >= 60) logo = { ...r, page: url };
        if (!r.logo && r.w >= 600 && !found.has(r.src)) found.set(r.src, { ...r, page: url });
      }
    } catch (e) {
      console.error(`FAIL ${url} ${String(e.message).split("\n")[0]}`);
    }
    await page.close();
  }
  await browser.close();
  const photos = [...found.values()];
  mkdirSync("shots/site-photos", { recursive: true });
  writeFileSync(listPath, JSON.stringify({ logo, photos }, null, 2));
  const cell = (p, i) => `<figure><img src="${p.src}"><figcaption>#${i} ${p.w}x${p.h} ${p.alt.slice(0, 60)}<br><small>${p.page}</small></figcaption></figure>`;
  writeFileSync(`shots/site-photos/${slug}.html`, `<!doctype html><style>body{font:13px system-ui;margin:12px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}img{width:100%;height:220px;object-fit:cover}.logo img{height:80px;object-fit:contain;background:#eee}</style>${logo ? `<p class="logo">Logo: <img src="${logo.src}"></p>` : "<p>No logo found.</p>"}<main>${photos.map(cell).join("")}</main>`);
  console.log(`${photos.length} photos, logo ${logo ? "found" : "not found"}: shots/site-photos/${slug}.html`);
  for (const [i, p] of photos.entries()) console.log(`#${i} ${p.w}x${p.h} ${p.src}`);
} else if (cmd === "use") {
  const list = existsSync(listPath) ? JSON.parse(readFileSync(listPath, "utf8")) : { photos: [], logo: null };
  const pageOf = (src) => list.photos.find((p) => p.src === src)?.page ?? (list.logo?.src === src ? list.logo.page : null);
  let logo = null;
  const urls = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--logo") logo = rest[++i];
    else urls.push(rest[i]);
  }
  const lead = JSON.parse(readFileSync(leadPath, "utf8"));
  const credits = urls.map((u) => {
    const page = pageOf(u);
    if (!page) throw new Error(`not in the list from 'list': ${u}`);
    return { provider: "Business", source: page };
  });
  lead.brand = { ...(lead.brand ?? {}), photos: urls, photoCredits: credits, ...(logo ? { logo } : {}) };
  lead.sources = [...new Set([...lead.sources, ...credits.map((c) => c.source), ...(logo && pageOf(logo) ? [pageOf(logo)] : [])])];
  writeFileSync(leadPath, JSON.stringify(lead, null, 2) + "\n");
  console.log(`wrote ${leadPath}: ${urls.length} own photos${logo ? " and logo" : ""}`);
} else {
  console.error("usage: pick-site-photos.mjs list <slug> <pageUrl...> | use <slug> [--logo <url>] <photoUrl...>");
  process.exit(1);
}
