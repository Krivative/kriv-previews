// Everything Kriv.Agency sells, as Sales offers (Kriv, 2026-11-01). Websites lead; every other
// service gets its own reason to start a conversation. Ids are stored on Sales records: never
// rename one ("website", "build" and "discovery" predate this list).
//
// needs     evidence type(s) the offer requires before a draft (null: any reviewed observation)
// pitch     one line for the drafting prompt: what the service is, no prices or promises
// question  the starter draft's single question
export const SERVICES = [
  { id: "website", label: "Website", needs: ["website_issue"],
    pitch: "a new or rebuilt website; KRIV can show a concept preview first",
    question: "Would a conversation about a website concept be useful?" },
  { id: "seo", label: "SEO (local search)", needs: ["search_gap"],
    pitch: "search engine optimisation so more local customers find the business on Google",
    question: "Would it be useful to talk about helping more local customers find you on Google?" },
  { id: "ads", label: "Ads (Google & social)", needs: null,
    pitch: "running and managing local Google and social media ads that bring in enquiries",
    question: "Are you running any ads at the moment, or would a conversation about local ads be useful?" },
  { id: "smm", label: "Social media marketing", needs: ["social_gap"],
    pitch: "producing social content each week: long-form videos, commercials, 3 to 5 short videos and 3 to 10 image or carousel posts, with the scope agreed with the client",
    question: "Would it help to have someone produce your social media content each week, such as short videos and image posts?" },
  { id: "social", label: "Social media management", needs: ["social_gap"],
    pitch: "managing social media accounts day to day: answering comments and messages and keeping up engagement",
    question: "Would it help to have someone handle your social media comments, replies and messages?" },
  { id: "build", label: "Booking & CRM setup", needs: ["booking_gap", "followup_gap"],
    pitch: "setting up online booking, enquiry handling and follow-up (a CRM), with a short KRIV Build demonstration",
    question: "Would a short demonstration of how bookings, enquiries and follow-ups could be organised be useful?" },
  { id: "maintenance", label: "Website maintenance", needs: null,
    pitch: "keeping an existing website updated, secure and running",
    question: "Who looks after your website at the moment, and would help keeping it updated be useful?" },
  { id: "assistant", label: "Executive assistant", needs: null,
    pitch: "a skilled executive assistant who takes admin, scheduling and inbox work off the owner's plate",
    question: "Would an experienced assistant to take admin and scheduling off your plate be useful?" },
  { id: "outsourcing", label: "Outsourcing", needs: null,
    pitch: "a reliable outside team for tasks the business would rather hand off",
    question: "Are there tasks you would like to hand off to a reliable outside team?" },
  { id: "discovery", label: "Discovery conversation", needs: null,
    pitch: "an open conversation about the business's priorities, before suggesting anything",
    question: "Would you be open to a brief conversation about what you want to improve?" },
];
export const SERVICE = Object.fromEntries(SERVICES.map((s) => [s.id, s]));
export const OFFERS = Object.fromEntries(SERVICES.map((s) => [s.id, s.label]));

/** One plain sentence naming a few other services, for the end of a starter draft. */
export function alsoLine(offer) {
  const others = ["website", "seo", "ads", "smm"].filter((id) => id !== offer).map((id) => ({ website: "websites", seo: "SEO", ads: "ads", smm: "social media content" })[id]);
  return `Kriv.Agency also helps local businesses with ${others.slice(0, -1).join(", ")} and ${others.at(-1)}.`;
}

// Businesses where customers usually book a time: a missing booking link is worth asking about.
const APPOINTMENTS = new Set(["dental", "chiro", "medspa", "salon", "fitness", "pets", "clinic"]);
const GENERIC_TITLE = /^(home( page)?|welcome|untitled|index|my (site|website)|new page|default)?$/i;

/**
 * Factual observations from a site check for the services beyond websites: no linked social
 * profiles, no search description or a placeholder page title, no online booking link. Only
 * checks run after 2026-11-01 record social links and the description; older checks give
 * nothing here rather than a guess. Each becomes an UNCONFIRMED observation for Kriv's review.
 */
export function serviceFindings(check, niche) {
  if (!check || check.error || !(check.status >= 200 && check.status < 400)) return [];
  const out = [];
  if (Array.isArray(check.socialLinks) && !check.socialLinks.length)
    out.push({ key: "social:none", type: "social_gap", claim: "The website's home and contact pages do not link to any social media profile (Facebook, Instagram, TikTok, YouTube, LinkedIn or X)." });
  if (check.metaDescription === false)
    out.push({ key: "search:no-description", type: "search_gap", claim: "The home page has no meta description, the short summary search engines often show under the link." });
  if (typeof check.title === "string" && GENERIC_TITLE.test(check.title.trim()))
    out.push({ key: "search:title", type: "search_gap", claim: check.title.trim() ? `The home page title is just "${check.title.trim().slice(0, 40)}", which does not say what the business does or where.` : "The home page has no page title, the line search engines show as the link." });
  if (APPOINTMENTS.has(niche) && Array.isArray(check.bookingLinks) && !check.bookingLinks.length && Array.isArray(check.socialLinks))
    out.push({ key: "booking:none", type: "booking_gap", claim: "No link to a known online booking service (such as Calendly, Vagaro or Zocdoc) was found on the home or contact page." });
  return out;
}
