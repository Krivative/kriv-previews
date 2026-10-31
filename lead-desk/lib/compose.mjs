// Email and LinkedIn wording: fill-in-the-blanks templates, the Gmail compose link, limits.
// Nothing here sends anything: Gmail opens a compose window and Kriv clicks Send by hand.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { host } from "../../scripts/finder/rules.mjs";
import { emailFooter, SENDER } from "../../src/outreach/footer.ts";

const here = dirname(fileURLToPath(import.meta.url));
export const loadTemplates = () => JSON.parse(readFileSync(join(here, "..", "templates.json"), "utf8"));

export const LINKEDIN_NOTE_MAX = 200; // LinkedIn's limit for a connection-request note
export const DAILY_EMAIL_LIMIT = 20;  // docs/OUTREACH.md: 20 a day for the first 2 weeks

const NICHE_WORDS = { dental: "dentists", hvac: "heating and air companies", chiro: "chiropractors", medspa: "med spas", plumbing: "plumbers", auto: "auto repair shops" };

// A plain-English sentence per checker flag, written so the owner can check it themselves.
export const PROBLEM_SENTENCES = {
  "sideways-scroll-on-phone": "On a phone, the home page scrolls sideways, so part of the page sits off-screen.",
  "no-mobile-viewport": "On a phone, the site shows the full desktop page shrunk down, so the text is tiny until you zoom in.",
  "no-https": "The site has no secure https:// version, so some browsers show a \"Not secure\" warning.",
  "slow-load": "The home page takes more than 8 seconds to load on a phone.",
  "placeholder-or-empty": "The home page is nearly empty or shows placeholder text.",
};

/** Short name for the greeting: "Hilliard's Air Conditioning & Heating Inc." -> "Hilliard's". */
export function teamName(name = "") {
  const clean = name.replace(/,?\s+(llc|inc\.?|pllc|pa|co\.?|corp\.?|company)$/i, "").trim();
  const words = clean.split(/\s+/);
  return words.length <= 3 ? clean : words.slice(0, 2).join(" ");
}

/** Values a template can use, all from the lead record. Missing ones stay blank on purpose. */
export function valuesFor(lead) {
  const flags = lead.flags ?? [];
  const problems = flags.map((f) => PROBLEM_SENTENCES[f]).filter(Boolean);
  const copyright = flags.find((f) => f.startsWith("copyright-"));
  if (copyright) problems.push(`The newest copyright notice on the site is ${copyright.slice(10)}.`);
  return {
    business: lead.name ?? "",
    team: teamName(lead.name ?? ""),
    town: lead.town ?? "",
    niche_plural: NICHE_WORDS[lead.niche] ?? "local businesses",
    website: lead.website ? host(lead.website) : "",
    preview_url: lead.slug ? `https://kriv.agency/${lead.slug}` : "",
    problem_1: problems[0] ?? "",
    problem_2: problems[1] ?? "",
    looks_dated: (lead.looks_dated ?? [])[0] ?? "",
    owner_first_name: "",
    sender: SENDER.name,
  };
}

/** Replaces {{name}} with values; returns the text and the names still blank. */
export function fill(text, values) {
  const blanks = new Set();
  const out = text.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (values[k]) return values[k];
    blanks.add(k);
    return `[[${k}]]`;
  });
  return { text: out, blanks: [...blanks] };
}

/** Blanks Kriv still has to fill in by hand: [[name]] markers left in the text. */
export const openBlanks = (...texts) => [...new Set(texts.flatMap((t) => [...String(t ?? "").matchAll(/\[\[(\w+)\]\]/g)].map((m) => m[1])))];

/** The full email body as it goes into Gmail: Kriv's text, a blank line, the CAN-SPAM footer. */
export const fullBody = (body) => `${String(body ?? "").replace(/\s+$/, "")}\n\n${emailFooter()}`;

/** A Gmail compose window from hello@kriv.agency with everything filled in. Opening it sends nothing. */
export function gmailComposeUrl({ to, subject, body }) {
  const p = new URLSearchParams({ authuser: SENDER.email, view: "cm", fs: "1", to, su: subject, body: fullBody(body) });
  return `https://mail.google.com/mail/?${p.toString()}`;
}
