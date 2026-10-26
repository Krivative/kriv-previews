// Build preview: a form prefilled from the business's own website and listing, where every fact
// carries the URL it came from, turned into leads/<slug>.json (status "draft") and validated
// with the app's own schema (src/lib/site-schema.ts). Rules: docs/LEAD-QA.md.
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SiteData, SLUG_PATTERN, RESERVED_SLUGS } from "../../src/lib/site-schema.ts";
import { get } from "../../scripts/finder/sources.mjs";
import { host } from "../../scripts/finder/rules.mjs";
import { now, parse, slugify } from "./db.mjs";

export const NICHE_INFO = {
  hvac: { category: "Heating and air conditioning", noun: "heating and cooling", templates: ["hvac-calm", "hvac-bold"] },
  dental: { category: "Dental clinic", noun: "a dentist", templates: ["dental-clear", "dental-bold"] },
  chiro: { category: "Chiropractic clinic", noun: "a chiropractor", templates: ["chiro-calm", "chiro-bold"] },
  medspa: { category: "Med spa", noun: "skin and aesthetic care", templates: ["aesthetic-calm", "aesthetic-bold"] },
  plumbing: { category: "Plumbing", noun: "a plumber", templates: ["plumbing-calm", "plumbing-bold"] },
  auto: { category: "Auto repair", noun: "car repairs", templates: ["auto-calm", "auto-bold"] },
};
const STATE_NAMES = { TX: "Texas", FL: "Florida", UT: "Utah" };

// The form. `src: true` fields state facts, so a non-empty value needs the URL it came from.
// Headings marked src: false are KRIV's own neutral words and state no fact.
export const SPEC = [
  { section: "Business", fields: [
    { key: "name", label: "Business name, exactly as they write it", src: true, required: true },
    { key: "category", label: "Category", src: true, required: true },
    { key: "phone", label: "Phone", src: true },
    { key: "line1", label: "Street address (leave empty if sources disagree)", src: true },
    { key: "city", label: "Town", src: true, required: true },
    { key: "region", label: "State", src: true },
    { key: "postalCode", label: "ZIP code", src: true },
  ] },
  { section: "Hours", list: "hours", item: [{ key: "days", label: "Days" }, { key: "time", label: "Time" }], max: 7 },
  { section: "Top of the page", fields: [
    { key: "eyebrow", label: "Small line above the headline", src: true, max: 40 },
    { key: "headline", label: "Headline (*words in stars* get the accent)", src: true, required: true, max: 70 },
    { key: "sub", label: "Line under the headline", src: true, required: true, max: 160 },
  ] },
  { section: "Services", fields: [{ key: "servicesTitle", label: "Heading", src: false }], list: "services", item: [{ key: "name", label: "Service" }, { key: "blurb", label: "One line about it", max: 180 }], max: 8 },
  { section: "About", fields: [{ key: "aboutTitle", label: "Heading", src: false }, { key: "aboutBody", label: "About them (only what their own pages say)", src: true, max: 700, long: true }] },
  { section: "Their own section (offices, service area)", fields: [{ key: "customTitle", label: "Heading", src: true }], list: "custom", item: [{ key: "name", label: "Name" }, { key: "blurb", label: "Detail", max: 160 }], max: 6 },
  { section: "Closing", fields: [{ key: "closeHeadline", label: "Closing headline", src: true, max: 80 }, { key: "closeSub", label: "Closing line", src: true, max: 160 }] },
  { section: "Look", fields: [{ key: "accent", label: "Accent colour from their site or logo (empty = template default)", src: true }, { key: "logo", label: "Their logo (image URL from their own site)", src: true }] },
];
const FIELD = Object.fromEntries(SPEC.flatMap((s) => (s.fields ?? []).map((f) => [f.key, f])));
const isUrl = (s) => /^https?:\/\/\S+$/.test(String(s ?? ""));

