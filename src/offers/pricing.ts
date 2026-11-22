// KRIV's Philippines-market offer. Separate from the international pricing.
// Prices set by Kriv on 2026-11-16 (see HANDOFF.md): Website and Content
// creation stay at 3,000; the CRM is 15,000 a month with a 13,000 promo that
// stacks with the extra free months on the annual plan; Branding kit 7,500
// one-time; AI agent 2,500 a month; AI live seller 10,000 a month.
// Nothing here promises results, rankings, leads, uptime or round-the-clock coverage.
//
// Two pages read this file: a lead's own quotation (/<slug>/offer) and the
// general Philippine rates page (/ph-rates). The figures are the same on both;
// only the wording changes, through the {tokens} filled in by `fill`.
//
// Eligibility: PH prices apply only to businesses with a physical store in the
// Philippines. The schema refuses this plan for any other country.

export const PH_ELIGIBILITY = "Philippine rates apply only to businesses with a physical store in the Philippines.";
export const KRIV_EMAIL = "hello@kriv.agency";
export const KRIV_BOOKING = "https://kriv.agency/book";

/** "PHP 13,000". Whole pesos only. */
export function php(amount: number): string {
  return `PHP ${Math.round(amount).toLocaleString("en-PH")}`;
}

/** Who a page is written for. Each key is a {token} in the texts below. */
export type Audience = {
  client: string; Client: string; your: string; customers: string; customer: string;
  advice: string; info: string; doc: string; aiEyebrow: string;
};
export const audiences = {
  clinic: {
    client: "the clinic", Client: "The clinic", your: "the clinic's", customers: "patients", customer: "patient",
    advice: "Clinical", info: "dental information", doc: "quotation", aiEyebrow: "For a dental clinic",
  },
  general: {
    client: "your business", Client: "Your business", your: "your", customers: "customers", customer: "customer",
    advice: "Professional", info: "information about it", doc: "page", aiEyebrow: "For local businesses",
  },
} satisfies Record<string, Audience>;

/** Replaces each {token} with the audience's wording. Unknown tokens are left as written. */
export function fill(text: string, audience: Audience): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => (audience as Record<string, string>)[key] ?? whole);
}

export const TRIAL_DAYS = 14;

/** What comes with every plan, whichever service is chosen. */
export const everyPlan = [
  { name: `${TRIAL_DAYS}-day free trial`, body: "Try any service before paying anything." },
  { name: "No setup fee", body: "Nothing to pay at sign-up. After the trial, plans are paid yearly." },
  { name: "Managed by KRIV staff", body: "A KRIV team member runs each service and stays your point of contact." },
  { name: "Your accounts, your data", body: "{Client} owns its domain, pages, accounts and content." },
] as const;

export const monthlyServices = [
  {
    name: "Website", monthly: 3000, note: "A professional website for {client}, built and looked after by KRIV.",
    includes: [
      "Custom design, built for phones first",
      "Home, about, services and contact pages",
      "Contact details and an inquiry form",
      "Search engine setup and help connecting {your} Google Business Profile",
      "Updates and upkeep for as long as you subscribe",
    ],
  },
  {
    name: "Content creation", monthly: 3000, note: "Social media content made for {client}, ready for approval before it goes out.",
    includes: [
      "12 image posts a month, three a week",
      "Branded graphics in {your} own look",
      "Captions written for each post",
      "Content planning and scheduling",
    ],
  },
  {
    name: "AI live seller", monthly: 10000, note: "AI-assisted live selling on {your} social channels, set up and supervised by KRIV staff.",
    includes: [
      "Setup around {your} products or services",
      "Scripts and answers {client} approves first",
      "A KRIV team member watching over each session",
    ],
  },
] as const;

/** All three monthly services together. No bundle discount is assumed. */
export const allThreeMonthly = monthlyServices.reduce((sum, s) => sum + s.monthly, 0);

/** Content creation grows into full social media management. Only the first tier has a set price. */
export const contentTiers = [
  { name: "Starter", monthly: 3000 as number | null, includes: ["12 image posts a month", "Captions, planning and scheduling"] },
  { name: "Daily", monthly: null as number | null, includes: ["A post every day", "Stories alongside the posts", "Captions, planning and scheduling"] },
  {
    name: "Full social media management", monthly: null as number | null,
    includes: ["Daily posts and stories", "Replies to comments and messages, so {your} audience is heard", "Research into {your} niche and audience", "A monthly summary of what went out and how people responded"],
  },
] as const;

