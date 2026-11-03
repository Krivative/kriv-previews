import { describe, expect, it } from "vitest";
import { SiteData, ContentNiche } from "@/lib/site-schema";
import { guideFor, nicheGuides, sitePages } from "@/lib/site-pages";
import { templateList } from "@/templates";
import { presetForm } from "../lead-desk/lib/offer-presets.mjs";
import { contentNicheFor, toRecord } from "../lead-desk/lib/builder.mjs";

const input = { slug: "cross-industry-fixture", template: "cafe-poster", business: { name: "Fictional Company", category: "Plumbing", address: { city: "Example Town", country: "US" } }, hero: { headline: "Fictional Company", sub: "Synthetic concept only." }, seo: { title: "Fictional Company", description: "Synthetic test only." }, sources: ["https://example.test/"], createdAt: "2026-10-27", expiresAt: "2026-11-26", status: "draft" };

describe("designs independent of business content", () => {
  it.each(Object.keys(nicheGuides) as (keyof typeof nicheGuides)[])("retains %s guidance across every registered design", (contentNiche) => {
    for (const template of templateList) {
      const site = SiteData.parse({ ...input, template: template.id, contentNiche, services: { items: [{ name: "Verified offering", blurb: "Supplied explanation." }] } });
      expect(guideFor(site)).toEqual(nicheGuides[contentNiche]);
      expect(sitePages(site).find((p) => p.kind === "services")?.title).toBe(nicheGuides[contentNiche].label);
    }
  });
  it("preserves legacy labels and uses neutral guidance for explicitly general content", () => {
    expect(guideFor(SiteData.parse(input)).label).toBe("Menu");
    expect(guideFor(SiteData.parse({ ...input, contentNiche: "general" })).label).toBe("Services");
    expect(contentNicheFor("medspa")).toBe("aesthetic");
    expect(contentNicheFor("unclassified")).toBe("general");
    expect(ContentNiche.safeParse("invented").success).toBe(false);
  });
  it("rotates through designs that fit HVAC, deterministically, without changing verified offerings", () => {
    const lead = { id: "synthetic-hvac", name: "Fictional Company", niche: "hvac", website: "https://example.test/" };
    const pages = [{ url: lead.website, status: 200, text: "Fictional Company. Heating and air conditioning. AC repair. Pancakes.", html: "<h2>Our services</h2><h3>AC repair</h3><h3>Pancakes</h3>" }];
    const picks = new Set<string>();
    for (let attempt = 0; attempt < templateList.length; attempt++) {
      const form = presetForm(lead, pages, templateList, { attempt });
      picks.add(form.template);
      expect(presetForm(lead, pages, templateList, { attempt }).template).toBe(form.template);
      expect(form.lists.services.map((s: { name: string }) => s.name)).toEqual(["AC repair"]);
      const record = SiteData.parse({ ...toRecord(form), business: { ...toRecord(form).business, address: { city: "", country: "US" } } });
      expect(record.contentNiche).toBe("hvac");
      expect(guideFor(record)).toEqual(nicheGuides.hvac);
    }
    // Kriv, 2026-11-03: only designs that suit the business; never a restaurant or spa look for HVAC.
    expect(picks.size).toBeGreaterThan(1);
    for (const id of picks) expect(["hvac-calm", "hvac-bold", "plumbing-calm", "plumbing-bold", "auto-calm"]).toContain(id);
  });
});
