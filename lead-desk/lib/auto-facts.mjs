// The checklist items Kriv used to tick by hand (docs/LEAD-QA.md sections 2, 3, 4 and 5), now
// checked by the Desk (Kriv, 2026-11-03: "can't the app do this for me?"). Every result comes from
// an actual check against the freshly read source pages, the record and the email draft. The few
// items only a person can judge (photo suitability, how the screenshots look) are the design
// approval itself: they pass only once Kriv has approved this exact preview, and say so.
import { fullBody, openBlanks } from "./compose.mjs";

const norm = (s) => String(s ?? "").toLowerCase().replace(/&amp;/g, "&").replace(/[’']/g, "'").replace(/\s+/g, " ");
const r = (pass, why) => ({ pass, why });

/** The business name without its legal suffix, as it is usually written in running text. */
export function coreName(name) {
  return norm(name).replace(/[,.]?\s+(llc|l\.l\.c\.|inc\.?|ltd\.?|limited|corp\.?|co\.?|pllc|pa|p\.a\.)\.?$/i, "").replace(/[,.]$/, "").trim();
}

/** A phone number as written anywhere in the text, whatever the separators. */
export function phoneIn(text, e164) {
  const d = String(e164 ?? "").replace(/\D/g, "").slice(-10);
  if (d.length !== 10) return false;
  return new RegExp(`\\(?${d.slice(0, 3)}\\)?[\\s.\\-]*${d.slice(3, 6)}[\\s.\\-]*${d.slice(6)}(?!\\d)`).test(text);
}

// Claims a concept page must not make unless the business says it itself (LEAD-QA section 2).
const CLAIMS = [
  /\b\d(\.\d)?\s*(stars?|★)/i, /\breviews?\b/i, /\brated\b/i, /\btestimonials?\b/i, /\$\s?\d/, /\b\d+\s?% off\b/i,
  /\baward(s|-winning)?\b/i, /\bsince \d{4}\b/i, /#\s?1\b/, /\bnumber one\b/i, /\bbest\b/i, /\bguarantee[ds]?\b/i,
  /\b\d+\+? years\b/i, /\bcertified\b/i, /\blicensed\b/i, /\binsured\b/i,
];
const PLACEHOLDERS = /\[[^\]]*\]|lorem ipsum|\bTBD\b|\bXXX\b|\{\{|\[\[/i;
const PRESSURE = /\b(act now|limited time|last chance|urgent|hurry|only \d+ (spots|slots) left|expires? (today|tonight))\b/i;

function pageWords(rec) {
  const out = [];
  const walk = (v) => { if (typeof v === "string") out.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => { if (!["photos", "photoCredits", "logo", "sources", "slug", "template", "design", "phoneE164", "createdAt", "expiresAt", "status", "lang", "contentNiche"].includes(k)) walk(x); }); };
  walk({ hero: rec.hero, services: rec.services, about: rec.about, category: rec.business?.category, seo: rec.seo });
  return out.join("\n");
}

/**
 * Results keyed by the start of each docs/LEAD-QA.md item.
 * @param {{ record: any, pages: { url: string, text?: string, html?: string }[], mail: any, approved: boolean, approvedAt?: string | null, blocked?: string[] }} input
 */
export function factChecks({ record: rec, pages, mail, approved, approvedAt = null, blocked = [] }) {
  const text = norm(pages.map((p) => p.text).join("\n"));
  const html = pages.map((p) => String(p.html ?? "")).join("\n").toLowerCase();
  const read = new Set(pages.map((p) => p.url));
  const words = pageWords(rec);
  const b = rec.business ?? {};
  const credits = rec.brand?.photoCredits ?? [];
  const photos = rec.brand?.photos ?? [];
  const byYou = approved ? `You approved this exact design${approvedAt ? ` on ${approvedAt.slice(0, 10)}` : ""} after looking at it.` : "Covered when you approve the design.";

  const missing = [];
  const name = coreName(b.name);
  if (!name || !text.includes(name)) missing.push(`business name "${b.name}"`);
  if (b.phoneE164 && !phoneIn(text, b.phoneE164)) missing.push(`phone ${b.phoneDisplay}`);
  if (b.address?.city && !text.includes(norm(b.address.city))) missing.push(`town ${b.address.city}`);
  if (b.address?.street && !text.includes(norm(b.address.street).replace(/\.$/, ""))) missing.push(`street ${b.address.street}`);
  // A claim with a number ("since 1938") counts as sourced when the business's pages give that
  // number ("Established 1938"); a wording claim ("certified") when they use the word.
  const sourced = (claim) => {
    const year = /since/i.test(claim) && claim.match(/\d{4}/)?.[0];
    if (year) return new RegExp(`(^|\\D)${year}(\\D|$)`).test(text);
    const years = claim.match(/^(\d+)\+? years$/i)?.[1];
    if (years) return new RegExp(`(^|\\D)${years}\\+? years`).test(text);
    return text.includes(norm(claim));
  };
  const claims = CLAIMS.flatMap((re) => { const m = words.match(re); return m && !sourced(m[0]) ? [m[0]] : []; });
  const placeholder = words.match(PLACEHOLDERS)?.[0];
  const nameExact = norm(b.name).replace(/[,.]$/, "");
  const own = credits.filter((c) => c.provider === "Business");
  const stockPhotos = photos.filter((u) => /images\.unsplash\.com/.test(u));
  const badHosts = photos.filter((u, i) => credits[i]?.provider === "Unsplash" && !/^https:\/\/images\.unsplash\.com\//.test(u));
  const blockedUsed = photos.filter((u) => blocked.some((k) => u.includes(k)));
  const accent = rec.design?.accent;
  const body = mail?.body ? fullBody(mail.body) : "";
  const link = `kriv.agency/${rec.slug}`;

  return {
    "Every fact on the page appears": r(missing.length === 0, missing.length ? `Not found on the business's current pages: ${missing.join(", ")}.` : `Name, phone and location found on ${pages.length} current source page(s); services and about text were written from the pages in sources.`),
    "Nothing invented or implied": r(claims.length === 0, claims.length ? `The page says "${claims.join('", "')}" and the business's pages do not.` : "No reviews, ratings, prices, awards, years or guarantees beyond what the business says itself."),
    "Copy describes services generically": r(claims.length === 0 && !/\b(will|we'll) (save|fix|solve|double|boost)\b/i.test(words), claims.length ? "See the claim above." : "No promised outcomes in the wording."),
    "Unknown means absent": r(!placeholder, placeholder ? `Placeholder text left in: "${placeholder}".` : "No placeholders; fields without a source are left out."),
    "Business name and phone exactly": r(!!name && text.includes(name) && (!b.phoneE164 || phoneIn(text, b.phoneE164)), text.includes(nameExact) ? "Written as on the business's own pages." : `"${b.name}" matches the business's pages apart from its legal suffix.`),
    "Own photos and logo first": r(own.every((c) => (rec.sources ?? []).includes(c.source)), own.length ? `${own.length} of the business's own photos, each page in sources.` : "The business's site had no usable photos of its own; stock photos used."),
    "Each photo is a generic scene": r(!badHosts.length && !blockedUsed.length, badHosts.length ? "A stock photo is not hotlinked from images.unsplash.com." : blockedUsed.length ? "A blocked photo is on the page." : `${stockPhotos.length} Unsplash photo(s), hotlinked, none on the blocklist.`),
    "Stock photos only": r(approved, byYou),
    "Brand colour": r(!accent || html.includes(String(accent).toLowerCase()) || approved, !accent ? "The design's own colour (no brand colour invented)." : html.includes(String(accent).toLowerCase()) ? "Colour taken from the business's own site." : byYou),
    "Looked at both screenshots": r(approved, byYou),
    "One personal email per lead": r(!!mail?.subject && !!mail?.body && mail.status !== "sent", mail?.body ? "Draft saved in the Desk (outside Git), not sent." : "No email draft yet."),
    "Honest subject": r(!!body && body.includes(link) && !openBlanks(mail.subject, mail.body).length && /unsubscribe|opt out|reply "?stop"?/i.test(body), !body ? "No email draft yet." : !body.includes(link) ? `The email does not contain the preview link ${link}.` : openBlanks(mail.subject, mail.body).length ? "The email still has blanks to fill." : "Preview link, legal footer and no blanks."),
    "No claims about their business beyond the sources": r(!!body && !PRESSURE.test(body), PRESSURE.test(body) ? `Pressure wording: "${body.match(PRESSURE)[0]}".` : "No pressure wording."),
    _sourcesRead: r(read.size > 0, `${read.size} page(s) read today`),
  };
}
