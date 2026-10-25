// Unsplash picker for preview photo slots. Rules: docs/PREVIEW-IMAGES.md.
//
//   node scripts/pick-photos.mjs search "<query>" [count]
//     Prints candidates and writes shots/photos/<query>.html, a contact sheet to look at.
//   node scripts/pick-photos.mjs use <slug> <photoId> [photoId...]
//     Sets leads/<slug>.json brand.photos (hotlinked Unsplash URLs, in the order given)
//     and brand.photoCredits, adds each photo page to `sources`, and tells Unsplash
//     the photos were used (their download endpoint, required by the API terms).
//
// Needs UNSPLASH_ACCESS_KEY in the environment or in .env.local.
// The key never goes into Git. Demo keys allow 50 requests an hour.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// .env.local in the repo (ignored by Git) first, then ~/kriv-secrets/unsplash.env.
const keyFiles = [".env.local", join(homedir(), "kriv-secrets", "unsplash.env")];
const fromFile = (f) => (existsSync(f) ? readFileSync(f, "utf8").match(/^UNSPLASH_ACCESS_KEY=(.+)$/m)?.[1].trim() : undefined);
const KEY = process.env.UNSPLASH_ACCESS_KEY ?? keyFiles.map(fromFile).find(Boolean);
if (!KEY) {
  console.error(`No Unsplash key: set UNSPLASH_ACCESS_KEY in .env.local (never committed)`);
  process.exit(1);
}
const api = async (path) => {
  const res = await fetch(`https://api.unsplash.com${path}`, { headers: { Authorization: `Client-ID ${KEY}`, "Accept-Version": "v1" } });
  if (!res.ok) throw new Error(`Unsplash ${res.status} on ${path}: ${(await res.text()).slice(0, 200)}`);
  console.error(`(Unsplash requests left this hour: ${res.headers.get("x-ratelimit-remaining")})`);
  return res.json();
};
// Words in Unsplash's own descriptions that suggest a photo shows people, brands or text.
// A hint for the reviewer, not a filter: always look at the photo itself.
const WARN = /\b(man|woman|men|women|person|people|boy|girl|child|kid|doctor|dentist|nurse|patient|face|portrait|smil|logo|sign|text|brand)\w*/i;
// Photographers that are businesses upload their own premises: another business's photos
// must never stand in for a lead's (docs/PLAN.md section 3), so these are flagged too.
const BUSINESS = /\b(dental|dentist|clinic|spa|chiro|hvac|heating|air|llc|inc|ltd|co\.|company|studio|medical|aesthetic|office)\b/i;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "search") {
  const [query, count = "12"] = args;
  const data = await api(`/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&content_filter=high`);
  const rows = data.results.map((p) => {
    const desc = [p.description, p.alt_description].filter(Boolean).join(" / ");
    const warn = [WARN.test(desc) ? desc.match(WARN)[0] : "", BUSINESS.test(p.user.name) ? `business account "${p.user.name}"` : ""].filter(Boolean).join("; ");
    return { id: p.id, desc, warn, by: p.user.name, thumb: p.urls.small, page: p.links.html };
  });
  for (const r of rows) console.log(`${r.id}\t${r.warn ? `CHECK(${r.warn}) ` : ""}${r.desc}\t${r.by}`);
  mkdirSync("shots/photos", { recursive: true });
  const file = `shots/photos/${query.replace(/\W+/g, "-")}.html`;
  writeFileSync(file, `<!doctype html><meta charset="utf-8"><title>${esc(query)}</title><style>body{font:13px system-ui;margin:12px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}figure{margin:0}img{width:100%;aspect-ratio:3/2;object-fit:cover}b{color:#b00}</style>`
    + rows.map((r) => `<figure><img src="${esc(r.thumb)}"><figcaption><code>${esc(r.id)}</code> ${r.warn ? `<b>check: ${esc(r.warn)}</b> ` : ""}${esc(r.desc)} · ${esc(r.by)}</figcaption></figure>`).join(""));
  console.error(`contact sheet: ${file}`);
} else if (cmd === "use") {
  const [slug, ...ids] = args;
  const file = join("leads", `${slug}.json`);
  const lead = JSON.parse(readFileSync(file, "utf8"));
  const photos = [];
  const credits = [];
  for (const id of ids) {
    const p = await api(`/photos/${id}`);
    // Hotlink the API's own URL; ixid and the other parameters must stay on it.
    photos.push(`${p.urls.raw}&w=1600&q=80&fm=jpg&fit=max`);
    credits.push({ provider: "Unsplash", photographer: p.user.name, profileUrl: p.user.links.html, photoPage: p.links.html });
    await api(p.links.download_location.replace("https://api.unsplash.com", ""));
    console.error(`used ${id}: ${p.alt_description ?? ""} · ${p.user.name}`);
  }
  lead.brand = { ...(lead.brand ?? {}), photos, photoCredits: credits };
  lead.sources = [...new Set([...(lead.sources ?? []).filter((s) => !s.startsWith("https://unsplash.com/photos/")), ...credits.map((c) => c.photoPage)])];
  writeFileSync(file, JSON.stringify(lead, null, 2) + "\n");
  console.error(`wrote ${file}: ${photos.length} photos with credits`);
} else {
  console.error('usage: node scripts/pick-photos.mjs search "<query>" [count] | use <slug> <photoId...>');
  process.exit(1);
}
