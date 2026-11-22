import type { Metadata } from "next";
import { PricingPage } from "@/sections/PricingPage";

export const metadata: Metadata = {
  title: "Philippine pricing | KRIV Agency",
  description: "KRIV's pricing for eligible Philippine business branches.",
};

export default function PhRates() {
  return <PricingPage region="ph" />;
}
