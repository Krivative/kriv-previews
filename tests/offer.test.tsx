import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RESERVED_SLUGS, SiteData } from "@/lib/site-schema";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { PhRatesPage } from "@/sections/PhRatesPage";
import { brandKitPage, offerPage, pageHref, sitePages } from "@/lib/site-pages";
import { addressText, phoneText } from "@/lib/us-format";
import { templates } from "@/templates";
import { dentalJourney } from "@/stories/dental-journey";
import {
  addOns, allThreeMonthly, bundleQuote, annualPay, annualPlans, annualPrice, annualSaving, annualWorth, audiences, contentTiers, crm, decisionWindows, effectiveMonthly, fill, monthlyServices, php, regularCost, totalMonths,
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
  it("gives a tiered bundle discount on the annual plan, never more than 40% in all", () => {
    const pick = (...names: string[]) => annualPlans.filter((p) => names.includes(p.name));
    const best = decisionWindows[0];
    expect(bundleQuote(pick("Website"), best)).toMatchObject({ pay: 36000, worth: 45000, rate: 0, saving: 9000 });
    expect(bundleQuote(pick("Website", "Content creation"), best)).toMatchObject({ pay: 64800, worth: 90000, rate: 0.1, saving: 25200 });
    expect(bundleQuote(pick("Website", "Content creation", "AI live seller"), best).savingRate).toBeCloseTo(0.32);
    const all = bundleQuote(annualPlans.filter((p) => p.name !== "All three together"), best);
    expect(all.rate).toBe(0.25);
    expect(all.savingRate).toBeCloseTo(0.4);
    expect(all.pay).toBe(Math.round(all.worth * 0.6));
  });
  it("starts on the Website alone, annual, with the saving shown", () => {
    for (const part of ["Build your plan", "You pay for the year", "PHP 36,000", "PHP 45,000", "PHP 9,000 (20% off)", "about PHP 2,400 a month", "up to 40% off", "nothing is saved or sent"]) expect(words).toContain(part);
    expect(html.match(/aria-pressed="true"/g)?.length).toBe(4);
  });
  it("links every menu item to a section on the page", () => {
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    const anchors = hrefs(html).filter((href) => href.startsWith("#"));
    expect(anchors.length).toBeGreaterThanOrEqual(10);
    for (const href of anchors) expect(ids.has(href.slice(1))).toBe(true);
  });
});

