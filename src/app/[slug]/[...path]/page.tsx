import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getLead } from "@/lib/leads";
import { reviewAllowed } from "@/lib/review-access";
import { sitePages } from "@/lib/site-pages";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { Expired } from "../Expired";

// A valid private review link (?review= or its cookie) also shows a draft record.
const lookup = cache(async (slug: string, review?: string | string[]) => {
  await connection();
  return getLead(slug, { allowDrafts: process.env.NODE_ENV === "development" || (await reviewAllowed(slug, review)) });
});

export async function generateMetadata({ params, searchParams }: PageProps<"/[slug]/[...path]">): Promise<Metadata> {
  const { slug, path } = await params;
  const lead = await lookup(slug, (await searchParams).review);
  if (lead?.kind !== "live") return { title: "Concept preview by KRIV" };
  const page = sitePages(lead.site).find((p) => p.path === path.join("/"));
  return page ? { title: `${page.title} | ${lead.site.business.name}`, description: lead.site.seo.description } : { title: "Concept preview by KRIV" };
}

export default async function LeadSubpage({ params, searchParams }: PageProps<"/[slug]/[...path]">) {
  const { slug, path } = await params;
  const lead = await lookup(slug, (await searchParams).review);
  if (!lead) notFound();
  if (lead.kind === "expired") return <Expired />;
  const page = sitePages(lead.site).find((p) => p.path === path.join("/"));
  if (!page) notFound();
  return <SiteRenderer site={lead.site} template={lead.template} page={page} />;
}
