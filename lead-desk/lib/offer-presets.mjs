// No AI calls: approved niche templates plus neutral, reusable concept-offer wording.
import { prefill } from "./builder.mjs";
import { NICHE } from "../public/niches.js";

export const REVISIONS = ["Different look and wording", "Calmer look", "Bolder look", "Shorter wording", "More direct wording"];
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
export function sourceFor(value, pages, allowCompact = false) {
  const v = norm(value);
  const compact = v.replace(/ /g, "");
  return v && pages.find((p) => (` ${norm(p.text)} `).includes(` ${v} `) || (allowCompact && compact.length >= 5 && norm(p.text).replace(/ /g, "").includes(compact)));
}
// A short sentence from the business's own page that names the service. Claims KRIV must not
// repeat (prices, ratings, awards, years, guarantees, superlatives) and contact details are skipped.
const CLAIM = /(\$|%|\d{4}|#\s?1|\b(best|top|number one|leading|award|rated|reviews?|stars?|years?|since|guarantee[ds]?|warrant(y|ies)|cheap|cheapest|lowest|free|price[ds]?|cost|discount|coupon|special|certified|licensed|insured)\b)/i;
export function sentenceFor(name, pages) {
  const want = ` ${norm(name)} `;
  for (const p of pages) {
    for (const raw of String(p.text ?? "").split(/(?<=[.!?])\s+|\n+/)) {
      const s = raw.replace(/\s+/g, " ").trim();
      if (s.length < 25 || s.length > 180 || !/[.!]$/.test(s) || !/^[A-Z]/.test(s)) continue;
      if (CLAIM.test(s) || /@|https?:|www\.|\d{3}[ .-]\d{4}|\b(call|text|email)\b/i.test(s)) continue;
      if (` ${norm(s)} `.includes(want) && norm(s) !== norm(name)) return { text: s.replace(/!$/, "."), url: p.url };
    }
  }
  return null;
}
export function presetForm(lead, pages, templates, { revision = "", attempt = 0 } = {}) {
  const form = prefill(lead, pages, templates);
  const nameSource = sourceFor(lead.name, pages, true);
  if (!nameSource) throw new Error("The business name cannot be confirmed on a readable source. Held for investigation.");
  const seed = Array.from(lead.id ?? lead.name).reduce((sum, c) => sum + c.charCodeAt(0), 0) + attempt;
  const n = seed % 4;
  const all = templates.filter((t) => t.id).sort((a, b) => a.id.localeCompare(b.id));
  const requestedLook = /Calmer/.test(revision) ? "calm" : /Bolder/.test(revision) ? "bold" : null;
  const matching = requestedLook ? all.filter((t) => t.look === requestedLook) : all;
  const choices = matching.length ? matching : all;
  if (!choices.length) throw new Error("No registered website designs are available.");
  form.template = choices[seed % choices.length].id;
  const optional = ["city", "region", "postalCode", "line1", "aboutBody", "accent", "logo"];
  for (const key of optional) {
    const f = form.f[key];
    const p = f?.v ? sourceFor(f.v, pages) : null;
    if (!p || ["aboutBody", "accent", "logo"].includes(key)) delete form.f[key];
    else f.s = p.url;
  }
  // Category is a template classification, not a newly researched business claim.
  // Leave it empty if its exact wording cannot be supported; the template can hide it.
  const category = sourceFor(form.f.category?.v, pages);
  if (!category) delete form.f.category;
  else form.f.category.s = category.url;
  if (form.f.phone) {
    const digits = String(lead.phone ?? "").replace(/\D/g, "").slice(-10);
    const p = pages.find((p) => [...p.text.matchAll(/(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}/g)].some((m) => m[0].replace(/\D/g, "").slice(-10) === digits));
    if (!p || digits.length !== 10) delete form.f.phone; else form.f.phone.s = p.url;
  }
  delete form.f.eyebrow; delete form.f.closeHeadline; delete form.f.closeSub;
  form.f.name = { v: lead.name, s: nameSource.url };
  const name = lead.name;
  const headlines = [`Meet *${name}.*`, `Explore *${name}.*`, `A fresh look for *${name}.*`, `Welcome to *${name}.*`];
  const h = /Shorter/.test(revision) ? headlines[0] : headlines[n];
  form.f.headline = { v: h.length <= 70 ? h : name.slice(0, 70), s: nameSource.url };
  form.f.sub = { v: (/Shorter/.test(revision) ? "A concept website prepared by KRIV." : `A concept website prepared by KRIV for ${name}.`).slice(0, 160), s: nameSource.url };
  form.lists.services = form.lists.services.filter((s) => sourceFor(s.name, pages) && NICHE[lead.niche]?.services?.test(s.name)).map((s) => {
    const line = sentenceFor(s.name, pages);
    return { name: s.name, blurb: (line?.text ?? `Learn about ${s.name.toLowerCase()}.`).slice(0, 180), s: (line ?? sourceFor(s.name, pages)).url };
  });
  form.lists.hours = form.lists.hours.filter((h) => sourceFor(h.days, pages) && sourceFor(h.time, pages));
  form.lists.custom = [];
  return form;
}
export function presetEmail(lead, rec, { revision = "", attempt = 0 } = {}) {
  const intro = /direct/i.test(revision) ? "I prepared a website concept for your business." : "I put together a website concept for your team to take a look at.";
  const close = /shorter/i.test(revision) ? "Interested in discussing it?" : attempt % 2 ? "If this direction interests you, reply and we can discuss what you would want from a website." : "Would you be open to a quick conversation about it?";
  return { subject: `A website concept for ${lead.name}`, to_addr: lead.email, body: `Hi ${lead.name} team,\n\n${intro}\n\nhttps://kriv.agency/${rec.slug}\n\n${close}\n\nKriv` };
}