/** Templates as the app registers them (src/templates/*.ts), read without running TypeScript. */
export function listTemplates(repo) {
  const dir = join(repo, "src", "templates");
  return readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts").map((f) => {
    const s = readFileSync(join(dir, f), "utf8");
    const m = (re) => s.match(re)?.[1] ?? null;
    return { id: m(/id:\s*"([^"]+)"/), name: m(/name:\s*"([^"]+)"/), look: m(/look:\s*"([^"]+)"/), accent: m(/accent:\s*"(#[0-9A-Fa-f]{3,8})"/), industries: (m(/industries:\s*\[([^\]]*)\]/) ?? "").match(/"[^"]+"/g)?.map((x) => x.slice(1, -1)) ?? [] };
  }).filter((t) => t.id);
}

// ---- Reading their pages ---------------------------------------------------------------

const strip = (html) => html.replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n))).replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|section)>/gi, "\n")
  .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&#x27;|&rsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&ndash;|&mdash;/g, "-")
  .split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");

/** One page, from the cache when fetched in the last week (pages change; facts are re-checked on build day). */
export async function fetchPage(db, url) {
  const cached = db.prepare("SELECT * FROM pages WHERE url = ?").get(url);
  if (cached && Date.now() - Date.parse(cached.fetched_at) < 7 * 864e5 && cached.status === 200) return { url, status: cached.status, html: cached.html, text: cached.text };
  const { status, html } = await get(url);
  const text = html ? strip(html) : "";
  db.prepare("INSERT INTO pages (url, status, html, text, fetched_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(url) DO UPDATE SET status = excluded.status, html = excluded.html, text = excluded.text, fetched_at = excluded.fetched_at")
    .run(url, status, html.slice(0, 2e6), text.slice(0, 2e5), now());
  return { url, status, html, text };
}

