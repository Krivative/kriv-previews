import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteData } from "@/lib/site-schema";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { bonusPage, brandKitPage, sitePages } from "@/lib/site-pages";
import { templates } from "@/templates";
import { journeyStyle } from "@/stories/journey-style";
import { shoeCare, sneakerJourney } from "@/stories/sneaker-journey";
import { allDvLogoStyles, dvLogoStyle } from "@/sections/DvLogo";
import { beatEffects } from "@/stories/story-sound";
import type { SitePage } from "@/lib/site-pages";

// DV Shop Cebu, the surprise concept for Kriv's friend (2026-11-17).
const record = JSON.parse(readFileSync(path.join(__dirname, "..", "leads", "dv-shop-cebu.json"), "utf8"));
const site = SiteData.parse(record);
const render = (page?: SitePage) => renderToStaticMarkup(<SiteRenderer site={site} template={templates[site.template]} page={page} />);
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&rsquo;|’/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/\s+/g, " ");
const banner = "Concept preview prepared by KRIV for DV Shop Cebu. Not affiliated with or endorsed by DV Shop Cebu.";
const pages = { home: render(), brand: render(brandKitPage(site)), dop: render(bonusPage(site)), contact: render(sitePages(site).find((p) => p.kind === "contact")) };

describe("DV Shop Cebu concept", () => {
  it("wears look C as Kriv picked it: oxblood and peach, pages, kitchen brigade", () => {
    const look = journeyStyle(site);
    expect([look.theme.name, look.lore, look.genre, look.sound, look.layout.words, look.layout.map]).toEqual(["oxblood-peach", "pages", "kitchen-brigade", "kitchen-brigade", "centred", "line"]);
    expect(pages.home).toContain('data-theme-name="oxblood-peach"');
  });

  it("tells 'Keep them fresh' in seven pages, each with a photo of the shop's own", () => {
    const words = text(pages.home);
    expect(pages.home.match(/data-journey-step=""/g)?.length).toBe(7);
    for (const step of sneakerJourney) {
      expect(words).toContain(step.title);
      expect(step.photo).toMatch(/^https:\/\/dvshopcebu\.com\/cdn\/shop\/files\//);
      expect(beatEffects.sneaker[step.id]).toBeDefined();
    }
    expect(words).toContain("Page 1 / Fresh out of the box");
    expect(pages.home.match(/<h1\b/g)?.length).toBe(1);
  });

  it("shows all six DV Shoe Care products at the shop's own prices", () => {
    const words = text(pages.home);
    expect(shoeCare.map((p) => p.price)).toEqual([420, 180, 180, 200, 90, 250]);
    for (const p of shoeCare) expect(words).toContain(p.name);
    for (const price of ["₱420", "₱180", "₱200", "₱90", "₱250"]) expect(words).toContain(price);
  });

  it("keeps every guardrail on every page", () => {
    for (const html of Object.values(pages)) {
      expect(html).toContain(banner);
      expect(html).not.toMatch(/<form\b|<input\b|<select\b|<textarea\b/);
      expect(html).not.toMatch(/<a\b[^>]*href="(?:tel:|mailto:|https?:)/);
      const words = text(html);
      // The refund policy says all sales are final: no money-back promise. No unverified follower counts.
      expect(words).not.toMatch(/money[- ]back|refund|22,?900|6,?100|followers|bandwidth/i);
      // The owner is never named by his legal name until Kriv confirms its spelling.
      expect(words).not.toMatch(/Rodol/);
    }
  });

  it("states the store's real details and credits its photos", () => {
    const words = text(pages.home);
    for (const part of ["Unit 14 G/F Bldg 2, Celadon Town, Brgy. Pajac, Lapu-Lapu City, Cebu, 6015", "11am to 8pm", "dvshopcebu@gmail.com", "DV Cafe", "Rated 5.0 from 75 reviews", "Photos, products and prices: DV Shop Cebu"]) expect(words).toContain(part);
  });

  it("has a brand revamp page with the randomizer's pick among nine sibling badges", () => {
    const words = text(pages.brand);
    expect(allDvLogoStyles).toHaveLength(9);
    const pick = dvLogoStyle(journeyStyle(site).seed);
    expect(pages.brand).toContain(`data-ring="${pick.ring}" data-letters="${pick.letters}"`);
    expect(pages.brand.match(/data-picked=""/g)?.length).toBe(1);
    expect(words).toContain("It is not DV Shop Cebu's official mark.");
  });

  it("has a Dop- bonus page whose handle is only a suggestion", () => {
    const words = text(pages.dop);
    for (const part of ["Dop-", "@dop.dash (suggested)", "it is not an existing account, and nothing is posted anywhere"]) expect(words).toContain(part);
  });
});
