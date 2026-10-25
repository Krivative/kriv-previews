// Pure rules used by check-site.mjs, kept separate so tests can cover them.
// A flag is an objective fact a business owner can check for themselves.

// Hosts that mean the business already takes bookings online.
export const BOOKING_HOSTS = [
  "zocdoc.com", "localmed.com", "nexhealth.com", "jane.app", "vagaro.com", "boulevard.io",
  "mindbodyonline.com", "glossgenius.com", "housecallpro.com", "servicetitan.com",
  "calendly.com", "square.site", "squareup.com", "schedulicity.com", "chirotouch.com",
  "patientpop.com", "solutionreach.com", "weave.com", "yourdentalbooking.com",
];

// Mailbox names that belong to the business, not to a person.
const ROLE_NAMES = /^(info|office|contact|hello|hi|frontdesk|front\.desk|frontoffice|reception|appointments?|appts?|schedul(e|ing)|admin|team|service|services|customerservice|dispatch|support|sales|billing|smile|smiles|care|clinic|dental|dentist|chiro|spa|hvac|ac|ask|mail|inquir(y|ies)|booking|bookings|newpatients?|patients?)([._-].*)?$/i;

// Addresses in page markup that are never the business's own.
const IGNORE = /(example\.|sentry|wixpress|godaddy|squarespace|wordpress|domain\.com|email\.com|yourdomain|\.(png|jpe?g|gif|webp|svg)$)/i;

export function isRoleEmail(email) {
  return ROLE_NAMES.test(email.split("@")[0]);
}

// Words too common in business names to tie a mailbox to one business.
const GENERIC = new Set(("the and of at for family dental dentistry dentist dds dmd smile smiles clinic center centre care "
  + "chiropractic chiropractor chiro wellness health medical med spa medspa aesthetic aesthetics skin beauty laser "
  + "air conditioning heating cooling hvac ac mechanical refrigeration services service company co inc llc pllc pa "
  + "texas florida utah san antonio new city north south east west").split(" "));
const letters = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z]/g, "");

/**
 * A mailbox that belongs to the business: a role name (info@, office@...) or a local part
 * named after the business, e.g. acmedental@gmail.com for "Acme Dental" (Kriv, 2026-10-25).
 * A person's address (jsmith@, maria.lopez@) never counts, wherever it is hosted.
 */
export function isBusinessMailbox(email, { name = "", website = "" } = {}) {
  if (isRoleEmail(email)) return true;
  const local = letters(email.split("@")[0]);
  const words = name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !GENERIC.has(w));
  let label = "";
  try {
    label = letters(new URL(website).hostname.replace(/^www\./, "").split(".")[0]);
  } catch {}
  const compactName = letters(name);
  return (
    (compactName.length >= 6 && local.includes(compactName)) ||
    (label.length >= 5 && local.includes(label)) ||
    words.some((w) => local.startsWith(w) || local === w)
  );
}

/** Addresses a visitor can see: mailto links and the page's visible text. */
export function emailsIn(text, links = []) {
  const found = new Set();
  for (const l of links) {
    if (l.href.startsWith("mailto:")) found.add(decodeURIComponent(l.href.slice(7).split("?")[0]).trim().toLowerCase());
  }
  for (const m of text.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) found.add(m[0].toLowerCase());
  return [...found].filter((e) => !IGNORE.test(e));
}

const PARKED = /(domain (is )?for sale|\.[a-z]{2,}\s+is for sale|buy this domain|this domain may be for sale|hugedomains|afternic|sedo\b|dan\.com|parked free|website coming soon|under construction|website expired|reconnect your domain|account (has been )?suspended)/i;

// Bot walls, geo-blocks and checker hiccups. A visitor in the US may well see a working
// site, so these say nothing about the site and must never qualify a lead.
const BLOCKED_STATUS = [202, 401, 403, 418, 429];
const CHALLENGE = /(just a moment|checking your browser|attention required|access denied|country blocked|request blocked|are you a robot|verify you are human|ddos protection)/i;
const INCONCLUSIVE_ERROR = /(timeout|execution context was destroyed|navigation|ERR_ABORTED|ERR_HTTP2|ERR_CONNECTION_RESET|ERR_TIMED_OUT)/i;

/** Flags and the weak verdict for one check result. `now` is injectable for tests. */
export function flagsFor(r, now = new Date()) {
  const flags = [];
  if (r.error ? INCONCLUSIVE_ERROR.test(r.error) : BLOCKED_STATUS.includes(r.status) || CHALLENGE.test(r.title ?? "")) {
    return { flags: ["not-checked"], weak: false };
  }
  if (r.error || (r.status ?? 0) >= 400) flags.push("unreachable");
  else {
    if (!r.https) flags.push("no-https");
    if (!r.viewportMeta) flags.push("no-mobile-viewport");
    if ((r.overflowPx ?? 0) > 8) flags.push("sideways-scroll-on-phone");
    if (r.copyrightYear && r.copyrightYear <= now.getUTCFullYear() - 3) flags.push(`copyright-${r.copyrightYear}`);
    if ((r.loadMs ?? 0) > 8000) flags.push("slow-load");
    if (PARKED.test(r.title ?? "") || (r.textLength ?? 0) < 200) flags.push("placeholder-or-empty");
  }
  // One strong signal is enough; minor ones need company.
  const strong = ["unreachable", "no-https", "no-mobile-viewport", "sideways-scroll-on-phone", "placeholder-or-empty"];
  const weak = flags.some((f) => strong.includes(f)) || flags.length >= 2;
  return { flags, weak };
}
