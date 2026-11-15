import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RESERVED_SLUGS, SiteData } from "@/lib/site-schema";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { PhRatesPage } from "@/sections/PhRatesPage";
import { offerPage, pageHref, sitePages } from "@/lib/site-pages";
import { addressText, phoneText } from "@/lib/us-format";
import { templates } from "@/templates";
import {
  addOns, allThreeMonthly, annualPay, annualPlans, annualPrice, annualSaving, annualWorth, audiences, contentTiers, crm, decisionWindows, effectiveMonthly, fill, monthlyServices, php, regularCost, totalMonths,
} from "@/offers/ph-local";

const pco = JSON.parse(readFileSync(path.join(__dirname, "..", "leads", "pco-dental-clinic.json"), "utf8"));
const banner = (name: string) => `Concept preview prepared by KRIV for ${name}. Not affiliated with or endorsed by ${name}.`;
const hrefs = (html: string) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => m[1]);
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&rsquo;|’/g, "'").replace(/\s+/g, " ");

function render(input: unknown, offer = false) {
  const site = SiteData.parse(input);
  return renderToStaticMarkup(<SiteRenderer site={site} template={templates[site.template]} page={offer ? offerPage(site) : undefined} />);
}

// Every figure both pages must show (Kriv's prices, 2026-11-16).
const figures = ["14-day free trial", "No setup fee", "PHP 3,000", "PHP 10,000", "PHP 16,000", "12 image posts a month",
  "PHP 13,000 per month", "Regular rate PHP 15,000 per month", "PHP 156,000",
  "15 months for the price of 12", "PHP 2,000 saved every month", "What you save on each service",
  // Website: 15 months month by month, the annual price, the saving.
  "PHP 45,000", "PHP 36,000", "PHP 9,000",
  // CRM: 15, 14 and 13 months at the regular rate against the annual price.
  "PHP 225,000", "PHP 210,000", "PHP 195,000", "PHP 69,000", "PHP 54,000", "PHP 39,000",
  "Days 15 to 17", "From day 24", "Branding kit", "PHP 7,500 one-time", "AI agent", "PHP 2,500 per month",
  "Human VA trial", "AI VA trial", "Referral program", "Change orders", "physical store in the Philippines"];

describe("Philippines-market offer figures", () => {
  it("keeps the 3,000 services and adds up the three monthly rates", () => {
    expect(monthlyServices.map((s) => s.monthly)).toEqual([3000, 3000, 10000]);
    expect(allThreeMonthly).toBe(16000);
    expect(php(allThreeMonthly)).toBe("PHP 16,000");
    expect(contentTiers.map((t) => t.monthly)).toEqual([3000, null, null]);
    expect(addOns.map((a) => [a.name, a.price, a.unit])).toEqual([["Branding kit", 7500, "one-time"], ["AI agent", 2500, "per month"]]);
  });
  it("stacks the CRM promo with the extra months on the annual plan", () => {
    expect(crm).toEqual({ regularMonthly: 15000, promoMonthly: 13000, baseMonths: 12 });
    expect(annualPrice).toBe(156000);
    expect(decisionWindows.map((w) => [w.fromDay, w.toDay, w.freeMonths])).toEqual([[15, 17, 3], [18, 20, 2], [21, 23, 1], [24, undefined, 0]]);
    expect(decisionWindows.slice(0, 3).map(totalMonths)).toEqual([15, 14, 13]);
    expect(decisionWindows.slice(0, 3).map(effectiveMonthly)).toEqual([10400, 11143, 12000]);
    expect(decisionWindows.slice(0, 3).map(regularCost)).toEqual([225000, 210000, 195000]);
  });
});

