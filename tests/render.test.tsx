import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteData } from "@/lib/site-schema";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { templateList } from "@/templates";

const testLead = JSON.parse(readFileSync(path.join(__dirname, "..", "leads", "test-lead.json"), "utf8"));
const minimal = {
  slug: "minimal",
  template: "dental-clear",
  business: { name: "Minimal Co", category: "Shop", address: { city: "Austin", country: "US" } },
  hero: { headline: "Headline", sub: "Sub" },
  seo: { title: "Minimal", description: "Minimal" },
  sources: ["https://example.com/"],
  createdAt: "2026-10-24",
  expiresAt: "2026-11-23",
  status: "approved",
};

const banner = (name: string) => `Concept preview prepared by KRIV for ${name}. Not affiliated with or endorsed by ${name}.`;

function render(input: unknown, templateId?: string) {
  const site = SiteData.parse(templateId ? { ...(input as object), template: templateId } : input);
  const template = templateList.find((t) => t.id === site.template)!;
  return renderToStaticMarkup(<SiteRenderer site={site} template={template} />);
}

function anchorHrefs(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => m[1]);
}

describe.each(templateList.map((t) => t.id))("template %s", (id) => {
  it.each([
    ["full", testLead],
    ["minimal", minimal],
  ])("renders %s data with the banner and no live links", (_label, data) => {
    const html = render(data, id);
    const name = (data as { business: { name: string } }).business.name;
    expect(html).toContain(banner(name));
    for (const href of anchorHrefs(html)) expect(href.startsWith("#")).toBe(true);
    expect(html).not.toMatch(/<form\b|<input\b|<textarea\b/);
  });
});

it("sets the page language from the lead", () => {
  expect(render(testLead)).toContain('lang="en-US"');
});
