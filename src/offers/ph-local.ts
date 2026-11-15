// KRIV's Philippines-market offer (draft, 2026-11-16). Separate from the
// international pricing. Every figure here is a draft pending Kriv's approval;
// the offer page says so beside each price. Nothing here promises results,
// rankings, leads, uptime or round-the-clock coverage.
//
// Eligibility: PH prices apply only to businesses with a physical store in the
// Philippines. The schema refuses this plan for any other country.

export const PH_ELIGIBILITY = "Philippine rates apply only to businesses with a physical store in the Philippines.";
export const DRAFT_MARK = "Draft, pending Kriv's approval";

/** "PHP 13,000". Whole pesos only. */
export function php(amount: number): string {
  return `PHP ${Math.round(amount).toLocaleString("en-PH")}`;
}

export const TRIAL_DAYS = 14;

export const monthlyServices = [
  { name: "Website", monthly: 3000, note: "Design, build and upkeep of the clinic website." },
  { name: "Content creation", monthly: 3000, note: "Social media content prepared for the clinic to approve." },
  { name: "AI live seller", monthly: 10000, note: "[SCOPE FOR A DENTAL CLINIC: to be confirmed by Kriv]" },
] as const;

/** All three monthly services together. No bundle discount is assumed. */
export const allThreeMonthly = monthlyServices.reduce((sum, s) => sum + s.monthly, 0);

// ASSUMPTION (to confirm with Kriv): PHP 13,000 is the price of the 12-month
// base term and the free months are added on top of those 12.
export const annualCrm = { price: 13000, baseMonths: 12 } as const;

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
  { name: "Human VA trial", body: "A KRIV virtual assistant, a real person, works on agreed tasks for the clinic." },
  { name: "AI VA trial", body: "An AI assistant set up and supervised by KRIV staff handles agreed routine tasks." },
] as const;
export const VA_PLACEHOLDERS = ["[HOUR CAP: to be set by Kriv]", "[TASK LIST: to be set by Kriv]"] as const;

export const aiTrialIdeas = [
  { name: "Inquiry and appointment assistant", body: "Answers common questions from the clinic's approved information and passes booking requests to the clinic's staff." },
  { name: "Appointment reminders", body: "Sends reminder messages for booked visits, using wording the clinic approves." },
  { name: "Review request follow-ups", body: "Invites patients to leave a review after a visit, using wording the clinic approves." },
] as const;

export const exclusions = [
  "Advertising spend and boosted-post budgets.",
  "Third-party fees such as domain names, paid software and messaging credits.",
  "Photo and video shoots, printing and signage.",
  "Clinical, medical or legal advice. The clinic approves all dental information before it is published.",
  "Anything not listed on this quotation.",
] as const;

export const terms = [
  { name: "Revisions", body: "[NUMBER] rounds of revisions per deliverable are included. Further rounds are quoted first." },
  { name: "Change orders", body: "Work outside this quotation is written up as a change order with its price and timing, and starts only after the clinic approves it in writing." },
  { name: "Ownership", body: "The clinic owns its accounts and data: its domain, social pages, messaging accounts, patient information and the content made for it. KRIV works through access the clinic grants." },
] as const;
