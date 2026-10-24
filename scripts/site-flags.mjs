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
const ROLE_NAMES = /^(info|office|contact|hello|hi|frontdesk|front\.desk|reception|appointments?|appts?|schedul(e|ing)|admin|team|service|services|support|sales|billing|smile|smiles|care|clinic|dental|dentist|chiro|spa|hvac|ac|ask|mail|inquir(y|ies)|booking|bookings)([._-].*)?$/i;

// Addresses in page markup that are never the business's own.
const IGNORE = /(example\.|sentry|wixpress|godaddy|squarespace|wordpress|domain\.com|email\.com|yourdomain|\.(png|jpe?g|gif|webp|svg)$)/i;

export function isRoleEmail(email) {
  return ROLE_NAMES.test(email.split("@")[0]);
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

const PARKED = /(domain (is )?for sale|buy this domain|this domain may be for sale|parked free|website coming soon|under construction|account (has been )?suspended)/i;

/** Flags and the weak verdict for one check result. `now` is injectable for tests. */
export function flagsFor(r, now = new Date()) {
  const flags = [];
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
