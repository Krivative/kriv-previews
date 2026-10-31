import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteData } from "@/lib/site-schema";
import { guideFor, pageHref, sitePages } from "@/lib/site-pages";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { templateList } from "@/templates";

const fixture = JSON.parse(readFileSync(path.join(import.meta.dirname, "../leads/test-lead.json"), "utf8"));

describe("multi-page arsenal", () => {
  it.each(templateList)("renders every page for $id with guardrails and only known destinations", (template) => {
    const site = SiteData.parse({ ...fixture, template: template.id, about: { body: "Our sourced introduction.", sections: [{ title: "Our approach", body: "More sourced information." }] } });
    const pages = sitePages(site);
    expect(guideFor(site).label).not.toBeUndefined();
    expect(pages.some((p) => p.kind === "about")).toBe(true);
    expect(pages.some((p) => p.kind === "contact")).toBe(true);
    expect(pages.filter((p) => p.kind === "service")).toHaveLength(site.services!.items.length);
    for (const page of pages) {
      const html = renderToStaticMarkup(<SiteRenderer site={site} template={template} page={page} />);
      expect(html).toContain(`Concept preview prepared by KRIV for ${site.business.name}`);
      expect(html).not.toMatch(/<form\b|<input\b|<textarea\b|href="(?:tel:|mailto:)/);
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map((m) => m[1]);
      expect(hrefs.every((href) => href.startsWith("#") || pages.some((p) => pageHref(site, p.path) === href))).toBe(true);
      expect(html).not.toContain("undefined");
    }
  });

  it("omits missing optional pages and facts", () => {
    const site = SiteData.parse({ ...fixture, services: undefined, about: undefined, gallery: undefined, faqs: [], business: { name: "Example", category: "", address: { city: "", country: "US" } } });
    expect(sitePages(site).map((p) => p.path)).toEqual(["", "contact"]);
    const html = renderToStaticMarkup(<SiteRenderer site={site} template={templateList[0]} page={sitePages(site)[1]} />);
    expect(html).toContain("Contact information has not been supplied");
    expect(html).not.toMatch(/Opening hours|>Phone<|>Email<|>Location<|Austin/);
  });

  it("keeps service paths unique and bounded, even for duplicate and non-Latin names", () => {
    const site = SiteData.parse({ ...fixture, services: { items: ["AC repair", "AC repair", "AC repair 2", "診療", "?"].map((name) => ({ name, blurb: "Detail" })) } });
    const paths = sitePages(site).filter((p) => p.kind === "service").map((p) => p.path);
    expect(new Set(paths).size).toBe(5);
    expect(paths.every((p) => /^services\/[a-z0-9-]+$/.test(p))).toBe(true);
  });

  it("renders supplied service detail and chapters as text", () => {
    const site = SiteData.parse({ ...fixture, services: { items: [{ name: "Specific care", blurb: "Summary", detail: "Sourced detail.\nAnother paragraph.", includes: ["An included item", "<script>no</script>"] }] } });
    const page = sitePages(site).find((p) => p.kind === "service")!;
    const html = renderToStaticMarkup(<SiteRenderer site={site} template={templateList[0]} page={page} />);
    expect(html).toContain("Sourced detail.");
    expect(html).toContain("Another paragraph.");
    expect(html).toContain("An included item");
    expect(html).toContain("&lt;script&gt;no&lt;/script&gt;");
  });
});
