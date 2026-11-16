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
import { ratesJourney } from "@/stories/rates-journey";
import { journeyStyle, journeyThemes } from "@/stories/journey-style";
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
    expect(html.match(/aria-pressed="true"/g)?.length).toBe(5); // narration on, plus the builder's four
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
    expect(addressText(site.business.address)).toBe("Carlos Perez Building, Door 3, A.C. Cortes Ave., Barangay Ibabao-Estancia, Mandaue City, Cebu, 6014");
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
    expect(html.match(/id="journey-[a-z]+" class="[^"]*" data-journey-step/g)?.length).toBe(8);
    expect(dentalJourney.length).toBe(8);
    for (const step of dentalJourney) {
      expect(words).toContain(step.title);
      expect(words).toContain(step.narration.replace(/'/g, "'"));
      expect(html).toContain(`id="journey-${step.id}"`);
    }
    expect(html.match(/<h1\b/g)?.length).toBe(1);
  });
  it("keeps the clinic's placeholders and details after the story", () => {
    for (const part of ["[SERVICE 1]", "Carlos Perez Building, Door 3, A.C. Cortes Ave., Barangay Ibabao-Estancia, Mandaue City, Cebu, 6014", "[OPENING HOURS]", "[DENTIST'S NOTE", "Is this the clinic's real website?"]) expect(words).toContain(part);
  });
  it("shows the concept redraw of the clinic's logo, in the header and as a badge", () => {
    expect(html.match(/logo, concept redraw/g)?.length).toBe(9); // header, two crests, intro badge, footer, four social mock-ups
    expect(html).toContain('href="/pco-dental-clinic/brand-kit"');
    expect(html).toContain("PCO DENTAL CLINIC MANDAUE");
    expect(words).toContain("A concept redraw of the clinic's logo by KRIV, for the clinic to approve.");
  });
  it("has a concept brand kit page with the logo on three grounds, colours, type and mock-ups", () => {
    const site = SiteData.parse(pco);
    const kit = renderToStaticMarkup(<SiteRenderer site={site} template={templates[site.template]} page={brandKitPage(site)} />);
    const kitWords = text(kit);
    expect(kit).toContain(banner("PCO Dental Clinic"));
    for (const part of ["Concept brand kit", "On the ground colour", "On the accent", "On white", "#E7FA78", "Lexend Zetta", "Page cover", "Profile picture", "Square post", "Appointment card", "[DENTIST NAME]", "Every piece is a proposal for the clinic to approve."]) expect(kitWords).toContain(part);
    expect(kit.match(/logo, concept redraw/g)?.length).toBeGreaterThanOrEqual(9);
    expect(kit).not.toMatch(/<form\b|<input\b|<button\b|<a\b[^>]*href="(?:tel:|mailto:|https?:)/);
    expect(kitWords).not.toMatch(/wayaway|award|guarantee|PHP|₱/i);
  });
  it("carries the clinic's mark top centre through the story", () => {
    expect(html).toMatch(/<p class="[^"]*crest[^"]*"><span><svg[^>]*aria-label="PCO logo, concept redraw"/);
    expect(html).toContain("<b>PCO DENTAL CLINIC MANDAUE</b>");
  });
  it("continues after the story as level two: the clinic as connected stops on one map", () => {
    for (const id of ["inside", "services", "about", "book", "visit", "social", "faq"]) expect(html).toMatch(new RegExp(`id="${id}" class="[^"]*" data-journey-step`));
    expect(html.match(/data-journey-scene/g)?.length).toBe(7);
    for (const part of ["Level two / Inside the clinic", "Stop 2 of 7 / Services", "Leads to → The team", "Stop 6 of 7 / On social media", "Stop 7 of 7 / Questions", "The ride ends here."]) expect(words).toContain(part);
  });
  it("shows the clinic's own contact details as text, never as live links", () => {
    for (const part of ["0916 760 2325", "pcodentalclinicmandaue@gmail.com", "Barangay Ibabao-Estancia", "The clinic's Facebook page", "[OPENING HOURS]"]) expect(words).toContain(part);
    expect(html).not.toMatch(/href="[^"]*(facebook\.com|mailto:|tel:)/);
    expect(html).toMatch(/<a aria-disabled="true"[^>]*>The clinic(&#x27;|')s Facebook page<\/a>/);
    expect(html).toContain("PCO DENTAL CLINIC MANDAUE</");
  });
  it("shows the social media mock-ups on the clinic's own site", () => {
    for (const part of ["Page cover", "Profile picture", "Square post", "Story or reel cover"]) expect(words).toContain(part);
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
  it("renders a place for the next-chapter cue, empty until the page runs", () => {
    expect(html).toMatch(/<p class="[^"]*cue[^"]*" role="status"><span><\/span><\/p>/);
  });
  it("has one narration button and no form", () => {
    expect(html.match(/<button\b/g)?.length).toBe(1);
    expect(html).toMatch(/<button type="button" data-voice-button="" aria-pressed="true">Narration on<\/button>/);
    expect(html).not.toMatch(/<form\b|<input\b|<audio\b|<iframe\b/);
  });
  it("gives every inner page the brand look, the concept logo and the banner", () => {
    const site = SiteData.parse(pco);
    const inner = sitePages(site).filter((p) => p.kind !== "home");
    expect(inner.map((p) => p.kind)).toEqual(expect.arrayContaining(["services", "about", "faq", "contact", "service"]));
    const known = [...sitePages(site), offerPage(site)!, brandKitPage(site)!].map((p) => pageHref(site, p.path));
    for (const page of inner) {
      const out = renderToStaticMarkup(<SiteRenderer site={site} template={templates[site.template]} page={page} />);
      expect(out).toContain('data-theme-name="night-lime"');
      expect(out.match(/logo, concept redraw/g)?.length).toBe(2);
      expect(out).toContain(banner("PCO Dental Clinic"));
      expect(out.match(/<h1\b/g)?.length).toBe(1);
      expect(out).not.toContain("data-journey-step");
      expect(out).not.toMatch(/<form\b|<input\b|<button\b|<a\b[^>]*href="(?:tel:|mailto:|https?:)/);
      for (const href of hrefs(out)) expect(href.startsWith("#") || known.includes(href)).toBe(true);
    }
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

const luminance = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: string, b: string) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

describe("story style randomizer", () => {
  const html = render(pco);
  it("keeps PCO on the look pinned in its record", () => {
    const look = journeyStyle(SiteData.parse(pco));
    expect([look.theme.name, look.lore, look.side, look.orbit]).toEqual(["night-lime", "chapters", "right", "dotted"]);
    expect(html).toContain('data-theme-name="night-lime"');
    expect(text(html)).toContain("Chapter 1 / The start");
  });
  it("gives the same seed the same look, and different seeds different looks", () => {
    const of = (seed: string) => { const l = journeyStyle({ slug: "x", storyStyle: { seed } }); return `${l.theme.name}/${l.lore}/${l.side}/${l.orbit}`; };
    expect(of("abc")).toBe(of("abc"));
    const seen = new Set(Array.from({ length: 60 }, (_, n) => of(`seed-${n}`)));
    expect(seen.size).toBeGreaterThan(25);
    expect(new Set(Array.from({ length: 60 }, (_, n) => journeyStyle({ slug: `lead-${n}` }).theme.name)).size).toBe(journeyThemes.length);
  });
  it("restyles the whole story from a seed without touching its words", () => {
    const other = render({ ...pco, storyStyle: { theme: "forest-gold", lore: "stops", side: "left", orbit: "none" } });
    expect(other).toContain('data-theme-name="forest-gold"');
    expect(other).toContain("Fraunces");
    expect(text(other)).toContain("Stop 1 of 8 / The start");
    for (const step of dentalJourney) expect(text(other)).toContain(step.narration);
    expect(other).toContain(banner("PCO Dental Clinic"));
  });
  it("offers both dark and light grounds", () => {
    expect(journeyThemes.filter((t) => t.dark).length).toBeGreaterThanOrEqual(8);
    expect(journeyThemes.filter((t) => !t.dark).length).toBeGreaterThanOrEqual(3);
    const light = render({ ...pco, storyStyle: { theme: "paper-pine" } });
    expect(light).toContain('data-theme-name="paper-pine"');
    expect(light).toContain(banner("PCO Dental Clinic"));
  });
  it("defines every theme in full, with readable text and accent", () => {
    for (const t of journeyThemes) {
      for (const value of [t.bg, t.surface, t.ink, t.bright, t.muted, t.accent, t.accentInk]) expect(value).toMatch(/^#[0-9a-f]{6}$/);
      expect(t.googleCss).toContain("https://fonts.googleapis.com/css2?");
      expect(t.deep).toMatch(/^#[0-9a-f]{6}$/);
      // Text must read on its ground, and button text on the accent (WCAG AA for normal text is 4.5).
      expect(contrast(t.ink, t.bg)).toBeGreaterThan(7);
      expect(contrast(t.muted, t.bg)).toBeGreaterThan(4.5);
      expect(contrast(t.accentInk, t.accent)).toBeGreaterThan(4.5);
      expect(contrast(t.accent, t.bg)).toBeGreaterThan(4.5);
    }
  });
});

describe("rates page scroll story", () => {
  const html = renderToStaticMarkup(<PhRatesPage />);
  const words = text(html);
  it("opens with ten chapters, one picture each, and every narration", () => {
    expect(html.match(/data-journey-step/g)?.length).toBe(10);
    expect(html.match(/data-journey-scene/g)?.length).toBe(10);
    expect(html.match(/<h1\b/g)?.length).toBe(1);
    for (const step of ratesJourney) { expect(words).toContain(step.title); expect(words).toContain(step.narration); }
  });
  it("takes its figures from the rates and promises nothing", () => {
    for (const part of ["PHP 45,000", "PHP 36,000", "PHP 9,000 less", "days 15 to 17 for 3 free months", "10% for 2, up to 25% for 5", "stops at 40%", "does not promise results"]) expect(words).toContain(part);
  });
  it("starts with narration on and gives every chapter its recording", () => {
    expect(html).toMatch(/<button type="button" data-voice-button="" aria-pressed="true">Narration on<\/button>/);
    for (const step of ratesJourney) {
      expect(step.audio).toMatch(/^\/for\/audio\/rates-journey\/(0[1-9]|10)-[a-z]+\.mp3\?v=\d+$/);
      expect(html).toContain(`data-audio="${step.audio}"`);
      expect(existsSync(path.join(__dirname, "..", "public", step.audio!.replace(/^\/for\//, "").replace(/\?.*$/, "")))).toBe(true);
    }
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
