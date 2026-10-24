import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getLead } from "@/lib/leads";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { Expired } from "./Expired";

// Rendered on every request so new leads need no deploy and expiry applies the
// day it passes. The lookup and notFound() run before anything streams, so an
// unknown slug gets a real 404 status.
const lookup = cache(async (slug: string) => {
  await connection();
  return getLead(slug);
});

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const lead = await lookup((await params).slug);
  if (lead?.kind !== "live") return { title: "Concept preview by KRIV" };
  return { title: lead.site.seo.title, description: lead.site.seo.description };
}

export default async function LeadPage({ params }: PageProps<"/[slug]">) {
  const lead = await lookup((await params).slug);
  if (!lead) notFound();
  if (lead.kind === "expired") return <Expired />;
  return <SiteRenderer site={lead.site} template={lead.template} />;
}
