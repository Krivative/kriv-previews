// node scripts/finder/qualify.mjs <dataDir> <outDir>   (both outside Git)
// dataDir holds r*-search.txt (state|town|niche|url), hotfrog*.json, chamber*.json and
// batches/*.json (check-site.mjs output, see grade.sh).
// Joins every candidate source with every check-site result and applies Kriv's rules:
// (no website OR weak website) AND a business mailbox (role or named after the business),
// independent (no chains, franchises, specialists). Writes qualified.json, near-misses.json,
// not-checked.json to outDir (outside Git).
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const [dir, outDir] = process.argv.slice(2);
const dns = (await import("node:dns")).promises;
const mxCache = new Map();
const hasMx = async (d) => {
  if (!mxCache.has(d)) mxCache.set(d, dns.resolveMx(d).then((r) => r.length > 0, () => false));
  return mxCache.get(d);
};
const { isBusinessMailbox } = await import(new URL("../site-flags.mjs", import.meta.url).href);
const J = (f) => (existsSync(join(dir, f)) ? JSON.parse(readFileSync(join(dir, f), "utf8").replace(/^\uFEFF/, "")) : null);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return null; } };
const CHAIN = /(aspen dental|castle dental|monarch dental|western dental|bright now|kool smiles|comfort dental|brident|coast dental|smile brands|heartland|great expressions|the joint|one hour heating|aire serv|service experts|rescue rooter|mr\.? cool|abc home|ideal image|laseraway|massage envy|hand ?& ?stone|sono bello|woodhouse|restore hyper|drip ?bar|procare injury|topaz dentistry|ace dental|daikin|airtron|td industries)/i;
const SPECIALIST = /(orthodont|pediatric|children|kids|oral (and maxillofacial )?surg|maxillofacial|periodont|endodont|braces)/i;
const NOT_NICHE = /(staffing|supply|supplies|imaging|army|distribution|welding|plumbing supply|insurance|realty|bank)/i;

