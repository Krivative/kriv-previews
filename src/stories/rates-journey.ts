import { MAX_BUNDLE_SAVING, TRIAL_DAYS, annualPay, annualPlans, annualSaving, annualWorth, bundleTiers, crm, decisionWindows, monthlyServices, addOns, liveSeller, percent, php, totalMonths } from "@/offers/ph-local";
import type { JourneyStep } from "./dental-journey";

// "How a KRIV plan works": the scroll story at the top of the Philippine rates
// page. Practical, not a pitch: what you try, what you pay, what you decide.
// Every figure is worked out from src/offers/ph-local.ts, so the story cannot
// drift from the rates below it.
const website = annualPlans[0];
const [best, second, third, last] = decisionWindows;
const agent = addOns[1];
const price = (name: string) => php((monthlyServices.find((s) => s.name === name)?.monthly ?? 0) * crm.baseMonths);
const firstTier = bundleTiers[0];
const topTier = bundleTiers[bundleTiers.length - 1];

// Recorded voice-over ("Sela", fourth set: "The Merchant's Road", 2026-11-16, each stop told as a place on a
// fantasy road behind it, public/scenes/merchants-road; earlier: second set, supplied by Kriv on 2026-11-16; what she says is in
// docs/voices/rates-story-script.txt, the voice settings in docs/voices/rates-story-voice-profile.txt).
// The voice EXPLAINS the screen in its own words; it no longer reads the title and narration.
// Every price, day and percentage she speaks must match src/offers/ph-local.ts: a change there needs
// a new recording. When a recording cannot play, the device voice reads the on-screen text instead.
const voice = (name: string) => `/for/audio/rates-journey/${name}.mp3?v=4`;
// Chapters re-recorded for the annual-only offer (Kriv, 2026-11-16: no month to month plan after the trial).
const voice3 = voice; // the annual-only chapters, now part of the "Merchant's Road" set (v=4)

export const ratesJourney: JourneyStep[] = [
  { id: "start", audio: voice("01-start"), chapter: "The start", title: "How a KRIV plan works.", narration: "Built by Kriv, the brains behind the system. A short walk through what you try, what you pay and what you decide. No pitch." },
  { id: "trial", audio: voice3("02-trial"), chapter: "The trial", title: `Days 1 to ${TRIAL_DAYS}: you try it first.`, narration: `The first ${TRIAL_DAYS} days are free. There is nothing to pay and no setup fee, and KRIV staff run the service for you. On day ${TRIAL_DAYS} you go annual or you stop.` },
  { id: "services", audio: voice("03-services").replace("v=4", "v=6"), chapter: "The services", title: "What you can take.", narration: `Six services. Five have one yearly price: a website and content creation at ${price("Website")} a year each, an AI live seller at ${price("AI live seller")}, a CRM and system with automations at ${php(crm.promoMonthly * crm.baseMonths)}, an AI chat agent at ${php(agent.price * crm.baseMonths)}, and an AI voice agent, priced after a short call. The live seller can start with a paid ${liveSeller.starterMonths}-month starter at ${php(liveSeller.starterPrice)}. Take one, or several.` },
  { id: "paying", audio: voice3("04-paying"), chapter: "Paying", title: "One way to pay.", narration: `After the trial there is one plan: annual. Pay for ${crm.baseMonths} months at once. Decide early in the trial and KRIV adds free months on top. There is no month to month plan.` },
  { id: "annual", audio: voice3("05-annual"), chapter: "Deciding early", title: "What deciding early is worth.", narration: `Take the website. At the regular rate, ${totalMonths(best)} months are worth ${php(annualWorth(website, best))}. On the annual plan you pay ${php(annualPay(website))} for the same ${totalMonths(best)} months. That is ${php(annualSaving(website, best))} less.` },
  { id: "dates", audio: voice("06-dates"), chapter: "The dates", title: "The dates that matter.", narration: `Decide on days ${best.fromDay} to ${best.toDay} of the trial for ${best.freeMonths} free months, days ${second.fromDay} to ${second.toDay} for ${second.freeMonths}, or days ${third.fromDay} to ${third.toDay} for ${third.freeMonths}. From day ${last.fromDay} the annual plan is still open, with no free months.` },
  { id: "bundles", audio: voice("07-bundles"), chapter: "Bundles", title: "Taking more than one.", narration: `Several services on the annual plan lower the yearly price: ${percent(firstTier.rate)} for ${firstTier.services}, up to ${percent(topTier.rate)} for ${topTier.services}. The whole saving stops at ${percent(MAX_BUNDLE_SAVING)}.` },
  { id: "monthly", audio: voice3("08-choosing"), chapter: "Choosing", title: "One service, or a stack.", narration: "Both are fine. One service keeps the year simple. A stack lowers the yearly price with the bundle discount. Not sure yet? Use the trial to test, and stop on day fourteen if it is not for you." },
  { id: "yours", audio: voice("09-yours"), chapter: "Terms", title: "What stays yours.", narration: "Your domain, pages, accounts, customer information and content stay yours. Extra work is priced first and starts only after you approve it. KRIV does not promise results or search rankings." },
  { id: "decide", audio: voice3("10-decide"), chapter: "The decisions", title: "Three decisions.", narration: `By day ${best.toDay}: go annual for the most free months. By day ${TRIAL_DAYS}: annual, or stop. Any time: whether to stack another service. Build your own plan below.` },
];
