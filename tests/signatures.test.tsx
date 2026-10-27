import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteData } from "@/lib/site-schema";
import { ServiceExplorer, VisitJourney, EditorialGallery } from "@/sections/SignatureSections";
import { Photo } from "@/sections/Photo";

const site = SiteData.parse({ slug: "synthetic-pilot", template: "hvac-calm", business: { name: "Fictional Pilot", category: "Synthetic test", address: { city: "Example Town", country: "US" } },
  hero: { headline: "A synthetic concept.", sub: "Test content only." }, seo: { title: "Fictional Pilot", description: "Synthetic data only." }, sources: ["https://example.com/"], createdAt: "2026-10-27", expiresAt: "2026-11-26", status: "draft",
  services: { title: "Verified options", items: [{ name: "Sourced service", blurb: "A verified description.", detail: "A sourced longer description.", includes: ["A sourced inclusion"] }, { name: "Second service", blurb: "Second description." }] },
  custom: { title: "A verified visit", body: "Existing visit information.", items: [{ name: "First part", blurb: "First sourced detail." }, { name: "Second part", blurb: "Second sourced detail." }] },
  gallery: { title: "Illustrative gallery", labels: ["First credited image", "Second credited image"] }, brand: { photos: ["https://images.unsplash.com/hero", "https://images.unsplash.com/one", "https://images.unsplash.com/two"] } });

describe("original interaction signatures", () => {
  it("makes every supplied service readable without JavaScript and links to the correct detail", () => {
    const html = renderToStaticMarkup(<ServiceExplorer site={site} />);
    expect(html).toContain("A sourced longer description."); expect(html).toContain("Second description."); expect(html).toContain("A sourced inclusion");
    expect(html).toContain('href="/synthetic-pilot/services/sourced-service"');
    expect(html.match(/name="synthetic-pilot-services"/g)).toHaveLength(2);
    expect(html).not.toMatch(/<form\b|<input\b|tel:|mailto:/);
  });
  it("omits absent services and never invents a service-specific image", () => {
    expect(renderToStaticMarkup(<ServiceExplorer site={{ ...site, services: undefined }} />)).toBe("");
    const html = renderToStaticMarkup(<ServiceExplorer site={{ ...site, brand: { photos: [], photoCredits: [] } }} />);
    expect(html).not.toContain("<img"); expect(html).toContain("Sourced service");
  });
  it("uses only supplied journey parts and preserves body-only information", () => {
    const html = renderToStaticMarkup(<VisitJourney site={site} />);
    expect(html).toContain("First sourced detail."); expect(html).toContain("Second sourced detail."); expect(html).toContain("Part 2 of 2");
    expect(html).not.toContain("Treatment plan");
    const bodyOnly = renderToStaticMarkup(<VisitJourney site={{ ...site, custom: { title: "Local information", body: "Verified body only.", items: [] } }} />);
    expect(bodyOnly).toContain("Verified body only."); expect(bodyOnly).not.toContain("<details");
  });
  it("renders an accessible gallery with visible images, a labelled dialog and no submissions", () => {
    const html = renderToStaticMarkup(<EditorialGallery site={site} />);
    expect(html).toContain('aria-haspopup="dialog"'); expect(html).toContain("aria-labelledby="); expect(html).toContain("Close gallery");
    expect(html).toContain("First credited image"); expect(html).toContain("Second credited image");
    expect(html).not.toMatch(/<form\b|<input\b|<textarea\b/);
  });
  it("supports a single photo and hides a gallery with no supplied photos", () => {
    const html = renderToStaticMarkup(<EditorialGallery site={{ ...site, brand: { photos: [site.brand.photos[0]], photoCredits: [] } }} />);
    expect(html).toContain('data-count="1"'); expect(html).not.toContain("Next →");
    expect(renderToStaticMarkup(<EditorialGallery site={{ ...site, brand: { photos: [], photoCredits: [] } }} />)).toBe("");
  });
  it("prioritizes only an explicitly marked hero image", () => {
    expect(renderToStaticMarkup(<Photo src="https://images.unsplash.com/fixture" label="Fixture" priority />)).toContain('loading="eager"');
    expect(renderToStaticMarkup(<Photo src="https://images.unsplash.com/fixture" label="Fixture" />)).toContain('loading="lazy"');
  });
});
