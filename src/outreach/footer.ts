// Every outreach email ends with this footer. It covers what US CAN-SPAM asks of
// a commercial email: who it is from, that it is a business offer, a valid postal
// address, and a working opt-out. See docs/OUTREACH.md before changing it.

export const SENDER = {
  name: "Kriv",
  business: "KRIV",
  email: "hello@kriv.agency",
  website: "kriv.agency",
  postalAddress: "Block 3 Lot 7, Rajah Townhomes, Mactan, Lapu-Lapu City, Cebu 6015, Philippines",
} as const;

export const OPT_OUT_SUBJECT = "Unsubscribe";

export function optOutMailto(): string {
  return `mailto:${SENDER.email}?subject=${encodeURIComponent(OPT_OUT_SUBJECT)}`;
}

/** Plain-text footer appended to every draft. */
export function emailFooter(): string {
  return [
    "--",
    `${SENDER.name}, ${SENDER.business} (${SENDER.website})`,
    SENDER.postalAddress,
    "",
    `This is a one-time business offer from ${SENDER.business}, a web studio in the Philippines.`,
    `Not interested? Reply "unsubscribe" and I won't email you again.`,
  ].join("\n");
}

// Replies containing any of these are opt-outs. Matched case-insensitively.
export const OPT_OUT_PHRASES = [
  "unsubscribe",
  "opt out",
  "opt-out",
  "remove me",
  "take me off",
  "stop emailing",
  "do not contact",
  "don't contact",
  "not interested",
  "no thanks",
  "no thank you",
] as const;

export function isOptOut(text: string): boolean {
  const t = text.toLowerCase().replace(/[’']/g, "'");
  return OPT_OUT_PHRASES.some((p) => t.includes(p));
}
