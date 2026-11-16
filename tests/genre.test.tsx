import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteData } from "@/lib/site-schema";
import { buildCast, castRoles } from "@/stories/casts";
import { dentalCast } from "@/stories/casts/dental";
import { genres } from "@/stories/casts/genres";
import { ratesCast } from "@/stories/casts/rates";
import { dentalJourney } from "@/stories/dental-journey";
import { journeyGenres, journeyStyle, loreNames, lorePartners, loreUnits, lookAttributes, ratesLook } from "@/stories/journey-style";
import { ratesJourney } from "@/stories/rates-journey";

// The costume layer: a genre changes each character's title, one small prop and
// the usher's wording. It never changes a line, a fact or the story itself.

const ids = dentalJourney.map((s) => s.id);
const costumes = journeyGenres.filter((g) => g !== "plain") as Exclude<(typeof journeyGenres)[number], "plain">[];
const seeds = Array.from({ length: 60 }, (_, i) => `seed-${i}`);
const pco = SiteData.parse(JSON.parse(readFileSync(path.join(process.cwd(), "leads", "pco-dental-clinic.json"), "utf8")).site ?? JSON.parse(readFileSync(path.join(process.cwd(), "leads", "pco-dental-clinic.json"), "utf8")));

describe("genres: the data", () => {
  it("has the four genres, each with a title, a prop and wording for every role", () => {
    expect(costumes).toEqual(["film-crew", "ships-crew", "kitchen-brigade", "pit-crew"]);
    for (const g of costumes) {
      for (const role of castRoles) {
        expect(genres[g].titles[role].length).toBeGreaterThan(2);
        const prop = renderToStaticMarkup(<>{genres[g].props[role]}</>);
        expect(prop).toContain("data-cast-prop");
        expect(prop).toContain('aria-hidden="true"');
        // Theme colours only: no fixed colours, no image files.
        expect(prop).not.toMatch(/#[0-9a-f]{3,6}|<image|href=/i);
      }
      const titles = Object.values(genres[g].titles);
      expect(new Set(titles).size).toBe(4);
    }
  });
  it("words the usher's notices with the story's own unit, and makes no claim", () => {
    for (const g of costumes) for (const lore of loreNames) {
      const w = genres[g].words(loreUnits[lore]);
      for (const text of [w.playing, w.forward, w.next]) {
        expect(text).toContain(loreUnits[lore]);
        expect(text.length).toBeLessThan(90);
        expect(text).not.toMatch(/\d|PHP|\bfree\b|guarantee|best|teeth|your (business|clinic)/i);
      }
    }
  });
});

describe("genres: chosen by the seed, tied to the chapter naming", () => {
  it("gives every seed a costume, and never 'plain' unless pinned", () => {
    for (const seed of seeds) expect(costumes).toContain(journeyStyle({ slug: seed }).genre);
    expect(journeyStyle({ slug: "x", storyStyle: { genre: "plain" } }).genre).toBe("plain");
  });
  it("uses every genre across the seeds, and mostly the one that suits the naming", () => {
    const looks = seeds.map((seed) => journeyStyle({ slug: seed }));
    expect(new Set(looks.map((l) => l.genre)).size).toBe(4);
    const matched = looks.filter((l) => l.genre === lorePartners[l.lore]).length;
    expect(matched).toBeGreaterThan(seeds.length / 2);
    expect(matched).toBeLessThan(seeds.length);
    expect(lorePartners.scenes).toBe("film-crew");
  });
  it("is stable for a seed and can be pinned", () => {
    expect(journeyStyle({ slug: "abc" }).genre).toBe(journeyStyle({ slug: "abc" }).genre);
    for (const g of journeyGenres) expect(journeyStyle({ slug: "abc", storyStyle: { genre: g } }).genre).toBe(g);
    expect(lookAttributes(journeyStyle({ slug: "abc", storyStyle: { genre: "pit-crew" } }))["data-genre"]).toBe("pit-crew");
    expect(SiteData.shape.storyStyle.safeParse({ genre: "film-crew" }).success).toBe(true);
    expect(SiteData.shape.storyStyle.safeParse({ genre: "space-opera" }).success).toBe(false);
  });
});

describe("genres: dressing a cast", () => {
  it("changes names, props and the usher's wording, and not one line", () => {
    const plain = buildCast(dentalCast, ids, "full", "s1")!;
    for (const g of costumes) {
      const dressed = buildCast(dentalCast, ids, "full", "s1", { genre: g, lore: "scenes" })!;
      expect(dressed.beats.map((b) => b?.text)).toEqual(plain.beats.map((b) => b?.text));
      expect(dressed.beats.map((b) => b?.role)).toEqual(plain.beats.map((b) => b?.role));
      expect(dressed.end).toBe(plain.end);
      dressed.beats.forEach((b, n) => { if (b) expect(b.name).toBe(`${plain.beats[n]!.name}, ${genres[g].titles[b.role]}`); });
      expect(dressed.tease!.name).toContain(genres[g].titles.heckler);
      expect(dressed.words!.next).toContain("scene");
      for (const role of castRoles) {
        const html = renderToStaticMarkup(<>{dressed.art[role]}</>);
        expect(html.match(/data-cast-prop/g)).toHaveLength(1);
        expect(html).toContain("data-cast-art");
      }
    }
  });
  it("leaves a plain cast exactly as it was", () => {
    const before = buildCast(ratesCast, ratesJourney.map((s) => s.id), "full", "ph-rates")!;
    const after = buildCast(ratesCast, ratesJourney.map((s) => s.id), "full", "ph-rates", { genre: "plain", lore: "stops" })!;
    expect(after.words).toBeUndefined();
    expect(after.beats).toEqual(before.beats);
    expect(renderToStaticMarkup(<>{after.art.guide}</>)).not.toContain("data-cast-prop");
  });
  it("keeps PCO and the rates page in their pinned, plain look", () => {
    expect(journeyStyle(pco).genre).toBe("plain");
    expect(ratesLook().genre).toBe("plain");
  });
});