// CRM and system with automations. The promo rate replaces the regular rate,
// and the annual plan is twelve months at the promo rate with extra months on top.
export const crm = { regularMonthly: 15000, promoMonthly: 13000, baseMonths: 12 } as const;
export const annualPrice = crm.promoMonthly * crm.baseMonths;
export const crmIncludes = [
  "All {customer} details and conversations in one place",
  "New inquiries captured and tracked as they arrive",
  "A pipeline that shows where each inquiry stands",
  "Automatic email and SMS follow-ups",
  "Appointment booking with automatic reminders",
  "Activity and performance reports",
  "Set up and managed by KRIV staff, with no setup fee",
] as const;

export type DecisionWindow = { fromDay: number; toDay?: number; freeMonths: number };

// Day 1 is the first day of the free trial; the trial ends on day 14.
// Kriv, 2026-11-16: the free months are for deciding DURING the trial (the earlier, the more).
// From day 15 the annual plan is still open, at 12 months for the price of 12, with no free months.
export const decisionWindows: DecisionWindow[] = [
  { fromDay: 1, toDay: 5, freeMonths: 3 },
  { fromDay: 6, toDay: 10, freeMonths: 2 },
  { fromDay: 11, toDay: 14, freeMonths: 1 },
  { fromDay: 15, freeMonths: 0 },
];

/** Months covered by the annual price when the decision lands in this window. */
export function totalMonths(w: DecisionWindow): number {
  return crm.baseMonths + w.freeMonths;
}

/** The annual price spread over the covered months, rounded to a whole peso. */
export function effectiveMonthly(w: DecisionWindow): number {
  return Math.round(annualPrice / totalMonths(w));
}

/** What the same number of months would cost at the regular monthly rate. */
export function regularCost(w: DecisionWindow): number {
  return crm.regularMonthly * totalMonths(w);
}

// Annual plans (Kriv, 2026-11-16): every monthly service can be paid yearly.
// The client pays twelve months at today's rate and gets the same extra months
// as the CRM. Each page shows what those months would cost month by month at the
// regular rate, the annual price, and the difference as the saving. Only the
// CRM has a regular rate above today's rate, so its saving combines both.
export type AnnualPlan = { name: string; monthly: number; regular: number };

/** Bundle discount on the annual price, by how many monthly services are taken together. */
export const bundleTiers = [
  { services: 2, rate: 0.1 },
  { services: 3, rate: 0.15 },
  { services: 4, rate: 0.2 },
  { services: 5, rate: 0.25 },
];
/** The most any annual bundle saves against paying the regular rate month by month. */
export const MAX_BUNDLE_SAVING = 0.4;
export const percent = (rate: number) => `${Math.round(rate * 100)}%`;
export function bundleRate(count: number): number {
  return bundleTiers.reduce((rate, tier) => (count >= tier.services ? tier.rate : rate), 0);
}
/** An annual quote for several services: the bundle discount comes off the yearly price, on top of the free months, and the whole saving stops at MAX_BUNDLE_SAVING. */
export function bundleQuote(plans: AnnualPlan[], w: DecisionWindow) {
  const months = totalMonths(w);
  const worth = plans.reduce((sum, p) => sum + p.regular, 0) * months;
  const base = plans.reduce((sum, p) => sum + p.monthly, 0) * crm.baseMonths;
  const rate = bundleRate(plans.length);
  const pay = Math.max(Math.round(base * (1 - rate)), Math.round(worth * (1 - MAX_BUNDLE_SAVING)));
  return { months, worth, base, rate, pay, capped: pay > Math.round(base * (1 - rate)), bundleSaving: base - pay, saving: worth - pay, savingRate: worth ? (worth - pay) / worth : 0 };
}
export const annualPlans: AnnualPlan[] = [
  ...monthlyServices.map((s) => ({ name: s.name, monthly: s.monthly, regular: s.monthly })),
  { name: "All three together", monthly: allThreeMonthly, regular: allThreeMonthly },
  { name: "CRM and system with automations", monthly: crm.promoMonthly, regular: crm.regularMonthly },
];

/** Twelve months at today's rate: what the client pays for the year. */
export function annualPay(p: AnnualPlan): number {
  return p.monthly * crm.baseMonths;
}

/** The months covered in this window, priced month by month at the regular rate. */
export function annualWorth(p: AnnualPlan, w: DecisionWindow): number {
  return p.regular * totalMonths(w);
}

/** Month-by-month cost minus the annual price. */
export function annualSaving(p: AnnualPlan, w: DecisionWindow): number {
  return annualWorth(p, w) - annualPay(p);
}

export const addOns = [
  {
    name: "Branding kit", price: 7500, unit: "one-time",
    includes: ["A new custom logo, with variations and transparent versions", "Colour palette and typography", "Brand guidelines and brand voice", "Social media profile assets and reusable templates"],
  },
  {
    name: "AI agent", price: 2500, unit: "per month",
    includes: ["An AI agent that handles repeatable steps for {client}", "Built from information and wording {client} approves", "Set up and supervised by KRIV staff"],
  },
] as const;

