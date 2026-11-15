import { MAX_BUNDLE_SAVING, TRIAL_DAYS, annualPay, annualPlans, annualSaving, annualWorth, bundleTiers, crm, decisionWindows, monthlyServices, addOns, percent, php, totalMonths } from "@/offers/ph-local";
import type { JourneyStep } from "./dental-journey";

// "How a KRIV plan works": the scroll story at the top of the Philippine rates
// page. Practical, not a pitch: what you try, what you pay, what you decide.
// Every figure is worked out from src/offers/ph-local.ts, so the story cannot
// drift from the rates below it.
const website = annualPlans[0];
const [best, second, third, last] = decisionWindows;
const agent = addOns[1];
const price = (name: string) => php(monthlyServices.find((s) => s.name === name)?.monthly ?? 0);
const firstTier = bundleTiers[0];
const topTier = bundleTiers[bundleTiers.length - 1];

export const ratesJourney: JourneyStep[] = [
  { id: "start", chapter: "The start", title: "How a KRIV plan works.", narration: "Scroll down for a short walk through what you try, what you pay and what you decide. No pitch, only how it works." },
  { id: "trial", chapter: "The trial", title: `Days 1 to ${TRIAL_DAYS}: you try it first.`, narration: `The first ${TRIAL_DAYS} days are free. There is nothing to pay and no setup fee, and KRIV staff run the service for you. On day ${TRIAL_DAYS} you keep going or you stop.` },
  { id: "services", chapter: "The services", title: "What you can take.", narration: `Five monthly services: a website and content creation at ${price("Website")} each, an AI live seller at ${price("AI live seller")}, a CRM and system with automations at ${php(crm.promoMonthly)}, and an AI agent at ${php(agent.price)}. Take one, or several.` },
  { id: "paying", chapter: "Paying", title: "Two ways to pay.", narration: `Monthly: pay each month and stop at any month. Annual: pay for ${crm.baseMonths} months at once and KRIV adds free months on top. The service is the same either way.` },
  { id: "annual", chapter: "Annual", title: "What annual changes.", narration: `Take the website. Month by month, ${totalMonths(best)} months cost ${php(annualWorth(website, best))}. On the annual plan you pay ${php(annualPay(website))} for the same ${totalMonths(best)} months. That is ${php(annualSaving(website, best))} less.` },
  { id: "dates", chapter: "The dates", title: "The dates that matter.", narration: `Decide on days ${best.fromDay} to ${best.toDay} for ${best.freeMonths} free months, days ${second.fromDay} to ${second.toDay} for ${second.freeMonths}, or days ${third.fromDay} to ${third.toDay} for ${third.freeMonths}. From day ${last.fromDay} the plan is monthly.` },
  { id: "bundles", chapter: "Bundles", title: "Taking more than one.", narration: `Several services on the annual plan lower the yearly price: ${percent(firstTier.rate)} for ${firstTier.services}, up to ${percent(topTier.rate)} for ${topTier.services}. The whole saving stops at ${percent(MAX_BUNDLE_SAVING)}.` },
  { id: "monthly", chapter: "Choosing", title: "When monthly is the better choice.", narration: "Choose monthly if you are not sure you will keep the service for a year, if paying a year at once would strain this month, or while you are still testing which service helps most." },
  { id: "yours", chapter: "Terms", title: "What stays yours.", narration: "Your domain, pages, accounts, customer information and content stay yours. Extra work is priced first and starts only after you approve it. KRIV does not promise results or search rankings." },
  { id: "decide", chapter: "The decisions", title: "Three decisions.", narration: `By day ${TRIAL_DAYS}: keep the service, or stop. By day ${best.toDay}: monthly or annual, if you want the most free months. Any time: whether to add a service. Build your own plan below.` },
];
