// KRIV's Philippines-market offer (draft, 2026-11-16). Separate from the
// international pricing. Every figure here is a draft pending Kriv's approval;
// the pages say so beside each price. Nothing here promises results,
// rankings, leads, uptime or round-the-clock coverage.
//
// Two pages read this file: a lead's own quotation (/<slug>/offer) and the
// general Philippine rates page (/ph-rates). The figures are the same on both;
// only the wording changes, through the {tokens} filled in by `fill`.
//
// Eligibility: PH prices apply only to businesses with a physical store in the
// Philippines. The schema refuses this plan for any other country.

export const PH_ELIGIBILITY = "Philippine rates apply only to businesses with a physical store in the Philippines.";
export const DRAFT_MARK = "Draft, pending Kriv's approval";

/** "PHP 13,000". Whole pesos only. */
export function php(amount: number): string {
  return `PHP ${Math.round(amount).toLocaleString("en-PH")}`;
}

/** Who a page is written for. Each key is a {token} in the texts below. */
export type Audience = {
  client: string; Client: string; your: string; customers: string; customer: string;
  KIND: string; advice: string; info: string; doc: string; aiEyebrow: string;
};
export const audiences = {
  clinic: {
    client: "the clinic", Client: "The clinic", your: "the clinic's", customers: "patients", customer: "patient",
    KIND: "A DENTAL CLINIC", advice: "Clinical", info: "dental information", doc: "quotation", aiEyebrow: "For a dental clinic",
  },
  general: {
    client: "your business", Client: "Your business", your: "your", customers: "customers", customer: "customer",
    KIND: "YOUR BUSINESS", advice: "Professional", info: "information about it", doc: "page", aiEyebrow: "For local businesses",
  },
} satisfies Record<string, Audience>;

/** Replaces each {token} with the audience's wording. Unknown tokens are left as written. */
export function fill(text: string, audience: Audience): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => (audience as Record<string, string>)[key] ?? whole);
}

export const TRIAL_DAYS = 14;

export const monthlyServices = [
  { name: "Website", monthly: 3000, note: "Design, build and upkeep of {your} website." },
  { name: "Content creation", monthly: 3000, note: "Social media content prepared for {client} to approve." },
  { name: "AI live seller", monthly: 10000, note: "[SCOPE FOR {KIND}: to be confirmed by Kriv]" },
] as const;

/** All three monthly services together. No bundle discount is assumed. */
export const allThreeMonthly = monthlyServices.reduce((sum, s) => sum + s.monthly, 0);

// ASSUMPTION (to confirm with Kriv): PHP 13,000 is the price of the 12-month
// base term and the free months are added on top of those 12.
// Kriv, 2026-11-16: the 13,000 is mainly the CRM and system with automations,
// plus extra services (which ones is still to be listed).
export const annualCrm = { price: 13000, baseMonths: 12 } as const;
export const annualIncludes = [
  "CRM and system setup for {client}, managed by KRIV staff.",
  "Automations built into that system.",
  "[EXTRA SERVICES: to be listed by Kriv]",
] as const;

export type DecisionWindow = { fromDay: number; toDay?: number; freeMonths: number };

// Day 1 is the first day of the free trial; the trial ends on day 14.
export const decisionWindows: DecisionWindow[] = [
  { fromDay: 15, toDay: 17, freeMonths: 3 },
  { fromDay: 18, toDay: 20, freeMonths: 2 },
  { fromDay: 21, toDay: 23, freeMonths: 1 },
  { fromDay: 24, freeMonths: 0 },
];

/** Months covered by the annual price when the decision lands in this window. */
export function totalMonths(w: DecisionWindow): number {
  return annualCrm.baseMonths + w.freeMonths;
}

/** The annual price spread over the covered months, rounded to a whole peso. */
export function effectiveMonthly(w: DecisionWindow): number {
  return Math.round(annualCrm.price / totalMonths(w));
}

export const vaTrials = [
  { name: "Human VA trial", body: "A KRIV virtual assistant, a real person, works on agreed tasks for {client}." },
  { name: "AI VA trial", body: "An AI assistant set up and supervised by KRIV staff handles agreed routine tasks." },
] as const;
export const VA_PLACEHOLDERS = ["[HOUR CAP: to be set by Kriv]", "[TASK LIST: to be set by Kriv]"] as const;

export const aiTrialIdeas = [
  { name: "Inquiry and appointment assistant", body: "Answers common questions from {your} approved information and passes booking requests to {your} staff." },
  { name: "Appointment reminders", body: "Sends reminder messages for booked visits, using wording {client} approves." },
  { name: "Review request follow-ups", body: "Invites {customers} to leave a review after a visit, using wording {client} approves." },
] as const;

export const exclusions = [
  "Advertising spend and boosted-post budgets.",
  "Third-party fees such as domain names, paid software and messaging credits.",
  "Photo and video shoots, printing and signage.",
  "{advice}, medical or legal advice. {Client} approves all {info} before it is published.",
  "Anything not listed on this {doc}.",
] as const;

export const terms = [
  { name: "Revisions", body: "[NUMBER] rounds of revisions per deliverable are included. Further rounds are quoted first." },
  { name: "Change orders", body: "Work outside this {doc} is written up as a change order with its price and timing, and starts only after {client} approves it in writing." },
  { name: "Ownership", body: "{Client} owns its accounts and data: its domain, social pages, messaging accounts, {customer} information and the content made for it. KRIV works through access {client} grants." },
] as const;
