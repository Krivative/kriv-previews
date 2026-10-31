// US-ready display formats for the pilot market. Other countries keep the
// business's own comma-separated order (shared Site Arsenal behaviour).
type Address = { line1?: string; city: string; region?: string; postalCode?: string; country: string };
type Phone = { phoneDisplay?: string; phoneE164?: string };

/** "Austin, TX 78701" in the US; "City, Region, Postcode" elsewhere. */
export function cityLine(a: Address): string {
  if (a.country === "US") return [a.city, [a.region, a.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [a.city, a.region, a.postalCode].filter(Boolean).join(", ");
}

/** One-line address: "123 Main St, Austin, TX 78701". */
export function addressText(a: Address): string {
  return [a.line1, cityLine(a)].filter(Boolean).join(", ");
}

/** The business's own phone wording, else a US number as (512) 555-0100. */
export function phoneText(b: Phone): string {
  if (b.phoneDisplay) return b.phoneDisplay;
  const us = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(b.phoneE164 ?? "");
  return us ? `(${us[1]}) ${us[2]}-${us[3]}` : (b.phoneE164 ?? "");
}
