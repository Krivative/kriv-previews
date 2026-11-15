import type { Metadata } from "next";
import { PhRatesPage } from "@/sections/PhRatesPage";

// KRIV's general Philippine rates. A fixed page, so it wins over the /[slug]
// lead route; "ph-rates" is reserved in src/lib/site-schema.ts so no lead can
// take the name. noindex comes from the root layout and next.config.ts.
export const metadata: Metadata = {
  title: "Philippine rates | KRIV Agency",
  description: "KRIV Agency's rates for businesses with a physical store in the Philippines.",
};

export default function PhRates() {
  return <PhRatesPage />;
}