// 1. Candidates keyed by website host (or by listing URL when there is no website).
const cands = new Map();
const add = (c) => {
  const key = c.website ? host(c.website) : c.listingUrl;
  if (!key) return;
  const prev = cands.get(key);
  if (!prev) return cands.set(key, { ...c, emailsListing: c.emailsListing ?? [], sources: [...(c.sources ?? [])] });
  prev.name ??= c.name; prev.address ??= c.address; prev.phone ??= c.phone; prev.state ??= c.state; prev.town ??= c.town;
  prev.emailsListing = [...new Set([...prev.emailsListing, ...(c.emailsListing ?? [])])];
  prev.sources = [...new Set([...prev.sources, ...(c.sources ?? [])])];
};
for (const f of readdirSync(dir).filter((f) => /^r\d+-search\.txt$/.test(f))) {
  for (const line of readFileSync(join(dir, f), "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [state, town, niche, url] = line.split("|");
    add({ state, town, niche, website: url, sources: [url], via: "web search" });
  }
}
for (const c of J("candidates.json")?.withSite ?? []) add({ state: "TX", town: "San Antonio", niche: c.niche, website: c.url, sources: [c.url], via: c.found.join("+") });
for (const c of J("dir-candidates.json") ?? []) add({ state: "TX", town: "San Antonio", niche: c.niche, website: c.website, sources: [c.website, c.directoryUrl], via: "directory" });
for (const f of readdirSync(dir).filter((f) => /^hotfrog.*[.]json$/.test(f))) {
  for (const h of J(f) ?? []) {
    const [, town] = h.address.split(", ");
    const STATE = /^(TX|FL|UT)$/;
    const state = [h.region, h.area?.slice(-2), h.address.match(/,\s*(TX|FL|UT)\b/)?.[1]].map((s) => (s ?? "").toUpperCase()).find((s) => STATE.test(s)) ?? "TX";
    add({
      state, town: h.town ?? town, niche: h.niche, name: h.name,
      address: h.address, phone: h.phone, website: h.websites[0] ? `${new URL(h.websites[0]).origin}/` : null,
      emailsListing: h.emails, listingUrl: h.listingUrl, sources: [h.listingUrl], via: "hotfrog", keywords: h.keywords,
    });
  }
}
for (const f of readdirSync(dir).filter((f) => /^chamber.*[.]json$/.test(f))) {
  const CH = { "metrosa.com": ["TX", "San Antonio"], "boerne.org": ["TX", "Boerne"], "tylertexas.com": ["TX", "Tyler"], "cachechamber.com": ["UT", "Logan"], "stgeorgechamber.com": ["UT", "St. George"], "ogdenweberchamber.com": ["UT", "Ogden"], "thechamber.org": ["UT", "Provo/Orem"] };
  for (const m of J(f) ?? []) add({ state: Object.entries(CH).find(([d]) => m.listingUrl.includes(d))?.[1][0], town: Object.entries(CH).find(([d]) => m.listingUrl.includes(d))?.[1][1], niche: m.niche, name: m.name, address: m.address, phone: m.phone, website: m.website ? `${new URL(m.website).origin}/` : null, emailsListing: m.emails, listingUrl: m.listingUrl, sources: [m.listingUrl], via: "chamber", stateFromListing: m.listingUrl });
}

// 2. Check results keyed by host (latest wins).
const checks = new Map();
const files = ["checks-all.json", ...(existsSync(join(dir, "batches")) ? readdirSync(join(dir, "batches")) : []).filter((f) => f.endsWith(".json")).map((f) => join("batches", f))];
for (const f of files) for (const r of J(f) ?? []) { const h = host(r.url); if (h) checks.set(h, r); }

const plainFlags = {
  unreachable: "the website doesn't load (dead domain, error page or broken security certificate)",
  "no-https": "no secure https:// version",
  "no-mobile-viewport": "not set up for phones (no mobile viewport)",
  "sideways-scroll-on-phone": "the page scrolls sideways on a phone",
  "slow-load": "takes over 8 seconds to load",
  "placeholder-or-empty": "placeholder, parked or nearly empty page",
};
const plain = (f) => plainFlags[f] ?? (f.startsWith("copyright-") ? `newest copyright notice is ${f.slice(10)}` : f);

const qualified = [], near = [], notChecked = [];
for (const c of cands.values()) {
  const r = c.website ? checks.get(host(c.website)) : null;
  const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"');
  const name = decode(c.name ?? (r?.title ?? "").split(/\s[|–—-]\s/)[0].trim());
  if (CHAIN.test(name) || CHAIN.test(c.website ?? "") || SPECIALIST.test(name) || SPECIALIST.test(c.website ?? "") || /childrens?dentist|kidsdent|pedo/i.test(c.website ?? "") || NOT_NICHE.test(name)) continue;
  if (c.website && !r) continue; // not graded yet
  if (r?.flags.includes("not-checked")) { notChecked.push({ state: c.state, town: c.town, niche: c.niche, name, website: c.website, why: r.error ?? `${r.status} ${r.title ?? ""}`.trim() }); continue; }
  const noSite = !c.website;
  const weak = noSite || r.weak;
  const siteEmails = (r?.emails ?? r?.roleEmails ?? []).map((e) => ({ email: e, where: r.contactUrl ?? r.finalUrl ?? c.website }));
  const listEmails = (c.emailsListing ?? []).map((e) => ({ email: e, where: c.listingUrl }));
  const biz = [...siteEmails, ...listEmails].filter((e) => isBusinessMailbox(e.email, { name, website: c.website ?? "" }));
  const rec = {
    state: c.state ?? null, town: c.town ?? null, niche: c.niche, name, address: c.address ?? null, phone: c.phone ?? null,
    website: c.website, websiteStatus: noSite ? "no website listed" : r.flags.length ? r.flags.map(plain).join("; ") : "modern",
    flags: noSite ? ["no-website"] : r.flags, email: biz[0]?.email ?? null, emailFoundAt: biz[0]?.where ?? null,
    otherBusinessEmails: biz.slice(1).map((b) => b.email), sources: [...new Set([...(c.sources ?? []), ...(r ? [r.finalUrl ?? c.website] : []), ...(biz[0] ? [biz[0].where] : [])])].filter(Boolean),
    via: c.via, checkedAt: r?.checkedAt ?? null,
  };
  // A business whose email domain is another, working, non-weak website already has a good site.
  const FREE = /(gmail|yahoo|hotmail|outlook|aol|msn|icloud|live|comcast|att|sbcglobal|bellsouth|hughes|earthlink|verizon|cox|charter|me)\./i;
  const mailHost = biz[0] ? biz[0].email.split("@")[1] : null;
  const other = mailHost && !FREE.test(mailHost) && mailHost !== host(c.website ?? "") ? checks.get(mailHost.replace(/^www\./, "")) : null;
  if (other && !other.weak && !other.flags.includes("not-checked")) {
    near.push({ ...rec, why: `has a working, modern site at ${mailHost} (the domain of its email)` });
    continue;
  }
  // The email must be deliverable: its domain needs mail (MX) records. A dead domain's info@ bounces.
  if (weak && biz.length) {
    const ok = await hasMx(mailHost);
    if (!ok) { near.push({ ...rec, why: `email domain ${mailHost} has no mail records, so the address would bounce` }); continue; }
    qualified.push(rec);
  }
  else if (weak) near.push({ ...rec, why: "weak or no website, but no business email found" });
}
writeFileSync(join(outDir, "qualified.json"), JSON.stringify(qualified, null, 2));
writeFileSync(join(outDir, "near-misses.json"), JSON.stringify(near, null, 2));
writeFileSync(join(outDir, "not-checked.json"), JSON.stringify(notChecked, null, 2));
const count = (rows) => rows.reduce((m, r) => ((m[`${r.state}/${r.niche}`] = (m[`${r.state}/${r.niche}`] ?? 0) + 1), m), {});
console.log(`candidates ${cands.size}, graded ${checks.size}`);
console.log("qualified", qualified.length, JSON.stringify(count(qualified)));
console.log("near misses", near.length, "not checked", notChecked.length);
for (const q of qualified) console.log(`  ${q.state} ${q.town} ${q.niche} | ${q.name} | ${q.websiteStatus} | ${q.email}`);
