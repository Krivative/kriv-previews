// What "offer-ready" means for one lead, as plain checks on its record. Pure:
// no network, no writes. Used by scripts/offer-ready.mjs and its tests.
//
// A lead is offer-ready when a client could be sent its link today and find a
// truthful concept site AND KRIV's offer for their market, with nothing that
// would embarrass either side: no placeholders, no expired dates, no drafts.

/** The offer plans that exist, and the markets each one is written for. Prices live in src/offers/. */
// "*" is every market without a price plan of its own: the price-free "consult first" offer.
import { PRICING_VERSION } from "../../src/offers/pricing.ts";

export const offerPlans = { "ph-local": { label: "Philippine rates", countries: ["PH"] }, "us-pricing": { label: "USD pricing", countries: ["US"] }, "consult-first": { label: "Consult first (no prices)", countries: ["*"] } };
const priced = (country) => Object.entries(offerPlans).find(([, p]) => p.countries.includes(country));
/** The plan written for a country: its own price plan if there is one, otherwise "consult first". */
export const planFor = (country) => (priced(country) ?? ["consult-first"])[0];
const fits = (plan, country) => (offerPlans[plan].countries.includes("*") ? country !== "PH" : offerPlans[plan].countries.includes(country));

const PLACEHOLDER = /\[[A-Z][A-Z0-9 '’.,:/-]{2,}\]/g;
const days = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

/**
 * Checks one lead record. `today` is an ISO date. `extras` carries facts the record cannot know:
 * castDraft (the story's cast lines are still drafts), missingAudio (narration files not on disk).
 * Returns { slug, ready, blockers, warnings, facts }.
 */
export function checkLead(lead, today, extras = {}) {
  const blockers = [], warnings = [];
  const country = lead.business?.address?.country ?? "?";
  const placeholders = [...new Set(JSON.stringify(lead).match(PLACEHOLDER) ?? [])];

  if (lead.status !== "approved" && lead.status !== "sent") blockers.push(`status is "${lead.status}", not approved`);
  if (!lead.expiresAt || days(today, lead.expiresAt) < 0) blockers.push(`preview expired on ${lead.expiresAt ?? "no date"}`);
  else if (days(today, lead.expiresAt) < 7) warnings.push(`preview expires in ${days(today, lead.expiresAt)} days (${lead.expiresAt})`);
  if (!lead.sources?.length) blockers.push("no public sources listed for its facts");
  if (placeholders.length) blockers.push(`${placeholders.length} placeholder${placeholders.length === 1 ? "" : "s"} still in the record: ${placeholders.slice(0, 4).join(", ")}${placeholders.length > 4 ? ", ..." : ""}`);
  if (!lead.business?.phone && !lead.business?.email) warnings.push("no phone or email for the business");

  // The offer: there must be one, written for this business's market, and still valid.
  const plan = lead.offer ? offerPlans[lead.offer.plan] : undefined;
  if (!lead.offer) blockers.push(`no offer on the record (the "${planFor(country)}" plan fits ${country}; add it with offer:ready <slug> --add)`);
  else if (!plan) blockers.push(`offer plan "${lead.offer.plan}" is not a known plan`);
  else {
    if (!fits(lead.offer.plan, country)) blockers.push(lead.offer.plan === "consult-first" ? `${country} has its own price plan ("${planFor(country)}"); use it instead of "consult-first"` : `offer plan "${lead.offer.plan}" is written for ${plan.countries.join(", ")}, but the business is in ${country}`);
    if (days(today, lead.offer.validUntil) < 0) blockers.push(`quotation ran out on ${lead.offer.validUntil}`);
    else if (days(today, lead.offer.validUntil) < 7) warnings.push(`quotation valid for ${days(today, lead.offer.validUntil)} more days`);
    if (lead.expiresAt && days(lead.expiresAt, lead.offer.validUntil) > 0) warnings.push("quotation outlives the preview link");
  }

  // The presentation: a story site should say who it is for before it is styled.
  if (lead.story) {
    if (!lead.storyStyle?.audience) warnings.push('story has no audience set (storyStyle.audience): the look may not suit the brand\'s real customers');
    if (extras.castDraft && lead.storyCast !== "off" && lead.storyStyle?.audience !== "adults") warnings.push("the story's cast lines are drafts the client has not approved");
    if (extras.missingAudio?.length) blockers.push(`narration files missing: ${extras.missingAudio.slice(0, 3).join(", ")}`);
  }

  return { slug: lead.slug, ready: blockers.length === 0, blockers, warnings, facts: { country, niche: lead.contentNiche ?? lead.template?.split("-")[0], story: lead.story ?? null, offer: lead.offer?.plan ?? null, placeholders: placeholders.length } };
}

/** The quote block for a lead whose market has a plan; null when no plan fits. Dates: valid until the preview expires, or 30 days. */
export function draftOffer(lead, today, number) {
  const country = lead.business?.address?.country;
  if (!country) return null;
  const end = new Date(Date.parse(`${today}T00:00:00Z`) + 30 * 86400000).toISOString().slice(0, 10);
  const validUntil = lead.expiresAt && lead.expiresAt < end && lead.expiresAt >= today ? lead.expiresAt : end;
  const plan = planFor(country);
  return { plan, ...(plan === "consult-first" ? {} : { catalogVersion: PRICING_VERSION }), quoteNumber: number, quoteDate: today, validUntil };
}

/** Totals for a set of results: how many are ready and what holds the rest back, most common first. */
export function summarise(results) {
  const why = new Map();
  for (const r of results) for (const b of r.blockers) { const key = b.replace(/\d{4}-\d{2}-\d{2}/g, "<date>").replace(/^\d+ placeholders?.*/, "placeholders still in the record").replace(/fits [A-Z?]{1,2};/, "fits;"); why.set(key, (why.get(key) ?? 0) + 1); }
  return { total: results.length, ready: results.filter((r) => r.ready).length, blockers: [...why.entries()].sort((a, b) => b[1] - a[1]) };
}
