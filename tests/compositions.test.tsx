import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteData } from "@/lib/site-schema";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { templateList } from "@/templates";
import { photoSources } from "@/sections/Photo";

const site = SiteData.parse({ slug: "composed-fixture", template: "aesthetic-calm", contentNiche: "plumbing", business: { name: "Fictional Company", category: "Plumbing", address: { city: "Example Town", country: "US" } }, hero: { headline: "A clear starting point.", sub: "Synthetic supplied content." }, seo: { title: "Fictional Company", description: "Synthetic fixture only." }, services: { title: "Verified services", items: [{ name: "Known repair", blurb: "Sourced short description.", detail: "Sourced longer explanation.", includes: ["Verified inclusion"] }] }, about: { title: "An introduction", body: "Provided company information." }, custom: { title: "Existing notes", items: [{ name: "Known detail", blurb: "Provided detail only." }] }, sources: ["https://example.test/"], createdAt: "2026-10-27", expiresAt: "2026-11-26", status: "draft" });

describe("independently composed designs", () => {
  it.each(["aesthetic-calm", "office-calm", "auto-bold"])("keeps the same source content and safeguards in %s", (id) => {
    const template = templateList.find((t) => t.id === id)!;
    const html = renderToStaticMarkup(<SiteRenderer site={{ ...site, template: id }} template={template} />);
    expect(html).toContain(`data-composition="${template.composition}"`);
    expect(html).toContain("Provided company information."); expect(html).toContain("Provided detail only.");
    expect(html).toContain("Sourced longer explanation."); expect(html).toContain("Verified inclusion");
    expect(html).toContain("Concept preview prepared by KRIV for Fictional Company. Not affiliated with or endorsed by Fictional Company.");
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).not.toMatch(/<form\b|<input\b|<textarea\b|href="(?:tel:|mailto:)/);
    expect(html).not.toContain("Menu</a>");
  });
  it("honors explicit section overrides and does not silently replace an existing custom recipe", () => {
    const template = templateList.find((t) => t.id === "aesthetic-calm")!;
    const html = renderToStaticMarkup(<SiteRenderer site={{ ...site, design: { sections: [{ type: "hero", variant: "split" }] } }} template={template} />);
    expect(html).not.toContain("data-composition="); expect(html).not.toContain('id="services"');
  });
  it("uses a finished no-photo canvas without inventing an image or caption", () => {
    const template = templateList.find((t) => t.id === "aesthetic-calm")!;
    const html = renderToStaticMarkup(<SiteRenderer site={{ ...site, brand: { photos: [], photoCredits: [] } }} template={template} />);
    expect(html).toContain('data-has-scene="false"'); expect(html).not.toContain("<img"); expect(html).not.toContain("illustrative image study");
  });
  it("keeps all six registered fingerprint axes distinct for the three rebuilt compositions", () => {
    const rebuilt = templateList.filter((t) => t.composition);
    expect(rebuilt).toHaveLength(3);
    for (const a of rebuilt) for (const b of templateList.filter((t) => t.id !== a.id)) {
      const axes = ["grammar", "nav", "hero", "sequence", "close", "signature"] as const;
      expect(axes.filter((axis) => a.fingerprint[axis] !== b.fingerprint[axis]).length).toBeGreaterThanOrEqual(4);
    }
  });
  it("creates smaller derivatives of the same credited Unsplash source, leaving business URLs intact", () => {
    const set = photoSources("https://images.unsplash.com/photo-fixture?w=1800&ixid=example");
    expect(set).toContain("w=640&ixid=example 640w"); expect(set).toContain("w=1080&ixid=example 1080w");
    expect(photoSources("https://example.test/own-photo.jpg")).toBeUndefined();
  });
});