describe("the two timelines story", () => {
  const general = text(renderToStaticMarkup(<PhRatesPage />));
  const clinic = text(render(pco, true));
  it("tells all seven chapters with the Website's own figures, readable without scripts", () => {
    for (const part of ["The two timelines", "Chapter 1 / The fork", "Chapter 2 / Timeline A", "Chapter 3 / Timeline B", "Chapter 4 / Side by side",
      "Chapter 5 / You already know this", "Chapter 6 / More than the discount", "Chapter 7 / The portal closes",
      "15 months PHP 45,000", "15 months PHP 36,000", "Same 15 months. PHP 9,000 apart.", "Tingi or the big pack", "The suki price", "A year of rent",
      "Save PHP 9,000", "Save PHP 6,000", "Save PHP 3,000", "Monthly only", "Replay the story"]) expect(general).toContain(part);
  });
  it("speaks to the right audience and promises nothing", () => {
    expect(general).toContain("PHP 9,000 stays with your business");
    expect(clinic).toContain("PHP 9,000 stays with the clinic");
    expect(general).not.toMatch(/guarantee|more customers|more leads|ahead of your competitors|\{\w+\}/i);
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
    expect(addressText(site.business.address)).toBe("[CLINIC ADDRESS], Mandaue, Cebu");
    expect(phoneText({ phoneDisplay: "+63 917 123 4567", phoneE164: "+639171234567" })).toBe("+63 917 123 4567");
  });
  it("shows the banner, an inert booking action and only internal links", () => {
    const html = render(pco);
    expect(html).toContain(banner("PCO Dental Clinic"));
    expect(html).toMatch(/<a [^>]*aria-disabled="true"[^>]*>Book an appointment/);
    expect(html).not.toMatch(/<a [^>]*href="[^"]*"[^>]*>Book an appointment/);
    expect(html).not.toMatch(/<form\b|<input\b|<a\b[^>]*href="(?:tel:|mailto:|https?:)/);
    const known = [...sitePages(site), offerPage(site)!, brandKitPage(site)!].map((p) => pageHref(site, p.path));
    for (const href of hrefs(html)) expect(href.startsWith("#") || known.includes(href)).toBe(true);
  });
});

describe("PCO scroll journey", () => {
  const html = render(pco);
  const words = text(html);
  it("tells the story of one tooth in eight chapters, each with its narration", () => {
    expect(html.match(/data-journey-step/g)?.length).toBe(8);
    expect(dentalJourney.length).toBe(8);
    for (const step of dentalJourney) {
      expect(words).toContain(step.title);
      expect(words).toContain(step.narration.replace(/'/g, "'"));
      expect(html).toContain(`id="journey-${step.id}"`);
    }
    expect(html.match(/<h1\b/g)?.length).toBe(1);
  });
  it("keeps the clinic's placeholders and details after the story", () => {
    for (const part of ["[SERVICE 1]", "[CLINIC ADDRESS], Mandaue, Cebu", "[OPENING HOURS]", "[DENTIST'S NOTE", "Is this the clinic's real website?"]) expect(words).toContain(part);
  });
  it("shows the concept redraw of the clinic's logo, in the header and as a badge", () => {
    expect(html.match(/logo, concept redraw/g)?.length).toBe(2);
    expect(html).toContain('href="/pco-dental-clinic/brand-kit"');
    expect(html).toContain("PCO DENTAL CLINIC MANDAUE");
    expect(words).toContain("A concept redraw of the clinic's logo by KRIV, for the clinic to approve.");
  });
  it("has a concept brand kit page with the logo on three grounds, colours, type and mock-ups", () => {
    const site = SiteData.parse(pco);
    const kit = renderToStaticMarkup(<SiteRenderer site={site} template={templates[site.template]} page={brandKitPage(site)} />);
    const kitWords = text(kit);
    expect(kit).toContain(banner("PCO Dental Clinic"));
    for (const part of ["Concept brand kit", "On navy", "On lime", "On white", "#E7FA78", "Lexend Zetta", "Page cover", "Profile picture", "Square post", "Appointment card", "[DENTIST NAME]", "Every piece is a proposal for the clinic to approve."]) expect(kitWords).toContain(part);
    expect(kit.match(/logo, concept redraw/g)?.length).toBeGreaterThanOrEqual(9);
    expect(kit).not.toMatch(/<form\b|<input\b|<button\b|<a\b[^>]*href="(?:tel:|mailto:|https?:)/);
    expect(kitWords).not.toMatch(/wayaway|award|guarantee|PHP|₱/i);
  });
  it("makes no claims for the clinic and names no other agency", () => {
    expect(words).not.toMatch(/wayaway|award|guarantee|best dentist|painless|years of experience|\d+\+? (?:patients|reviews)|★/i);
    expect(words).toContain("makes no claims about the clinic");
  });
  it("gives every chapter its own recording, and the files exist", () => {
    for (const step of dentalJourney) {
      expect(step.audio).toMatch(/^\/for\/audio\/pco-journey\/0[1-8]-[a-z]+\.mp3\?v=\d+$/);
      expect(html).toContain(`data-audio="${step.audio}"`);
      expect(existsSync(path.join(__dirname, "..", "public", step.audio!.replace(/^\/for\//, "").replace(/\?.*$/, "")))).toBe(true);
    }
  });
  it("has one narration button and no form", () => {
    expect(html.match(/<button\b/g)?.length).toBe(1);
    expect(html).toMatch(/<button type="button" data-voice-button="" aria-pressed="true">Narration on<\/button>/);
    expect(html).not.toMatch(/<form\b|<input\b|<audio\b|<iframe\b/);
  });
  it("leaves the inner pages on the lead's template", () => {
    const site = SiteData.parse(pco);
    const about = sitePages(site).find((p) => p.kind === "about");
    if (about) expect(renderToStaticMarkup(<SiteRenderer site={site} template={templates[site.template]} page={about} />)).not.toContain("data-journey-step");
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
