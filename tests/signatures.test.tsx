import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteData } from "@/lib/site-schema";
import { ServiceExplorer, VisitJourney, EditorialGallery, ServiceDetails } from "@/sections/SignatureSections";
import { Services, Gallery, Custom } from "@/sections/Sections";
import { GalleryViewer } from "@/sections/GalleryViewer";
import { Photo } from "@/sections/Photo";

const site = SiteData.parse({ slug: "synthetic-pilot", template: "hvac-calm", business: { name: "Fictional Pilot", category: "Synthetic test", address: { city: "Example Town", country: "US" } },
  hero: { headline: "A synthetic concept.", sub: "Test content only." }, seo: { title: "Fictional Pilot", description: "Synthetic data only." }, sources: ["https://example.com/"], createdAt: "2026-10-27", expiresAt: "2026-11-26", status: "draft",
  services: { title: "Verified options", items: [{ name: "Sourced service", blurb: "A verified description.", detail: "A sourced longer description.", includes: ["A sourced inclusion"] }, { name: "Second service", blurb: "Second description." }] },
  custom: { title: "A verified visit", body: "Existing visit information.", items: [{ name: "First part", blurb: "First sourced detail." }, { name: "Second part", blurb: "Second sourced detail." }] },
  gallery: { title: "Illustrative gallery", labels: ["First credited image", "Second credited image"] }, brand: { photos: ["https://images.unsplash.com/hero", "https://images.unsplash.com/one", "https://images.unsplash.com/two"] } });

describe("original interaction signatures", () => {
  it.each(["rows", "grid", "columns", "menu", "tiles", "editorial"] as const)("keeps %s offerings readable and links separate from progressive details", (variant) => {
    const html = renderToStaticMarkup(<Services site={site} variant={variant} />);
    expect(html).toContain(`data-service-layout="${variant}"`);
    expect(html).toContain('aria-label="Explore details: Sourced service"');
    expect(html).toContain("A sourced longer description.");
    expect(html).toContain('href="/synthetic-pilot/services/second-service"');
    expect(html.match(/data-interaction="offering-detail"/g)).toHaveLength(1);
    expect(html).not.toMatch(/<summary[^>]*>[^<]*<a/);
  });
  it("omits empty and duplicate service detail without losing the concise description", () => {
    expect(renderToStaticMarkup(<ServiceDetails item={{ name: "Known service", blurb: "Existing description.", detail: "Existing description.", includes: [] }} />)).toBe("");
    expect(renderToStaticMarkup(<ServiceDetails item={{ name: "Known service", blurb: "Short description.", includes: ["Verified inclusion"] }} />)).toContain("Verified inclusion");
    const repeated = renderToStaticMarkup(<Services site={{ ...site, services: { title: "Known options", items: [{ name: "Known service", blurb: "Short description.", detail: "Short description.\n\nSupplied additional information." }] } }} variant="tiles" />);
    expect(repeated.match(/Short description\./g)).toHaveLength(1); expect(repeated).toContain("Supplied additional information.");
  });
  it.each(["mosaic", "strip"] as const)("preserves %s gallery labels and only gives actual photos a viewer", (variant) => {
    const html = renderToStaticMarkup(<Gallery site={{ ...site, brand: { photos: ["https://images.unsplash.com/hero", "https://images.unsplash.com/one"], photoCredits: [] }, gallery: { labels: ["Real photo", "Label only"] } }} variant={variant} />);
    expect(html).not.toContain("images.unsplash.com/hero"); // the hero photo is never repeated in the gallery
    expect(html).toContain(`data-gallery-layout="${variant}"`);
    expect(html).toContain("Label only");
    expect(html.match(/aria-haspopup="dialog"/g)).toHaveLength(1);
    expect(html).not.toContain("Next →");
  });
  it("keeps label-only galleries and process parts readable without invented controls", () => {
    const noPhoto = renderToStaticMarkup(<Gallery site={{ ...site, brand: { photos: [], photoCredits: [] } }} variant="strip" />);
    expect(noPhoto).toContain("First credited image"); expect(noPhoto).not.toContain("<dialog");
    const steps = renderToStaticMarkup(<Custom site={{ ...site, custom: { title: "Source-backed process", items: [{ name: "Known part", blurb: "Verified explanation." }, { name: "Name only" }] } }} variant="steps" />);
    expect(steps).toContain("Verified explanation."); expect(steps).toContain("Name only"); expect(steps.match(/<details/g)).toHaveLength(1);
  });
  it("excludes missing photos from modal navigation while preserving their visible labels", () => {
    const html = renderToStaticMarkup(<GalleryViewer businessName="Fictional fixture" layout="mosaic" photos={[{ label: "Label only" }, { src: "https://images.unsplash.com/one", label: "Actual photo" }, { src: "https://images.unsplash.com/two", label: "Other photo" }]} />);
    expect(html).toContain("1 / 2"); expect(html).toContain("Next →"); expect(html.match(/aria-haspopup="dialog"/g)).toHaveLength(2);
    expect(renderToStaticMarkup(<GalleryViewer businessName="Fictional fixture" photos={[]} />)).toBe("");
  });
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
  it("never repeats the hero photo and hides a gallery with no other photos", () => {
    // Kriv, 2026-11-03: a lone hero photo is not repeated as a one-image gallery.
    expect(renderToStaticMarkup(<EditorialGallery site={{ ...site, brand: { photos: [site.brand.photos[0]], photoCredits: [] } }} />)).toBe("");
    const two = renderToStaticMarkup(<EditorialGallery site={{ ...site, brand: { photos: site.brand.photos.slice(0, 2), photoCredits: [] } }} />);
    expect(two).toContain('data-count="1"'); expect(two).not.toContain("images.unsplash.com/hero"); expect(two).not.toContain("Next →");
    expect(renderToStaticMarkup(<EditorialGallery site={{ ...site, brand: { photos: [], photoCredits: [] } }} />)).toBe("");
  });
  it("prioritizes only an explicitly marked hero image", () => {
    expect(renderToStaticMarkup(<Photo src="https://images.unsplash.com/fixture" label="Fixture" priority />)).toContain('loading="eager"');
    expect(renderToStaticMarkup(<Photo src="https://images.unsplash.com/fixture" label="Fixture" />)).toContain('loading="lazy"');
  });
});
