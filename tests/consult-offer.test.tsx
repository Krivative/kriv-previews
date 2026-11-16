import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteData } from "@/lib/site-schema";
import { offerPage } from "@/lib/site-pages";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { templates } from "@/templates";
import * as consult from "@/offers/consult-first";

// The price-free "consult first" offer: a presentation for any business, brand or style.

const lead = (slug: string) => JSON.parse(readFileSync(path.join(process.cwd(), "leads", `${slug}.json`), "utf8"));
const offer = { plan: "consult-first", quoteNumber: "KRIV-US-2026-TEST", quoteDate: "2026-11-17", validUntil: "2026-12-17" };
const render = (input: unknown) => { const site = SiteData.parse(input); return renderToStaticMarkup(<SiteRenderer site={site} template={templates[site.template]} page={offerPage(site)} />); };
const text = (html: string) => html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");

describe("consult-first offer page", () => {
  const slugs = ["test-lead", "boggs-plumbing", "corner-cafe", "crenshaw-law-firm", "be-fit"];
  it("renders for any template lead, named for that business, with the guardrails", () => {
    for (const slug of slugs) {
      const record = lead(slug);
      const html = render({ ...record, offer });
      const words = text(html);
      expect(html).toContain('data-offer-plan="consult-first"');
      expect(words).toContain(`prepared for ${record.business.name}`);
      expect(words).toContain("Concept preview");
      expect(words).toContain("KRIV-US-2026-TEST");
      expect(html).not.toMatch(/<form\b|<input\b|<iframe\b/);
      expect(html.match(/<h1\b/g)).toHaveLength(1);
    }
  });
  it("carries no price, no currency and no promised result", () => {
    const words = text(render({ ...lead("boggs-plumbing"), offer }));
    expect(words).not.toMatch(/PHP|₱|\$\s?\d|\bUSD\b|\bCAD\b|per month|a month|free trial|\d+\s?%/i);
    expect(words).not.toMatch(/guarantee|we will (get|increase|double)|rank(ed)? (first|#1|number one)/i);
    expect(words).toContain("KRIV does not promise specific results");
    expect(words).toContain("Fees are proposal-based");
  });
  it("wears a story lead's own theme, and a Philippine business keeps its Philippine quotation", () => {
    const pco = lead("pco-dental-clinic");
    // The same story lead, if it were outside the Philippines.
    const abroad = { ...pco, business: { ...pco.business, address: { ...pco.business.address, country: "US" } }, offer };
    expect(render(abroad)).toContain('data-theme-name="porcelain-teal"');
    const ph = render(pco);
    expect(ph).not.toContain('data-offer-plan="consult-first"');
    expect(text(ph)).toContain("Offer and quotation");
    expect(SiteData.safeParse({ ...pco, offer }).success).toBe(false);
  });
  it("says nothing the main site does not: every line is plain text with no figures", () => {
    const lines = [consult.consultIntro, consult.consultNoPrice, consult.consultNoPromise, consult.consultSite, ...[...consult.consultSteps, ...consult.consultDivisions, ...consult.consultYours].flatMap((x) => [x.name, x.body])];
    for (const line of lines) { expect(line).not.toMatch(/\d/); expect(line.length).toBeLessThan(260); }
    expect(consult.consultSteps).toHaveLength(4);
  });
  it("only accepts the two known plans", () => {
    expect(SiteData.shape.offer.safeParse({ ...offer, plan: "consult-first" }).success).toBe(true);
    expect(SiteData.shape.offer.safeParse({ ...offer, plan: "us-local" }).success).toBe(false);
  });
});
