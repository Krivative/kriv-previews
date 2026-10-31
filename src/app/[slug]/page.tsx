import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getLead } from "@/lib/leads";
import { reviewAllowed } from "@/lib/review-access";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { Expired } from "./Expired";

// Rendered on every request so new leads need no deploy and expiry applies the
// day it passes. The lookup and notFound() run before anything streams, so an
// unknown slug gets a real 404 status. A valid private review link (?review= or
// its cookie) also shows a draft record; see src/lib/review-token.ts.
const lookup = cache(async (slug: string, review?: string | string[]) => {
  await connection();
  return getLead(slug, { allowDrafts: process.env.NODE_ENV === "development" || (await reviewAllowed(slug, review)) });
});

export async function generateMetadata({ params, searchParams }: PageProps<"/[slug]">): Promise<Metadata> {
  const lead = await lookup((await params).slug, (await searchParams).review);
  if (lead?.kind !== "live") return { title: "Concept preview by KRIV" };
  return { title: lead.site.seo.title, description: lead.site.seo.description };
}

export default async function LeadPage({ params, searchParams }: PageProps<"/[slug]">) {
  const lead = await lookup((await params).slug, (await searchParams).review);
  if (!lead) notFound();
  if (lead.kind === "expired") return <Expired />;
  return <SiteRenderer site={lead.site} template={lead.template} />;
}
