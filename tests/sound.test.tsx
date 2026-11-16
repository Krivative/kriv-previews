import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { journeyStyle, journeyThemes, lookAttributes, ratesLook, soundWorlds } from "@/stories/journey-style";
import { beatEffects, soundRoom } from "@/stories/story-sound";
import { dentalJourney } from "@/stories/dental-journey";
import { ratesJourney } from "@/stories/rates-journey";
import { SiteData } from "@/lib/site-schema";

const onDisk = (url: string) => existsSync(path.join(process.cwd(), "public", url.replace(/^\/for\//, "").replace(/\?.*$/, "")));

describe("story sound", () => {
  it("every seed resolves a known sound world, and the seed alone decides it", () => {
    for (let i = 0; i < 80; i++) {
      const a = journeyStyle({ slug: `lead-${i}` });
      expect(soundWorlds).toContain(a.sound);
      expect(journeyStyle({ slug: `lead-${i}` }).sound).toBe(a.sound);
    }
  });

  it("two looks in three hear their costume's room", () => {
    let same = 0;
    for (let i = 0; i < 300; i++) { const l = journeyStyle({ slug: `s${i}` }); if (l.sound === l.genre) same++; }
    expect(same / 300).toBeGreaterThan(0.55);
  });

  it("a pin wins, the schema knows the worlds, and the page carries data-sound", () => {
    for (const w of soundWorlds) expect(journeyStyle({ slug: "abc", storyStyle: { sound: w } }).sound).toBe(w);
    expect(SiteData.shape.storyStyle.safeParse({ sound: "ships-crew" }).success).toBe(true);
    expect(SiteData.shape.storyStyle.safeParse({ sound: "disco" }).success).toBe(false);
    expect(lookAttributes(journeyStyle({ slug: "abc", storyStyle: { sound: "pit-crew" } }))["data-sound"]).toBe("pit-crew");
  });

  it("the sound never changes the rest of the look", () => {
    const base = journeyStyle({ slug: "same-seed" });
    const pinned = journeyStyle({ slug: "same-seed", storyStyle: { sound: "kitchen-brigade" } });
    expect({ ...pinned, sound: base.sound }).toEqual(base);
    expect(journeyThemes.length).toBeGreaterThan(0);
  });

  it("the rates page keeps its own room", () => {
    expect(ratesLook().sound).toBe("plain");
    expect(soundRoom("plain", "rates").ambient).toContain("rates/ambient");
  });

  it("every room, sting and beat effect exists on disk", () => {
    for (const w of soundWorlds) for (const b of ["dental", "rates", "agency"] as const) {
      const r = soundRoom(w, b);
      expect(onDisk(r.ambient)).toBe(true);
      if (r.sting) expect(onDisk(r.sting)).toBe(true);
    }
    for (const map of Object.values(beatEffects)) for (const url of Object.values(map)) expect(onDisk(url)).toBe(true);
  });

  it("beat effects point at real chapters only", () => {
    const dentalIds = new Set([...dentalJourney.map((s) => s.id), "inside", "services", "about", "book", "visit", "social", "faq"]);
    for (const id of Object.keys(beatEffects.dental)) expect(dentalIds.has(id)).toBe(true);
    const ratesIds = new Set(ratesJourney.map((s) => s.id));
    for (const id of Object.keys(beatEffects.rates)) expect(ratesIds.has(id)).toBe(true);
  });
});
