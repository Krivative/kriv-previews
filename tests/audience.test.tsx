import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteData } from "@/lib/site-schema";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { templates } from "@/templates";
import { journeyStyle, journeyThemes, lookAttributes } from "@/stories/journey-style";

// The audience setting: "adults" keeps the randomizer inside a grown-up register
// (general and aesthetic practices), and the seed still varies the look within it.

const seeds = Array.from({ length: 60 }, (_, i) => `seed-${i}`);
const record = JSON.parse(readFileSync(path.join(process.cwd(), "leads", "pco-dental-clinic.json"), "utf8"));
const pco = SiteData.parse(record.site ?? record);

describe("audience: adults", () => {
  it("picks only quiet themes, no costume, no dotted rings and no glass cards", () => {
    for (const seed of seeds) {
      const look = journeyStyle({ slug: seed, storyStyle: { audience: "adults" } });
      expect(look.audience).toBe("adults");
      expect(look.theme.adult).toBe(true);
      expect(look.genre).toBe("plain");
      expect(["none", "double"]).toContain(look.orbit);
      expect(["outlined", "solid"]).toContain(look.layout.cards);
      expect(["chapters", "pages"]).toContain(look.lore);
      expect(lookAttributes(look)["data-audience"]).toBe("adults");
    }
  });
  it("still varies: several themes and layouts across the seeds", () => {
    const looks = seeds.map((seed) => journeyStyle({ slug: seed, storyStyle: { audience: "adults" } }));
    expect(new Set(looks.map((l) => l.theme.name)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(looks.map((l) => JSON.stringify(l.layout))).size).toBeGreaterThan(10);
  });
  it("keeps the adult-only themes out of the general pool, and the general pool as it was", () => {
    const only = journeyThemes.filter((t) => t.only === "adults").map((t) => t.name);
    expect(only).toEqual(["porcelain-teal", "linen-bronze", "slate-pearl"]);
    for (const seed of seeds) {
      const look = journeyStyle({ slug: seed });
      expect(look.audience).toBe("general");
      expect(only).not.toContain(look.theme.name);
    }
  });
  it("lets a record pin past the register when it says so", () => {
    expect(journeyStyle({ slug: "x", storyStyle: { audience: "adults", theme: "night-lime", genre: "film-crew" } }).theme.name).toBe("night-lime");
    expect(SiteData.shape.storyStyle.safeParse({ audience: "adults" }).success).toBe(true);
    expect(SiteData.shape.storyStyle.safeParse({ audience: "toddlers" }).success).toBe(false);
  });
});

describe("PCO in the adult register", () => {
  const html = renderToStaticMarkup(<SiteRenderer site={pco} template={templates[pco.template]} />);
  it("is an adult look with no cast on stage", () => {
    expect(journeyStyle(pco).audience).toBe("adults");
    expect(html).toContain('data-audience="adults"');
    expect(html).not.toContain("data-cast=");
    expect(html).not.toContain("data-cast-quiet");
    // Reality first: no fantasy scenes and no story world behind an adult story, even when the record names a scene set.
    expect(pco.storyScenes).toBeDefined();
    expect(html).not.toContain("data-scenes");
  });
  it("keeps the guardrails and every chapter", () => {
    expect(html).toContain("Concept preview");
    expect(html.match(/data-journey-step/g)!.length).toBeGreaterThanOrEqual(8);
    expect(html).toContain("data-voice-button");
  });
});
