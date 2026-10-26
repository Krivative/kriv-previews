// Public directory collectors shared by the finder scripts (hotfrog.mjs, chamber.mjs) and the
// Lead Desk's Find screen. Polite on purpose: one request at a time, a pause of several seconds
// between requests, no retries, and a block or captcha is never worked around.
// Output holds business emails: keep it outside Git (docs/LEAD-FINDER.md).
import { execFile } from "node:child_process";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// curl, not fetch: Hotfrog answers Node's fetch with 403.
export function get(url) {
  return new Promise((resolve) => {
    execFile("curl", ["-s", "-L", "--max-time", "30", "-A", UA, "-w", "\n%{http_code}", url], { encoding: "utf8", maxBuffer: 1 << 26 }, (err, stdout = "") => {
      const i = stdout.lastIndexOf("\n");
      const status = Number(stdout.slice(i + 1)) || 0;
      resolve({ status, html: status === 200 ? stdout.slice(0, i) : "" });
    });
  });
}
const text = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

export const HOTFROG_CATS = {
  dental: ["dentists", "dentist"], chiro: ["chiropractors", "chiropractor"], hvac: ["heating-air-conditioning", "hvac", "air-conditioning"], medspa: ["medical-spa", "medical-spas", "skin-care"],
  plumbing: ["plumbers", "plumbing"], auto: ["auto-repair", "car-repair", "mechanics"],
};

/**
 * Hotfrog listings: search pages per town and niche, then each company page.
 * towns: ["waco-tx", "ocala-fl"]; a bare town means Texas. opts: { niches, log, pause, cancelled }.
 */
export async function hotfrog(towns, { niches = Object.keys(HOTFROG_CATS), log = console.error, pause = () => sleep(5000 + Math.random() * 4000), cancelled = () => false } = {}) {
  const cities = towns.map((c) => (/-[a-z]{2}$/.test(c) ? c : `${c}-tx`));
  const seen = new Map();
  for (const city of cities) for (const niche of niches) for (const cat of HOTFROG_CATS[niche] ?? []) {
    if (cancelled()) return [];
    const url = `https://www.hotfrog.com/search/${city}/${cat}`;
    const { status, html } = await get(url);
    const links = [...new Set([...html.matchAll(/href="(\/company\/[^"#]+)"/g)].map((m) => m[1]))];
    log(`${status} ${url} ${links.length}`);
    for (const l of links) if (!seen.has(l)) seen.set(l, { niche, searchUrl: url, area: city });
    await pause();
  }
  const out = [];
  for (const [path, meta] of seen) {
    if (cancelled()) break;
    const url = `https://www.hotfrog.com${path}`;
    const { status, html } = await get(url);
    if (status !== 200) {
      log(`${status} ${url}`);
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
    log(`ok ${name} | ${phone} | ${websites[0] ?? "-"} | ${emails.join(",")}`);
    await pause();
  }
  return out;
}

const CHAMBER_NICHE = [
  ["dental", /dent(al|ist)/i],
  ["chiro", /chiropract/i],
  ["hvac", /(air[- ]condition|heating|hvac|mechanical)/i],
  ["medspa", /(med(ical)?[- ]spa|aesthetic|skin|cosmetic surg|laser|botox|day spa|spas?\b)/i],
  ["plumbing", /plumb/i],
  ["auto", /(auto(motive)? (repair|service)|car repair|mechanic|transmission|brake)/i],
];
const nicheOf = (s) => CHAMBER_NICHE.find(([, re]) => re.test(s))?.[0];

/**
 * ChamberMaster/GrowthZone member directories (".../list/" URLs): finds niche categories (also
 * behind "More..." quick links), then each member's detail page and its website link.
 * opts: { niches, log, pause, cancelled }.
 */
export async function chamber(lists, { niches = null, log = console.error, pause = () => sleep(4000 + Math.random() * 3000), cancelled = () => false } = {}) {
  const members = new Map();
  for (const list of lists) {
    const origin = new URL(list).origin;
    const cats = new Map();
    const quick = new Set();
    // Query strings only re-sort or print the same page; drop them so each page is fetched once.
    const clean = (href) => new URL(href.replace(/&amp;/g, "&"), origin).href.split("?")[0];
    const scan = (html, fromTop) => {
      for (const m of html.matchAll(/href="([^"]*\/list\/(category|ql)\/[^"]+)"[^>]*>([^<]*)/gi)) {
        const href = clean(m[1]);
        const niche = nicheOf(m[3] + " " + href);
        if (m[2] === "category" && niche && (!niches || niches.includes(niche))) cats.set(href, niche);
        if (fromTop && m[2] === "ql" && /(health|medical|beauty|contractor|home|construct|wellness|personal)/i.test(m[3] + href)) quick.add(href);
      }
    };
    const top = await get(list);
    log(`${top.status} ${list}`);
    scan(top.html, true);
    for (const q of quick) { if (cancelled()) return []; await pause(); const r = await get(q); log(`${r.status} ${q}`); scan(r.html, false); }
    for (const [cat, niche] of cats) {
      if (cancelled()) return [];
      await pause();
      const r = await get(cat);
      const found = [...new Set([...r.html.matchAll(/href="([^"]*\/list\/member\/[^"#?]+)"/gi)].map((m) => new URL(m[1], origin).href))];
      log(`${r.status} ${found.length} members  ${cat}`);
      for (const f of found) if (!members.has(f)) members.set(f, { niche, category: cat });
    }
  }
  const results = [];
  for (const [url, meta] of members) {
    if (cancelled()) break;
    await pause();
    const r = await get(url);
    if (r.status !== 200) { log(`${r.status} ${url}`); continue; }
    const name = text(r.html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
    const website = r.html.match(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>\s*(?:<[^>]+>\s*)*Visit Website/i)?.[1]
      ?? r.html.match(/class="[^"]*gz-card-website[^"]*"[\s\S]*?href="(https?:\/\/[^"]+)"/i)?.[1]
      ?? r.html.match(/itemprop="url"[^>]*href="(https?:\/\/[^"]+)"/i)?.[1] ?? null;
    const address = text(r.html.match(/itemprop="streetAddress"[^>]*>([\s\S]*?)<\/[a-z]+>/i)?.[1] ?? "") + ", " + text(r.html.match(/itemprop="addressLocality"[^>]*>([\s\S]*?)<\/[a-z]+>/i)?.[1] ?? "") + " " + text(r.html.match(/itemprop="postalCode"[^>]*>([\s\S]*?)<\/[a-z]+>/i)?.[1] ?? "");
    const phone = text(r.html.match(/itemprop="telephone"[^>]*>([\s\S]*?)<\/[a-z]+>/i)?.[1] ?? r.html.match(/href="tel:([^"]+)"/i)?.[1] ?? "");
    const emails = [...new Set([...r.html.matchAll(/mailto:([^"?]+)/gi)].map((m) => decodeURIComponent(m[1]).toLowerCase()))];
    results.push({ ...meta, name, website, address, phone, emails, listingUrl: url });
    log(`ok ${meta.niche} | ${name} | ${website ?? "-"} | ${phone}`);
  }
  log(`${results.length} members`);
  return results;
}
