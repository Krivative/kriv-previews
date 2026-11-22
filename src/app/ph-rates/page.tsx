import type { Metadata } from "next";
import { PhRatesSeeded } from "@/sections/PhRatesSeeded";
import { phDesignFor, phSeedFrom } from "@/sections/ph-rates-seed";

export const metadata: Metadata = {
  title: "Philippine pricing | KRIV Agency",
  description: "KRIV's pricing for eligible Philippine business branches.",
};

// Previews and local builds honour ?seed=; production shows the pinned (or first candidate) seed.
export default async function PhRates({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const seed = phSeedFrom((await searchParams).seed, process.env.VERCEL_ENV !== "production");
  return <PhRatesSeeded design={phDesignFor(seed)} />;
}