/** Their home page, a contact page and up to 3 service/about pages, plus their listing pages. */
export async function readSources(db, lead) {
  const out = [];
  const listing = db.prepare("SELECT url FROM sources WHERE lead_id = ?").all(lead.id).map((r) => r.url)
    .filter((u) => !/unsplash\.com|kriv\.agency/.test(u) && (!lead.website || host(u) !== host(lead.website)));
  if (lead.website) {
    const home = await fetchPage(db, lead.website);
    out.push(home);
    const links = [...home.html.matchAll(/<a[^>]+href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => { try { return { href: new URL(m[1], lead.website).href, text: strip(m[2]).toLowerCase() }; } catch { return null; } })
      .filter((l) => l && host(l.href) === host(lead.website) && !/\.(pdf|jpe?g|png)$/i.test(l.href));
    const pick = [];
    for (const re of [/contact/, /service|repair|install|treatment|what we do/, /about|our team|history/, /hours|location|visit/]) {
      const l = links.find((x) => re.test(x.text + " " + x.href) && !pick.includes(x.href) && x.href !== home.url);
      if (l) pick.push(l.href);
    }
    for (const u of pick.slice(0, 4)) out.push(await fetchPage(db, u));
  }
  for (const u of [...new Set(listing)].slice(0, 3)) out.push(await fetchPage(db, u));
  return out.map((p) => ({ url: p.url, status: p.status, html: p.html ?? "", text: p.text.slice(0, 20000), blocked: p.status !== 200 }));
}

// ---- Prefill ---------------------------------------------------------------------------

export function formatPhone(p) {
  const d = String(p ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : String(p ?? "");
}
export function parseAddress(a) {
  // "412 Dixie Highway, Auburndale, FL, 33823-2809" or "412 Dixie Hwy, Auburndale, FL 33823"
  const parts = String(a ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const out = {};
  const zip = String(a ?? "").match(/\b(\d{5})(?:-\d{4})?\b\s*$/)?.[1];
  const st = String(a ?? "").match(/\b(TX|FL|UT|[A-Z]{2})\b(?=[,\s]*\d{5}|\s*$)/)?.[1];
  if (zip) out.postalCode = zip;
  if (st) out.region = st;
  if (parts.length >= 3) { out.line1 = parts[0]; out.city = parts[1].replace(/\s+(TX|FL|UT)\b.*$/, ""); }
  return out;
}
const NOT_SERVICE = /^(home|about|contact|menu|call|book|schedule|services|our services|get a|request|learn more|read more|privacy|terms|pay your bill|select page|testimonials?|reviews?|blog|faq|gallery|careers|financing|specials|coupons|veteran|family owned|why choose|what our|follow us|quick links|hours|location)/i;
const HOURS_LINE =/^(mon|tue|wed|thu|fri|sat|sun|monday|weekdays|weekends|daily|open)[a-z\s.,&-]*[:\s-]+.*\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)/i;

/** A first draft of the form from the lead record and the text of its pages. Kriv edits all of it. */
export function prefill(lead, pages, templates) {
  const niche = NICHE_INFO[lead.niche] ?? { category: "", noun: "", templates: [] };
  const listingUrl = pages.find((p) => !p.blocked && lead.website && host(p.url) !== host(lead.website))?.url
    ?? (lead.sources ?? []).find((u) => !lead.website || host(u) !== host(lead.website)) ?? lead.website ?? "";
  const home = pages.find((p) => lead.website && p.url === lead.website && !p.blocked);
  const f = {};
  const set = (key, v, s) => { if (v) f[key] = { v: String(v), s: s ?? "" }; };
  const addr = parseAddress(lead.address);
  const base = lead.address ? listingUrl : "";
  set("name", lead.name, home && home.text.includes(lead.name) ? home.url : listingUrl);
  set("category", niche.category, listingUrl);
  set("phone", formatPhone(lead.phone), lead.phone ? (home && home.text.replace(/\D/g, "").includes(String(lead.phone).replace(/\D/g, "").slice(-10)) ? home.url : listingUrl) : "");
  set("line1", addr.line1, base);
  set("city", addr.city ?? lead.town, base || listingUrl);
  set("region", addr.region ?? lead.state, base || listingUrl);
  set("postalCode", addr.postalCode, base);
  const town = addr.city ?? lead.town ?? "";
  set("eyebrow", [town, STATE_NAMES[lead.state] ?? lead.state].filter(Boolean).join(", "), base || listingUrl);
  set("headline", `${niche.category} in *${town}.*`, base || listingUrl);
  set("closeHeadline", `Looking for ${niche.noun} in *${town}?*`, base || listingUrl);
  if (lead.phone) set("closeSub", `Call ${lead.name} at ${formatPhone(lead.phone)}.`, f.phone?.s);
  f.servicesTitle = { v: "What we do" };
  f.aboutTitle = { v: "About" };

  // Hours: lines that look like "Monday - Friday: 8:00 am - 5:00 pm" on their own pages.
  const lists = { hours: [], services: [], custom: [] };
  for (const p of pages.filter((x) => !x.blocked)) {
    for (const line of p.text.split("\n")) {
      if (lists.hours.length < 7 && line.length < 80 && HOURS_LINE.test(line)) {
        const m = line.match(/^(.*?)[:\s-]+(\d.*)$/);
        if (m && !lists.hours.some((h) => h.days === m[1].trim())) lists.hours.push({ days: m[1].trim(), time: m[2].trim(), s: p.url });
      }
    }
  }
  // Services: headings and list items in the page body (menus, header and footer removed); names
  // only, Kriv writes the one-liners from the page. A guess: delete whatever isn't a service.
  const svc = pages.find((p) => !p.blocked && /service|repair|treatment/i.test(p.url)) ?? home;
  if (svc?.html) {
    const seen = new Set([town.toLowerCase(), String(lead.name ?? "").toLowerCase()]);
    const body = svc.html.replace(/<(nav|header|footer|form)[\s\S]*?<\/\1>/gi, " ");
    for (const m of body.matchAll(/<(h[2-4]|li)[^>]*>([\s\S]*?)<\/\1>/gi)) {
      if (lists.services.length >= 6) break;
      const line = strip(m[2]).replace(/\n/g, " ").replace(/^[•·*–-]\s*/, "").trim();
      const w = line.split(" ").length;
      if (w >= 1 && w <= 6 && line.length > 3 && !/[!?:|©@]|\d{3}/.test(line) && /[a-z]/i.test(line) && !NOT_SERVICE.test(line) && !seen.has(line.toLowerCase())) {
        seen.add(line.toLowerCase());
        lists.services.push({ name: line.replace(/\.$/, ""), blurb: "", s: svc.url });
      }
    }
  }
  const metaDesc = home?.html?.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1];
  if (metaDesc) set("aboutBody", strip(metaDesc).slice(0, 700), home.url);
  if (lists.services.length) set("sub", `${lists.services.slice(0, 3).map((s) => s.name).join(", ")} in ${town}.`.replace(/^./, (c) => c.toUpperCase()), svc.url);

  const template = (niche.templates[0] && templates.some((t) => t.id === niche.templates[0])) ? niche.templates[0] : templates[0]?.id;
  return { slug: suggestSlug(lead.name), template, f, lists, photos: [] };
}

/** "Hilliard's Air Conditioning & Heating Inc." -> "hilliards-air". Kriv can change it. */
export function suggestSlug(name = "") {
  const words = slugify(String(name).replace(/'/g, "").replace(/\b(llc|inc|pllc|pa|co|corp|company|the|and|of)\b\.?/gi, "")).split("-").filter(Boolean);
  return words.slice(0, words.length > 3 ? 2 : 3).join("-") || "lead";
}

// ---- Form -> lead record ----------------------------------------------------------------

/** Problems that block saving: missing required fields, facts without a source URL, bad slug. */
export function formProblems(form, { repo, existingSlugOk = false } = {}) {
  const out = [];
  const val = (k) => String(form.f?.[k]?.v ?? "").trim();
  for (const [k, spec] of Object.entries(FIELD)) {
    if (spec.required && !val(k)) out.push(`${spec.label}: required`);
    if (spec.src && val(k) && !isUrl(form.f[k].s)) out.push(`${spec.label}: add the source URL`);
    if (spec.max && val(k).length > spec.max) out.push(`${spec.label}: ${val(k).length} characters, at most ${spec.max}`);
  }
  for (const s of SPEC.filter((x) => x.list)) {
    for (const [i, item] of (form.lists?.[s.list] ?? []).entries()) {
      const filled = s.item.some((c) => String(item[c.key] ?? "").trim());
      if (filled && !isUrl(item.s)) out.push(`${s.section} ${i + 1}: add the source URL`);
      for (const c of s.item) if (c.max && String(item[c.key] ?? "").length > c.max) out.push(`${s.section} ${i + 1}: ${c.label} is over ${c.max} characters`);
    }
    if ((form.lists?.[s.list] ?? []).length > s.max) out.push(`${s.section}: at most ${s.max}`);
  }
  if (val("accent") && !/^#[0-9a-f]{6}$/i.test(val("accent"))) out.push("Accent colour: use a hex colour like #1C6BB0");
  if (val("logo") && !isUrl(val("logo"))) out.push("Logo: must be an image URL");
  const slug = String(form.slug ?? "");
  if (!SLUG_PATTERN.test(slug)) out.push("Address (slug): lowercase letters, numbers and hyphens only");
  if (RESERVED_SLUGS.has(slug)) out.push("Address (slug): that's a kriv.agency page name");
  if (repo && !existingSlugOk && existsSync(join(repo, "leads", `${slug}.json`))) out.push(`Address (slug): leads/${slug}.json already exists`);
  for (const [i, p] of (form.photos ?? []).entries()) if (!isUrl(p.url) || !p.credit) out.push(`Photo ${i + 1}: needs a credit`);
  return out;
}

const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const e164 = (p) => { const d = String(p ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, ""); return d.length === 10 ? `+1${d}` : undefined; };

/** The leads/<slug>.json record. Empty fields are left out, so templates hide those sections. */
export function toRecord(form, { createdAt = new Date().toISOString().slice(0, 10), status = "draft" } = {}) {
  const v = (k) => String(form.f?.[k]?.v ?? "").trim() || undefined;
  const items = (name, cols) => (form.lists?.[name] ?? []).filter((it) => cols.some((c) => String(it[c] ?? "").trim())).map((it) => Object.fromEntries(cols.map((c) => [c, String(it[c] ?? "").trim() || undefined])));
  const services = items("services", ["name", "blurb"]).map((s) => ({ name: s.name ?? "", blurb: s.blurb ?? "" }));
  const custom = items("custom", ["name", "blurb"]);
  const photos = form.photos ?? [];
  const name = v("name");
  const rec = {
    slug: form.slug, template: form.template, lang: "en-US", createdAt, expiresAt: addDays(createdAt, 30), status,
    business: {
      name, category: v("category"), phoneDisplay: v("phone"), phoneE164: e164(v("phone")),
      address: { line1: v("line1"), city: v("city"), region: v("region"), postalCode: v("postalCode"), country: "US" },
      hours: items("hours", ["days", "time"]).map((h) => ({ days: h.days ?? "", time: h.time ?? "" })),
    },
    design: v("accent") ? { accent: v("accent") } : {},
    hero: { eyebrow: v("eyebrow"), headline: v("headline"), sub: v("sub") },
    services: services.length ? { title: v("servicesTitle") ?? "What we do", items: services } : undefined,
    about: v("aboutBody") ? { title: v("aboutTitle"), body: v("aboutBody") } : undefined,
    custom: v("customTitle") || custom.length ? { title: v("customTitle") ?? "", items: custom } : undefined,
    close: v("closeHeadline") ? { headline: v("closeHeadline"), sub: v("closeSub") } : undefined,
    seo: { title: `${name} | Concept preview`.slice(0, 70), description: `Concept preview of a website for ${name} in ${v("city")}${v("region") ? `, ${v("region")}` : ""}, prepared by KRIV.`.slice(0, 160) },
    brand: { ...(v("logo") ? { logo: v("logo") } : {}), photos: photos.map((p) => p.url), photoCredits: photos.map((p) => p.credit) },
    sources: [],
  };
  const urls = [
    ...Object.entries(form.f ?? {}).filter(([k, x]) => FIELD[k]?.src && String(x.v ?? "").trim()).map(([, x]) => x.s),
    ...SPEC.filter((s) => s.list).flatMap((s) => (form.lists?.[s.list] ?? []).map((it) => it.s)),
    ...photos.map((p) => p.credit?.photoPage ?? p.credit?.source),
  ].filter(isUrl);
  rec.sources = [...new Set(urls)];
  return JSON.parse(JSON.stringify(rec)); // drops undefined
}

/** Schema problems in plain words, from the app's own Zod schema. */
export function schemaProblems(rec) {
  const r = SiteData.safeParse(rec);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

/** Facts table for review: every sourced field with its value and source. */
export function factsOf(form) {
  const out = [];
  for (const s of SPEC) {
    for (const fd of s.fields ?? []) if (fd.src && String(form.f?.[fd.key]?.v ?? "").trim()) out.push({ label: fd.label.replace(/\s*\(.*$/, ""), value: form.f[fd.key].v, source: form.f[fd.key].s });
    if (s.list) for (const it of form.lists?.[s.list] ?? []) if (s.item.some((c) => String(it[c.key] ?? "").trim())) out.push({ label: s.section, value: s.item.map((c) => it[c.key]).filter(Boolean).join(": "), source: it.s });
  }
  for (const p of form.photos ?? []) out.push({ label: "Photo", value: p.credit.provider === "Unsplash" ? `${p.credit.photographer} on Unsplash` : "their own photo", source: p.credit.photoPage ?? p.credit.source });
  return out;
}

/** Writes leads/<slug>.json. Only a draft can be overwritten; approved and live pages are not edited here. */
export function writeLeadFile(repo, rec) {
  const file = join(repo, "leads", `${rec.slug}.json`);
  if (existsSync(file)) {
    const prev = parse(readFileSync(file, "utf8"), {});
    if (prev.status !== "draft") throw new Error(`leads/${rec.slug}.json is ${prev.status}; only drafts can be edited here.`);
    rec.createdAt = prev.createdAt ?? rec.createdAt;
    rec.expiresAt = addDays(rec.createdAt, 30);
  }
  writeFileSync(file, JSON.stringify(rec, null, 2) + "\n");
  return file;
}

