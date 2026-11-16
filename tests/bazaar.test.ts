import { describe, expect, it } from "vitest";
import { allBazaars, stallKinds, worldBazaars, worldFor, worldNames, journeyWorlds, genreBazaars } from "@/stories/bazaar";
import { journeyGenres, journeyStyle, lookAttributes, ratesLook } from "@/stories/journey-style";
import { SiteData } from "@/lib/site-schema";

describe("the bazaar in every world", () => {
  it("every world has its own bazaar, and every bazaar has all five stalls with names", () => {
    for (const w of worldNames) expect(worldBazaars[w]).toBeTruthy();
    for (const b of allBazaars) {
      expect(Object.keys(b.stalls).sort()).toEqual([...stallKinds].sort());
      for (const k of stallKinds) expect(b.stalls[k].length).toBeGreaterThan(3);
    }
    expect(new Set(allBazaars.map((b) => b.name)).size).toBe(allBazaars.length);
  });

  it("every costume has a market of its own", () => {
    for (const g of journeyGenres.filter((g) => g !== "plain")) expect(genreBazaars.some((b) => b.fits === g)).toBe(true);
  });

  it("the niche picks the world, and a dental clinic gets a dentist chibi", () => {
    expect(worldFor("dental")).toBe("smile-kingdom");
    expect(worldFor("bakery")).toBe("merchants-road");
    expect(journeyStyle({ slug: "x", contentNiche: "dental" }).chibi).toBe("dentist");
    expect(journeyWorlds["smile-kingdom"].chibi).toBe("dentist");
  });

  it("the seed alone decides the bazaar, it fits the world or the costume, and a pin wins", () => {
    for (let i = 0; i < 120; i++) {
      const a = journeyStyle({ slug: `lead-${i}`, contentNiche: "dental" });
      expect(journeyStyle({ slug: `lead-${i}`, contentNiche: "dental" }).bazaar).toEqual(a.bazaar);
      expect(a.bazaar.fits === "world" ? a.bazaar === worldBazaars[a.world] : a.bazaar.fits === a.genre).toBe(true);
    }
    for (const b of allBazaars) expect(journeyStyle({ slug: "abc", storyStyle: { bazaar: b.name } }).bazaar.name).toBe(b.name);
    expect(SiteData.shape.storyStyle.safeParse({ bazaar: "harbour-market", world: "smile-kingdom" }).success).toBe(true);
    expect(SiteData.shape.storyStyle.safeParse({ bazaar: "mall" }).success).toBe(false);
  });

  it("the page carries the world and bazaar, and the rates page walks the Road Bazaar", () => {
    const look = journeyStyle({ slug: "abc", contentNiche: "dental", storyStyle: { bazaar: "pearl-market" } });
    expect(lookAttributes(look)["data-bazaar"]).toBe("pearl-market");
    expect(ratesLook().world).toBe("merchants-road");
  });
});
