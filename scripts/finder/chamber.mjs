// node scripts/finder/chamber.mjs <out.json> <listUrl...>   (output outside Git)
// ChamberMaster/GrowthZone member directories: finds niche categories (also behind
// "More..." quick links), then each member's detail page and its website link.
// curl, 4-7 s between requests.
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const NICHE = [
  ["dental", /dent(al|ist)/i],
  ["chiro", /chiropract/i],
  ["hvac", /(air[- ]condition|heating|hvac|mechanical)/i],
  ["medspa", /(med(ical)?[- ]spa|aesthetic|skin|cosmetic surg|laser|botox|day spa|spas?\b)/i],
];
const nicheOf = (s) => NICHE.find(([, re]) => re.test(s))?.[0];
const pause = () => new Promise((r) => setTimeout(r, 4000 + Math.random() * 3000));
const get = (url) => {
  const r = spawnSync("curl", ["-s", "-L", "--max-time", "30", "-A", UA, "-w", "\n%{http_code}", url], { encoding: "utf8", maxBuffer: 1 << 26 });
  const i = r.stdout.lastIndexOf("\n");
  return { status: Number(r.stdout.slice(i + 1)), html: r.stdout.slice(0, i) };
};
const text = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/\s+/g, " ").trim();

const [out, ...lists] = process.argv.slice(2);
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
      if (m[2] === "category" && nicheOf(m[3] + " " + href)) cats.set(href, nicheOf(m[3] + " " + href));
      if (fromTop && m[2] === "ql" && /(health|medical|beauty|contractor|home|construct|wellness|personal)/i.test(m[3] + href)) quick.add(href);
    }
  };
  const top = get(list);
  console.error(`${top.status} ${list}`);
  scan(top.html, true);
  for (const q of quick) { await pause(); const r = get(q); console.error(`${r.status} ${q}`); scan(r.html, false); }
  for (const [cat, niche] of cats) {
    await pause();
    const r = get(cat);
    const found = [...new Set([...r.html.matchAll(/href="([^"]*\/list\/member\/[^"#?]+)"/gi)].map((m) => new URL(m[1], origin).href))];
    console.error(`${r.status} ${found.length} members  ${cat}`);
    for (const f of found) if (!members.has(f)) members.set(f, { niche, category: cat });
  }
}
const results = [];
for (const [url, meta] of members) {
  await pause();
  const r = get(url);
  if (r.status !== 200) { console.error(`${r.status} ${url}`); continue; }
  const name = text(r.html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const website = r.html.match(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>\s*(?:<[^>]+>\s*)*Visit Website/i)?.[1]
    ?? r.html.match(/class="[^"]*gz-card-website[^"]*"[\s\S]*?href="(https?:\/\/[^"]+)"/i)?.[1]
    ?? r.html.match(/itemprop="url"[^>]*href="(https?:\/\/[^"]+)"/i)?.[1] ?? null;
  const address = text(r.html.match(/itemprop="streetAddress"[^>]*>([\s\S]*?)<\/[a-z]+>/i)?.[1] ?? "") + ", " + text(r.html.match(/itemprop="addressLocality"[^>]*>([\s\S]*?)<\/[a-z]+>/i)?.[1] ?? "") + " " + text(r.html.match(/itemprop="postalCode"[^>]*>([\s\S]*?)<\/[a-z]+>/i)?.[1] ?? "");
  const phone = text(r.html.match(/itemprop="telephone"[^>]*>([\s\S]*?)<\/[a-z]+>/i)?.[1] ?? r.html.match(/href="tel:([^"]+)"/i)?.[1] ?? "");
  const emails = [...new Set([...r.html.matchAll(/mailto:([^"?]+)/gi)].map((m) => decodeURIComponent(m[1]).toLowerCase()))];
  results.push({ ...meta, name, website, address, phone, emails, listingUrl: url });
  console.error(`ok ${meta.niche} | ${name} | ${website ?? "-"} | ${phone}`);
}
writeFileSync(out, JSON.stringify(results, null, 2));
console.error(`${results.length} members`);