annualPlans.push({ name: "AI agent", monthly: addOns[1].price, regular: addOns[1].price });

export const vaTrials = [
  { name: "Human VA trial", body: "A KRIV virtual assistant, a real person, works on agreed tasks for {client}." },
  { name: "AI VA trial", body: "An AI assistant set up and supervised by KRIV staff handles agreed routine tasks." },
] as const;
export const VA_NOTE = "Hours and tasks are agreed with you before the trial starts.";

export const aiTrialIdeas = [
  { name: "Inquiry and appointment assistant", body: "Answers common questions from {your} approved information and passes booking requests to {your} staff." },
  { name: "Appointment reminders", body: "Sends reminder messages for booked visits, using wording {client} approves." },
  { name: "Review request follow-ups", body: "Invites {customers} to leave a review after a visit, using wording {client} approves." },
] as const;

export const REFERRAL = "Know another Philippine business that could use this? Introduce them to KRIV and ask about the referral reward.";

export const exclusions = [
  "Advertising spend and boosted-post budgets.",
  "Third-party fees such as domain names, paid software and messaging credits.",
  "Photo and video shoots, printing and signage.",
  "{advice}, medical or legal advice. {Client} approves all {info} before it is published.",
  "Anything not listed on this {doc}.",
] as const;

export const terms = [
  { name: "Bundle discount", body: `Stacking several services on the annual plan lowers the yearly price: ${bundleTiers.map((tier) => `${tier.services} services ${percent(tier.rate)}`).join(", ")}. It comes on top of the free months, and the whole saving stops at ${percent(MAX_BUNDLE_SAVING)} of the regular value (the same months at the regular rate). One-time items do not count.` },
  { name: "Revisions", body: "Revision rounds are agreed in writing before work starts. Further rounds are quoted first." },
  { name: "Change orders", body: "Work outside this {doc} is written up as a change order with its price and timing, and starts only after {client} approves it in writing." },
  { name: "Ownership", body: "{Client} owns its accounts and data: its domain, social pages, messaging accounts, {customer} information and the content made for it. KRIV works through access {client} grants." },
] as const;

// The hero's sneak peek (Kriv, 2026-11-16): a suggested first stack per kind of business, priced with the
// same rules as the plan builder (best window, bundle discount). A starting point, not a promise of results.
const plan = (name: string) => annualPlans.find((p) => p.name === name)!;
export const starterStacks = [
  { business: "Health practice", why: "Bookings come in through the site; follow-ups and reminders send themselves.", plans: ["Website", "CRM and system with automations"] },
  { business: "Restaurant or café", why: "Fresh posts bring people in; an AI agent answers the usual questions.", plans: ["Content creation", "AI agent"] },
  { business: "Retail shop", why: "A shop online, and live selling that keeps the store open after hours.", plans: ["Website", "AI live seller"] },
  { business: "Salon or spa", why: "Posts that show the work; bookings and follow-ups in one organised place.", plans: ["Content creation", "CRM and system with automations"] },
].map((s) => ({ ...s, quote: bundleQuote(s.plans.map(plan), decisionWindows[0]) }));

// 22 November catalog. The exports above freeze the terms of already-issued
// quotes. New quote records opt in by catalog version, never by current date.
export const PRICING_VERSION = "2026-11-22";
export type PriceItem = {
  label: string;
  monthly: number;
  setup?: number;
  worth?: number;
  detail: string;
  upgrades?: readonly string[];
  requires?: string;
};
export type PricePackage = {
  id: string;
  label: string;
  monthly: number;
  worth: number;
  setup?: number;
  setupWorth?: number;
  includes: readonly string[];
  recommended?: boolean;
};
export type Market = {
  currency: "PHP" | "USD";
  items: Record<string, PriceItem>;
  packages: readonly PricePackage[];
};

const crmModules = {
  followup: { label: "Lost-lead follow-up", monthly: 4000, detail: "Follow-up workflows for missed inquiries." },
  booking: { label: "Booking and reminders", monthly: 3500, detail: "Appointment scheduling and reminders." },
  emailMarketing: { label: "Email marketing", monthly: 3500, detail: "Campaign planning and sending workflows." },
  pipeline: { label: "Lead pipeline", monthly: 3000, detail: "Track inquiries through each stage." },
  reviews: { label: "Review booster", monthly: 3000, detail: "Request honest customer feedback." },
} satisfies Record<string, PriceItem>;

const content = {
  starter: { label: "Starter content", monthly: 3000, detail: "15 posts and 1 reel per month, plus 1 story a day." },
  growth: { label: "Growth content", monthly: 6000, upgrades: ["starter"], detail: "8 reels, 10 carousels and 12 graphics per month, plus 2 stories a day." },
  video: { label: "Video content", monthly: 10000, detail: "15 reels and 15 posts per month, plus 3 stories a day. Community management included.", upgrades: ["starter", "growth", "community"] },
} satisfies Record<string, PriceItem>;

