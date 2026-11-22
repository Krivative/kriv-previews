import type { Metadata } from "next";
import { PricingPage } from "@/sections/PricingPage";

export const metadata: Metadata = {
  title: "Pricing | KRIV Agency",
  description: "Explore KRIV's USD packages, setup fees and monthly service pricing.",
  alternates: { canonical: "https://kriv.agency/pricing" },
};

export default function UsPricing() {
  return <PricingPage region="us" />;
}
