import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteData } from "@/lib/site-schema";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { offerPage, pageHref, sitePages } from "@/lib/site-pages";
import { addressText, phoneText } from "@/lib/us-format";
import { templates } from "@/templates";
import { allThreeMonthly, annualCrm, decisionWindows, effectiveMonthly, monthlyServices, php, totalMonths } from "@/offers/ph-local";

const pco = JSON.parse(readFileSync(path.join(__dirname, "..", "leads", "pco-dental-clinic.json"), "utf8"));
const banner = (name: string) => `Concept preview prepared by KRIV for ${name}. Not affiliated with or endorsed by ${name}.`;
const hrefs = (html: string) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => m[1]);
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&rsquo;|’/g, "'").replace(/\s+/g, " ");

function render(input: unknown, offer = false) {
  const site = SiteData.parse(input);
  return renderToStaticMarkup(<SiteRenderer site={site} template={templates[site.template]} page={offer ? offerPage(site) : undefined} />);
}

describe("Philippines-market offer figures (draft)", () => {
  it("adds up the monthly rates", () => {
    expect(monthlyServices.map((s) => s.monthly)).toEqual([3000, 3000, 10000]);
    expect(allThreeMonthly).toBe(16000);
    expect(php(allThreeMonthly)).toBe("PHP 16,000");
  });
  it("spreads the annual CRM price over 15, 14 and 13 months", () => {
    expect(annualCrm).toEqual({ price: 13000, baseMonths: 12 });
    expect(decisionWindows.map((w) => [w.fromDay, w.toDay, w.freeMonths])).toEqual([[15, 17, 3], [18, 20, 2], [21, 23, 1], [24, undefined, 0]]);
    expect(decisionWindows.slice(0, 3).map(totalMonths)).toEqual([15, 14, 13]);
    expect(decisionWindows.slice(0, 3).map(effectiveMonthly)).toEqual([867, 929, 1000]);
  });
});

describe("offer eligibility and schema", () => {
  it("accepts the offer for a Philippine address only", () => {
    expect(SiteData.safeParse(pco).success).toBe(true);
    const us = { ...pco, business: { ...pco.business, address: { ...pco.business.address, country: "US" } } };
    expect(SiteData.safeParse(us).success).toBe(false);
  });
  it("refuses a validity date before the quote date", () => {
    expect(SiteData.safeParse({ ...pco, offer: { ...pco.offer, validUntil: "2026-11-01" } }).success).toBe(false);
  });
  it("keeps the offer page out of the concept site's navigation", () => {
    const site = SiteData.parse(pco);
    expect(sitePages(site).some((p) => p.kind === "offer")).toBe(false);
    expect(offerPage(site)?.path).toBe("offer");
    expect(offerPage(SiteData.parse({ ...pco, offer: undefined }))).toBeUndefined();
  });
});

describe("PCO Dental Clinic concept (Philippines)", () => {
  const site = SiteData.parse(pco);
  it("is a 30-day preview with Philippine formats", () => {
    expect(site.status).toBe("approved");
    expect(site.expiresAt).toBe("2026-12-16");
    expect(addressText(site.business.address)).toBe("[CLINIC ADDRESS], [CITY], [PROVINCE]");
    expect(phoneText({ phoneDisplay: "+63 917 123 4567", phoneE164: "+639171234567" })).toBe("+63 917 123 4567");
  });
  it("shows the banner, an inert booking action and only internal links", () => {
    const html = render(pco);
    expect(html).toContain(banner("PCO Dental Clinic"));
    expect(html).toMatch(/<a aria-disabled="true"[^>]*>Book an appointment<\/a>/);
    expect(html).not.toMatch(/<form\b|<input\b|<a\b[^>]*href="(?:tel:|mailto:|https?:)/);
    const known = [...sitePages(site), offerPage(site)!].map((p) => pageHref(site, p.path));
    for (const href of hrefs(html)) expect(href.startsWith("#") || known.includes(href)).toBe(true);
  });
});

describe("offer and quotation page", () => {
  const html = render(pco, true);
  const words = text(html);
  it("keeps every preview guardrail", () => {
    expect(html).toContain(banner("PCO Dental Clinic"));
    expect(html).not.toMatch(/<form\b|<input\b|<button\b|<a\b[^>]*href="(?:tel:|mailto:|https?:)/);
    expect(hrefs(html).every((href) => href === "#main-content" || href === "/pco-dental-clinic")).toBe(true);
  });
  it("carries the quote details and the draft prices", () => {
    for (const part of ["KRIV-PH-2026-001", "16 November 2026", "16 December 2026", "Prepared for", "14-day free trial",
      "PHP 3,000", "PHP 10,000", "PHP 16,000", "PHP 13,000", "about PHP 867 per month", "about PHP 929 per month", "about PHP 1,000 per month",
      "CRM and system with automations: PHP 13,000 for 12 months", "Automations built into that system", "[EXTRA SERVICES: to be listed by Kriv]", "Days 15 to 17", "From day 24", "Human VA trial", "AI VA trial", "Referral program", "No setup fee", "Change orders", "The clinic owns its accounts and data",
      "physical store in the Philippines"]) expect(words).toContain(part);
    // Each of the four monthly prices, the annual price, its four windows and the no-setup-fee line is marked.
    expect(words.split("Draft, pending Kriv's approval").length - 1).toBeGreaterThanOrEqual(10);
  });
  it("names no other agency and makes no guarantees", () => {
    expect(words).not.toMatch(/wayaway/i);
    expect(render(pco)).not.toMatch(/wayaway/i);
    expect(words).not.toMatch(/guarantee|24\/7|#1|first page/i);
  });
});
