// Kriv's lead rules, shared by scripts/finder/qualify.mjs and the Lead Desk (lead-desk/).
// Changing a rule here changes both; see docs/LEAD-FINDER.md before editing.
import { isBusinessMailbox, FREE_MAIL } from "../site-flags.mjs";

export const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return null; } };
export const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"');

export const CHAIN = /(aspen dental|castle dental|monarch dental|western dental|bright now|kool smiles|comfort dental|brident|coast dental|smile brands|heartland|great expressions|the joint|one hour heating|aire serv|service experts|rescue rooter|mr\.? cool|abc home|ideal image|laseraway|massage envy|hand ?& ?stone|sono bello|woodhouse|restore hyper|drip ?bar|procare injury|topaz dentistry|ace dental|daikin|airtron|td industries|roto-?rooter|mr\.? rooter|benjamin franklin|ars ?\/|meineke|midas|jiffy lube|firestone|pep boys|goodyear|monro|precision tune|christian brothers|aamco|mr\.? transmission|valvoline|take 5|big o tires|brakes plus|ntb|caliber|maaco|tire kingdom|les schwab|discount tire|o'?reilly|autozone|advance auto parts)/i;
export const SPECIALIST = /(orthodont|pediatric|children|kids|oral (and maxillofacial )?surg|maxillofacial|periodont|endodont|braces)/i;
export const NOT_NICHE = /(staffing|supply|supplies|imaging|army|distribution|welding|plumbing supply|insurance|realty|bank)/i;

/** Chains, franchises, specialists and businesses outside the niches are skipped. */
export function isExcluded(name, website = "") {
  return CHAIN.test(name) || CHAIN.test(website) || SPECIALIST.test(name) || SPECIALIST.test(website) || /childrens?dentist|kidsdent|pedo/i.test(website) || NOT_NICHE.test(name);
}

export const PLAIN_FLAGS = {
  unreachable: "the website doesn't load (dead domain, error page or broken security certificate)",
  "no-https": "no secure https:// version",
  "no-mobile-viewport": "not set up for phones (no mobile viewport)",
  "sideways-scroll-on-phone": "the page scrolls sideways on a phone",
  "slow-load": "takes over 8 seconds to load",
  "placeholder-or-empty": "placeholder, parked or nearly empty page",
};
export const plain = (f) => PLAIN_FLAGS[f] ?? (f.startsWith("copyright-") ? `newest copyright notice is ${f.slice(10)}` : f);

const CH = { "metrosa.com": ["TX", "San Antonio"], "boerne.org": ["TX", "Boerne"], "tylertexas.com": ["TX", "Tyler"], "cachechamber.com": ["UT", "Logan"], "stgeorgechamber.com": ["UT", "St. George"], "ogdenweberchamber.com": ["UT", "Ogden"], "thechamber.org": ["UT", "Provo/Orem"] };

/** A Hotfrog listing (scripts/finder/hotfrog.mjs output) as a candidate. */
export function fromHotfrog(h) {
  const [, town] = h.address.split(", ");
  const STATE = /^(TX|FL|UT)$/;
  const state = [h.region, h.area?.slice(-2), h.address.match(/,\s*(TX|FL|UT)\b/)?.[1]].map((s) => (s ?? "").toUpperCase()).find((s) => STATE.test(s)) ?? "TX";
  return {
    state, town: h.town ?? town, niche: h.niche, name: h.name,
    address: h.address, phone: h.phone, website: h.websites[0] ? `${new URL(h.websites[0]).origin}/` : null,
    emailsListing: h.emails, listingUrl: h.listingUrl, sources: [h.listingUrl], via: "hotfrog", keywords: h.keywords,
  };
}

/** A ChamberMaster member (scripts/finder/chamber.mjs output) as a candidate. */
export function fromChamber(m, where = Object.entries(CH).find(([d]) => m.listingUrl.includes(d))?.[1]) {
  return { state: where?.[0], town: where?.[1], niche: m.niche, name: m.name, address: m.address, phone: m.phone, website: m.website ? `${new URL(m.website).origin}/` : null, emailsListing: m.emails, listingUrl: m.listingUrl, sources: [m.listingUrl], via: "chamber", stateFromListing: m.listingUrl };
}

/** Candidates keyed by website host (or listing URL when there is no website); later finds fill gaps. */
export function candidateMap() {
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
  return { cands, add };
}

/**
 * Applies the rules to one candidate. `checks` maps host -> check-site.mjs result, `visual` maps
 * host -> { failed: [...] }, `hasMx(domain)` resolves to true when the domain receives mail.
 * Returns { bucket, rec } with bucket one of: skip (chain, specialist, other niche), ungraded,
 * notChecked, near, qualified, toReview (passes the technical check, needs the visual review), none.
 */
export async function classify(c, { checks, visual = {}, hasMx }) {
  const r = c.website ? checks.get(host(c.website)) : null;
  const name = decode(c.name ?? (r?.title ?? "").split(/\s[|–—-]\s/)[0].trim());
  if (isExcluded(name, c.website ?? "")) return { bucket: "skip" };
  if (c.website && !r) return { bucket: "ungraded" };
  if (r?.flags.includes("not-checked")) return { bucket: "notChecked", rec: { state: c.state, town: c.town, niche: c.niche, name, website: c.website, why: r.error ?? `${r.status} ${r.title ?? ""}`.trim() } };
  const noSite = !c.website;
  // Visual review (Kriv, 2026-10-25): a working site that fails 2+ items of the dated/amateur
  // checklist in docs/LEAD-FINDER.md counts as weak.
  const look = c.website ? visual[host(c.website)] : null;
  const weak = noSite || r.weak || (look?.failed?.length ?? 0) >= 2;
  const siteEmails = (r?.emails ?? r?.roleEmails ?? []).map((e) => ({ email: e, where: r.contactUrl ?? r.finalUrl ?? c.website }));
  const listEmails = (c.emailsListing ?? []).map((e) => ({ email: e, where: c.listingUrl }));
  const biz = [...siteEmails, ...listEmails].filter((e) => isBusinessMailbox(e.email, { name, website: c.website ?? "" }));
  if (process.env.SHOW_REJECTED && weak) for (const e of [...siteEmails, ...listEmails]) if (!biz.includes(e)) console.error("REJECTED", c.state, c.niche, name, "|", e.email, "|", e.where);
  const rec = {
    state: c.state ?? null, town: c.town ?? null, niche: c.niche, name, address: c.address ?? null, phone: c.phone ?? null,
    website: c.website, websiteStatus: noSite ? "no website listed" : r.flags.length ? r.flags.map(plain).join("; ") : "modern",
    flags: noSite ? ["no-website"] : r.flags, looksDated: look?.failed ?? [], email: biz[0]?.email ?? null, emailFoundAt: biz[0]?.where ?? null,
    otherBusinessEmails: biz.slice(1).map((b) => b.email), sources: [...new Set([...(c.sources ?? []), ...(r ? [r.finalUrl ?? c.website] : []), ...(biz[0] ? [biz[0].where] : [])])].filter(Boolean),
    via: c.via, checkedAt: r?.checkedAt ?? null,
  };
  // A business whose email domain is another, working, non-weak website already has a good site.
  const mailHost = biz[0] ? biz[0].email.split("@")[1] : null;
  const other = mailHost && !FREE_MAIL.test(mailHost) && mailHost !== host(c.website ?? "") ? checks.get(mailHost.replace(/^www\./, "")) : null;
  if (other && !other.weak && !other.flags.includes("not-checked")) return { bucket: "near", rec: { ...rec, why: `has a working, modern site at ${mailHost} (the domain of its email)` } };
  // The email must be deliverable: its domain needs mail (MX) records. A dead domain's info@ bounces.
  if (weak && biz.length) {
    if (!(await hasMx(mailHost))) return { bucket: "near", rec: { ...rec, why: `email domain ${mailHost} has no mail records, so the address would bounce` } };
    return { bucket: "qualified", rec };
  }
  if (weak) return { bucket: "near", rec: { ...rec, why: "weak or no website, but no business email found" } };
  if (biz.length && !look) return { bucket: "toReview", rec: { ...rec, why: "site passes the technical check; needs the visual review" } };
  return { bucket: "none", rec };
}