describe("annual plans and savings", () => {
  const [three, two, one] = decisionWindows;
  const plan = (name: string) => annualPlans.find((p) => p.name === name)!;
  it("covers every monthly service", () => {
    expect(annualPlans.map((p) => [p.name, p.monthly, p.regular])).toEqual([
      ["Website", 3000, 3000], ["Content creation", 3000, 3000], ["AI live seller", 10000, 10000],
      ["All three together", 16000, 16000], ["CRM and system with automations", 13000, 15000], ["AI agent", 2500, 2500],
    ]);
  });
  it("charges twelve months and counts the extra months as the saving", () => {
    expect(annualPlans.map(annualPay)).toEqual([36000, 36000, 120000, 192000, 156000, 30000]);
    expect([three, two, one].map((w) => annualWorth(plan("Website"), w))).toEqual([45000, 42000, 39000]);
    expect([three, two, one].map((w) => annualSaving(plan("Website"), w))).toEqual([9000, 6000, 3000]);
    expect([three, two, one].map((w) => annualSaving(plan("AI live seller"), w))).toEqual([30000, 20000, 10000]);
    expect([three, two, one].map((w) => annualSaving(plan("All three together"), w))).toEqual([48000, 32000, 16000]);
    expect([three, two, one].map((w) => annualSaving(plan("AI agent"), w))).toEqual([7500, 5000, 2500]);
  });
  it("combines the promo and the extra months for the CRM", () => {
    expect([three, two, one].map((w) => annualWorth(plan("CRM and system with automations"), w))).toEqual([225000, 210000, 195000]);
    expect([three, two, one].map((w) => annualSaving(plan("CRM and system with automations"), w))).toEqual([69000, 54000, 39000]);
  });
});

describe("plan builder and section menu", () => {
  const html = renderToStaticMarkup(<PhRatesPage />);
  const words = text(html);
  it("starts on Website and Content creation, annual, with the saving shown", () => {
    for (const part of ["Build your plan", "You pay for the year", "PHP 72,000", "PHP 90,000", "PHP 18,000", "about PHP 4,800 a month", "nothing is saved or sent"]) expect(words).toContain(part);
    expect(html.match(/aria-pressed="true"/g)?.length).toBe(4);
  });
  it("links every menu item to a section on the page", () => {
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    const anchors = hrefs(html).filter((href) => href.startsWith("#"));
    expect(anchors.length).toBeGreaterThanOrEqual(10);
    for (const href of anchors) expect(ids.has(href.slice(1))).toBe(true);
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
    expect(html).not.toMatch(/<form\b|<input\b|<select\b|<textarea\b|<a\b[^>]*href="(?:tel:|mailto:|https?:)/);
    expect(hrefs(html).every((href) => href.startsWith("#") || href === "/pco-dental-clinic")).toBe(true);
    // The plan builder's buttons only switch what the page shows.
    expect([...html.matchAll(/<button\b[^>]*>/g)].every((m) => /type="button"/.test(m[0]))).toBe(true);
  });
  it("carries the quote details and Kriv's prices, with no draft marks", () => {
    for (const part of ["KRIV-PH-2026-001", "16 November 2026", "16 December 2026", "Prepared for", "The clinic owns its accounts and data", ...figures]) expect(words).toContain(part);
    expect(words).not.toMatch(/pending|draft|\{\w+\}|\[[A-Z ]+[:\]]/i);
  });
  it("names no other agency and makes no guarantees", () => {
    expect(words).not.toMatch(/wayaway/i);
    expect(render(pco)).not.toMatch(/wayaway/i);
    expect(words).not.toMatch(/guarantee|24\/7|#1|first page|ahead of your competitors/i);
  });
});

describe("general Philippine rates page", () => {
  const html = renderToStaticMarkup(<PhRatesPage />);
  const words = text(html);
  it("shows the same figures with no client named and no draft marks", () => {
    for (const part of ["Philippine rates", "Your business owns its accounts and data", ...figures]) expect(words).toContain(part);
    expect(words).not.toMatch(/PCO|clinic|dental|patient|quotation|wayaway/i);
    expect(words).not.toMatch(/pending|draft|\{\w+\}|\[[A-Z ]+[:\]]/i);
  });
  it("has no forms, links only to KRIV's own booking page and email, and makes no guarantees", () => {
    expect(html).not.toMatch(/<form\b|<input\b|<select\b|<textarea\b|<a\b[^>]*href="tel:/);
    expect(hrefs(html).filter((href) => !href.startsWith("#"))).toEqual(["https://kriv.agency/book", "mailto:hello@kriv.agency"]);
    expect([...html.matchAll(/<button\b[^>]*>/g)].every((m) => /type="button"/.test(m[0]))).toBe(true);
    expect(words).not.toMatch(/guarantee|24\/7|#1|first page|ahead of your competitors/i);
  });
  it("reserves its address and fills every wording token", () => {
    expect(RESERVED_SLUGS.has("ph-rates")).toBe(true);
    expect(fill("{Client} and {client}, {your} {customers}, {unknown}", audiences.clinic)).toBe("The clinic and the clinic, the clinic's patients, {unknown}");
  });
});