export const pricingRules = {
  ph: {
    eligibility: "Philippine rates apply to a business with a Philippine business address or permit, for that branch only.",
    trial: [{ days: "Week 1", label: "Try the Starter level." }, { days: "Week 2", label: "Try the recommended Growth level." }, { days: "Day 15", label: "Choose a plan or stop." }],
    trialDays: TRIAL_DAYS,
    paidMonths: 12,
    annualDiscount: 0.25,
    windows: decisionWindows,
    postingGuidance: "Aim for 3–5 feed posts and 2–3 reels a week, with a few stories a day. Growth is built to match this cadence.",
    customVideoThreshold: 30,
    platforms: ["Viber", "WhatsApp", "Telegram"],
    conditionalPlatform: "TikTok if its API allows",
    extraPlatformMonthly: 1000,
    callerMinutes: 300,
    callerOverage: 12,
    walletMarkup: 0.5,
    agentFees: [1500, 3000, 4000],
    allIn: ["website", "starter", "inbox", "live", "crm"],
  },
  us: { managementMonthly: 1000, agentShare: 0.5, heavyUnits: 2, callPerMinute: 0.20 },
  contact: { email: KRIV_EMAIL, booking: KRIV_BOOKING },
} as const;

const phItems = {
  website: { label: "Website", monthly: 3000, worth: 5500, detail: "Includes a site chat assistant." },
  inbox: { label: "Meta inbox AI agent", monthly: 2500, detail: "Facebook and Instagram inboxes." },
  community: { label: "Community management", monthly: 3000, detail: "Public comments, reactions, spam and complaints, with nudges to move conversations into the inbox." },
  profile: { label: "Google Business Profile care", monthly: 2500, detail: "Maintain the business listing and its information." },
  email: { label: "Email management", monthly: 2500, detail: "Manage the business inbox." },
  ads: { label: "Meta ads management", monthly: 5000, detail: "Client pays the ad budget separately." },
  caller: { label: "AI caller", monthly: 2500, detail: `Includes ${pricingRules.ph.callerMinutes} minutes, then ${php(pricingRules.ph.callerOverage)} per minute.` },
  live: { label: "AI live seller", monthly: 10000, detail: "AI-assisted live selling for your products." },
  crm: { label: "CRM", monthly: 13000, worth: 17000, detail: "All five CRM modules, also available individually.", upgrades: Object.keys(crmModules) },
  ...content,
  ...crmModules,
  ...Object.fromEntries(pricingRules.ph.platforms.map((name) => [
    name.toLowerCase(), { label: `${name} inbox add-on`, monthly: pricingRules.ph.extraPlatformMonthly, detail: "Requires the Meta inbox AI agent.", requires: "inbox" },
  ])),
} satisfies Record<string, PriceItem>;

const management = pricingRules.us.managementMonthly;
const usItems = {
  website: { label: "Website", setup: 5000, monthly: management, detail: "Website setup and ongoing management." },
  inbox: { label: "AI agent", setup: 2500, monthly: management, detail: "AI agent setup and management." },
  live: { label: "AI live seller", setup: 10000, monthly: management, detail: "Live seller setup and management." },
  crm: { label: "CRM", setup: 13000, worth: 15000, monthly: management, detail: "CRM setup and management." },
  caller: { label: "AI caller", setup: 2500, monthly: management, detail: "Caller setup and management. Calls use prepaid credits." },
  ...content,
  video: { ...content.video, detail: "15 reels and 15 posts per month, plus 3 stories a day.", upgrades: ["starter", "growth"] },
} satisfies Record<string, PriceItem>;

export const markets = {
  ph: { currency: "PHP", items: phItems, packages: [
    { id: "presence", label: "Presence", monthly: 8500, worth: 11000, includes: ["website", "starter", "inbox", "profile"] },
    { id: "growth", label: "Growth", monthly: 12500, worth: 17000, recommended: true, includes: ["website", "growth", "inbox", "profile", "community"] },
    { id: "full-business", label: "Full Business", monthly: 29500, worth: 40500, includes: ["website", "video", "inbox", "profile", "caller", "crm"] },
  ] },
  us: { currency: "USD", items: usItems, packages: [
    { id: "presence", label: "Presence", setup: 5000, setupWorth: 7500, monthly: 5000, worth: 6000, includes: ["website", "starter", "inbox"] },
    { id: "growth", label: "Growth", setup: 5000, monthly: 8000, worth: 10000, includes: ["website", "growth", "inbox"], recommended: true },
    { id: "full-business", label: "Full Business", setup: 15000, setupWorth: 25000, monthly: 12500, worth: 15000, includes: ["website", "video", "inbox", "crm", "caller"] },
  ] },
} satisfies Record<string, Market>;
