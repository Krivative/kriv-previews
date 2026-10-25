// node scripts/finder/hotfrog.mjs <out.json> <town-st,town-st,...>  (e.g. "waco-tx,ocala-fl")
// Hotfrog listings for the pilot niches: search pages, then each company page; 5-9 s pause
// between requests. Output holds business emails: write it outside Git (docs/LEAD-FINDER.md).
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const CATS = { dental: ["dentists", "dentist"], chiro: ["chiropractors", "chiropractor"], hvac: ["heating-air-conditioning", "hvac", "air-conditioning"], medspa: ["medical-spa", "medical-spas", "skin-care"] };
const pause = () => new Promise((r) => setTimeout(r, 5000 + Math.random() * 4000));
// curl, not fetch: Hotfrog answers Node's fetch with 403.
const get = async (url) => {
  const r = spawnSync("curl", ["-s", "-L", "-A", UA, "-w", "\n%{http_code}", url], { encoding: "utf8", maxBuffer: 1 << 26 });
  const i = r.stdout.lastIndexOf("\n");
  const status = Number(r.stdout.slice(i + 1));
  return { status, html: status === 200 ? r.stdout.slice(0, i) : "" };
};
const text = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

// Towns as "<town>-<state>" slugs, e.g. "waco-tx,ocala-fl"; a bare town means Texas.
const CITIES = (process.argv[3] ?? "san-antonio").split(",").map((c) => (/-[a-z]{2}$/.test(c) ? c : `${c}-tx`));
const seen = new Map();
for (const city of CITIES) for (const [niche, cats] of Object.entries(CATS)) {
  for (const cat of cats) {
    const url = `https://www.hotfrog.com/search/${city}/${cat}`;
    const { status, html } = await get(url);
    const links = [...new Set([...html.matchAll(/href="(\/company\/[^"#]+)"/g)].map((m) => m[1]))];
    console.error(`${status} ${url} ${links.length}`);
    for (const l of links) if (!seen.has(l)) seen.set(l, { niche, searchUrl: url, area: city });
    await pause();
  }
}

const out = [];
for (const [path, meta] of seen) {
  const url = `https://www.hotfrog.com${path}`;
  const { status, html } = await get(url);
  if (status !== 200) {
    console.error(`${status} ${url}`);
    await pause();
    continue;
  }
  let biz = {};
  try {
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    biz = (ld["@graph"] ?? [ld]).find((n) => n["@type"] === "LocalBusiness") ?? {};
  } catch {}
  const a = biz.address ?? {};
  const name = biz.name ?? text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "");
  const address = [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode].filter(Boolean).join(", ");
  const phone = [].concat(biz.telephone ?? html.match(/href="tel:([^"]+)"/)?.[1] ?? [])[0] ?? null;
  const emails = [...new Set([...[].concat(biz.email ?? []), ...[...html.matchAll(/mailto:([^"?]+)/g)].map((m) => decodeURIComponent(m[1]))].map((e) => e.toLowerCase()))];
  const websites = [...new Set([...html.matchAll(/class="btn has-icon--website"[\s\S]*?href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]))];
  out.push({ niche: meta.niche, area: meta.area, region: a.addressRegion ?? null, town: a.addressLocality ?? null, name, address, phone, emails, websites, keywords: [...new Set([...(biz.knowsAbout ?? []), ...(biz.keywords ?? [])])], description: (biz.description ?? "").slice(0, 400), listingUrl: url, searchUrl: meta.searchUrl });
  console.error(`ok ${name} | ${phone} | ${websites[0] ?? "-"} | ${emails.join(",")}`);
  await pause();
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
