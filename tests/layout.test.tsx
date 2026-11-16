import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteData } from "@/lib/site-schema";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { templates } from "@/templates";
import {
  journeyBrands, journeyCards, journeyCues, journeyEntrances, journeyMaps, journeyMarks, journeyStyle, journeyThemes, journeyVoices, journeyWords,
  layoutPlaces, lookAttributes, ratesLook, resolveLayout,
} from "@/stories/journey-style";

const pco = JSON.parse(readFileSync(path.join(__dirname, "..", "leads", "pco-dental-clinic.json"), "utf8"));
const css = (name: string) => readFileSync(path.join(__dirname, "..", "src", "sections", name), "utf8");
const seeds = Array.from({ length: 60 }, (_, n) => `seed-${n}`);
const widths = ["phone", "tablet", "desktop"] as const;
const contrast = (a: string, b: string) => {
  const lum = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("layout choices from the seed", () => {
  it("gives every element its own place at phone, tablet and desktop width, for 60 seeds", () => {
    for (const seed of seeds) {
      const { layout } = journeyStyle({ slug: "x", storyStyle: { seed } });
      for (const width of widths) {
        const places = Object.values(layoutPlaces(layout, width));
        expect(new Set(places).size, `${seed} at ${width}: ${places.join(", ")}`).toBe(places.length);
      }
    }
  });
  it("holds for every possible combination, not only the sampled seeds", () => {
    let count = 0;
    for (const marks of journeyMarks) for (const brand of journeyBrands) for (const voice of journeyVoices) for (const cue of journeyCues)
      for (const words of journeyWords) for (const entrance of journeyEntrances) for (const side of ["left", "right"] as const) {
        const layout = resolveLayout({ marks, brand, voice, cue, words, entrance, side, map: "ring", cards: "glass" });
        const places = Object.values(layoutPlaces(layout, "desktop"));
        expect(new Set(places).size, places.join(", ")).toBe(places.length);
        // The rules the stylesheet relies on.
        expect(layout.marks === "top" && layout.brand === "top-centre").toBe(false);
        expect(layout.cue === "bottom-right" && layout.voice === "bottom-right").toBe(false);
        expect(layout.cue === "bottom-left" && (layout.voice === "bottom-left" || layout.brand === "bottom-left")).toBe(false);
        expect(layout.brand === "bottom-left" && layout.voice === "bottom-left").toBe(false);
        expect(layout.words === "centred" && layout.entrance === "under-words").toBe(false);
        count++;
      }
    expect(count).toBe(3 * 3 * 3 * 3 * 2 * 3 * 2);
  });
  it("uses the whole range across seeds", () => {
    const looks = seeds.map((seed) => journeyStyle({ slug: "x", storyStyle: { seed } }).layout);
    const seen = (key: keyof (typeof looks)[number]) => new Set(looks.map((l) => l[key])).size;
    expect([seen("marks"), seen("brand"), seen("voice"), seen("cue"), seen("words"), seen("map"), seen("cards"), seen("entrance")]).toEqual([3, 3, 3, 3, 2, 3, 3, 3]);
    expect(new Set(seeds.map((seed) => JSON.stringify(journeyStyle({ slug: "x", storyStyle: { seed } }).layout))).size).toBeGreaterThan(40);
  });
  it("is steady for a seed, and a pin always wins", () => {
    expect(journeyStyle({ slug: "abc" }).layout).toEqual(journeyStyle({ slug: "abc" }).layout);
    const pinned = journeyStyle({ slug: "abc", storyStyle: { marks: "top", brand: "top-centre", map: "zigzag", cards: "solid" } }).layout;
    expect([pinned.marks, pinned.brand, pinned.map, pinned.cards]).toEqual(["top", "top-left", "zigzag", "solid"]);
  });
  it("has a style rule for every choice", () => {
    const journey = css("journey.module.css"), cast = css("cast.module.css"), offer = css("offer.module.css");
    for (const rule of ['data-marks="rail-left"', 'data-marks="top"', 'data-brand="top-left"', 'data-brand="bottom-left"', 'data-voice="bottom-left"', 'data-voice="top-right"', 'data-cue="bottom-left"', 'data-cue="bottom-right"', 'data-words="centred"', 'data-side="left"']) expect(journey).toContain(rule);
    for (const rule of ['data-entrance="behind"', 'data-entrance="under-words"', 'data-words="centred"']) expect(cast).toContain(rule);
    for (const rule of ['data-cards="outlined"', 'data-cards="solid"']) expect(offer).toContain(rule);
    // The choices only take effect on wide screens: phones and tablets keep the one safe arrangement.
    const wide = journey.slice(journey.indexOf("@media (min-width: 900px)"));
    for (const rule of ['data-marks="top"', 'data-brand="bottom-left"', 'data-voice="top-right"', 'data-words="centred"']) expect(journey.slice(0, journey.indexOf("@media (min-width: 900px)"))).not.toContain(rule), expect(wide).toContain(rule);
    // Words centred under the drawing, and the cast under the words, also need a tall screen.
    expect(journey).toMatch(/@media \(min-width: 900px\) and \(min-height: 820px\) \{\s*\.root\[data-words="centred"\]/);
    expect(cast).toMatch(/@media \(min-width: 900px\) and \(min-height: 860px\) \{\s*\[data-entrance="under-words"\]/);
  });
  it("never scrolls sideways by construction: no fixed widths wider than a phone in the story styles", () => {
    for (const file of ["journey.module.css", "cast.module.css", "clinic-journey.module.css", "rates-journey.module.css"]) {
      const base = css(file).split("@media (min-width")[0];
      for (const match of base.matchAll(/(?:^|[;{\s])(?:min-)?width:\s*(\d+)px/g)) expect(Number(match[1]), `${file}: ${match[0]}`).toBeLessThanOrEqual(320);
    }
  });
});

describe("two stories never share a production", () => {
  it("keeps PCO on its pinned look, in full", () => {
    const look = journeyStyle(SiteData.parse(pco));
    expect(lookAttributes(look)).toMatchObject({ "data-theme-name": "porcelain-teal", "data-genre": "plain", "data-sound": "plain", "data-audience": "adults", "data-side": "right", "data-orbit": "none", "data-marks": "rail-right", "data-brand": "top-centre", "data-voice": "top-right", "data-cue": "bottom-centre", "data-words": "beside", "data-map": "ring", "data-cards": "outlined" });
  });
  it("gives the rates page a different theme and at least two different layout choices from PCO", () => {
    const a = lookAttributes(journeyStyle(SiteData.parse(pco))), b = lookAttributes(ratesLook());
    expect(b["data-theme-name"]).not.toBe(a["data-theme-name"]);
    const layoutKeys = ["data-side", "data-orbit", "data-marks", "data-brand", "data-voice", "data-cue", "data-words", "data-map", "data-cards", "data-entrance"] as const;
    expect(layoutKeys.filter((key) => a[key] !== b[key]).length).toBeGreaterThanOrEqual(2);
  });
  it("renders each map shape and card style without losing a stop or a guardrail", () => {
    for (const map of journeyMaps) for (const cards of journeyCards) {
      const site = SiteData.parse({ ...pco, storyStyle: { ...pco.storyStyle, map, cards } });
      const html = renderToStaticMarkup(<SiteRenderer site={site} template={templates[site.template]} />);
      expect(html).toContain(`data-map="${map}"`);
      expect(html).toContain(`data-cards="${cards}"`);
      expect(html.match(/data-journey-scene/g)?.length).toBe(7);
      expect(html).toContain("Concept preview prepared by KRIV for PCO Dental Clinic");
      // Every place on the map stays inside the drawing.
      for (const m of html.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="(\d+)"/g)) { const [x, y, r] = [Number(m[1]), Number(m[2]), Number(m[3])]; if (r >= 20 && r <= 30) { expect(x - r).toBeGreaterThanOrEqual(0); expect(x + r).toBeLessThanOrEqual(400); expect(y - r).toBeGreaterThanOrEqual(0); expect(y + r).toBeLessThanOrEqual(400); } }
    }
  });
});

describe("readable text in every theme, bubbles included", () => {
  it("keeps cast bubble text, quiet text and the accent readable on the panel colour", () => {
    for (const t of journeyThemes) {
      // A bubble is the theme's text colour on its panel colour, with the speaker's name in the accent.
      expect(contrast(t.ink, t.surface), `${t.name} bubble text`).toBeGreaterThan(7);
      expect(contrast(t.accent, t.surface), `${t.name} bubble name`).toBeGreaterThan(4.5);
      expect(contrast(t.muted, t.surface), `${t.name} quiet text on a panel`).toBeGreaterThan(4);
    }
  });
});
