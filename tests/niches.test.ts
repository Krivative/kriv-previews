import { describe, expect, it } from "vitest";
import { NICHE_LIST, NICHE_IDS, NICHES, LEGACY_NICHES, nicheOf } from "../lead-desk/public/niches.js";
import { HOTFROG_CATS } from "../scripts/finder/sources.mjs";
import { isExcluded } from "../scripts/finder/rules.mjs";
import { NICHE_INFO, contentNicheFor } from "../lead-desk/lib/builder.mjs";
import { dailyEmailLimit } from "../lead-desk/lib/compose.mjs";
import { templateList } from "../src/templates";

describe("business types (Kriv, 2026-11-01)", () => {
  it("keeps the original six ids and gives every type complete wording and real designs", () => {
    for (const id of LEGACY_NICHES) expect(NICHE_IDS).toContain(id);
    expect(new Set(NICHE_IDS).size).toBe(NICHE_IDS.length);
    const ids = new Set(templateList.map((t) => t.id));
    for (const n of NICHE_LIST) {
      for (const key of ["label", "plural", "category", "noun", "photo"] as const) expect(n[key], `${n.id}.${key}`).toBeTruthy();
      expect(n.templates.length).toBeGreaterThan(0);
      for (const t of n.templates) expect(ids, `${n.id}: ${t}`).toContain(t);
      expect(HOTFROG_CATS[n.id]).toEqual(n.hotfrog);
      expect(NICHE_INFO[n.id].category).toBe(n.category);
      expect(NICHES[n.id]).toBe(n.label);
    }
  });

  it.each([
    ["Heating & Air Conditioning", "hvac"], ["Dentists", "dental"], ["Plumbing Contractors", "plumbing"],
    ["Pool & Spa Services", "pool"], ["Nail Salons & Spa", "salon"], ["Barber Shops", "salon"], ["Day Spas", "medspa"],
    ["Roofing Contractors", "roofing"], ["Electrical Contractors", "electrical"], ["Lawn Care & Landscaping", "landscaping"],
    ["Pest Control", "pest"], ["Janitorial & Cleaning Services", "cleaning"], ["Painting Contractors", "painting"],
    ["Garage Doors", "homeservices"], ["Physical Therapy", "clinic"], ["Fitness Centers", "fitness"], ["Veterinarians", "pets"],
    ["Restaurants", "restaurant"], ["Coffee Shops", "cafe"], ["Attorneys", "legal"], ["Accounting & Tax Services", "accounting"],
    ["Auto Body & Collision", "auto"],
  ])("files the directory category %s under %s", (category, id) => {
    expect(nicheOf(category)).toBe(id);
  });

  it.each(["Banks", "Churches", "Real Estate", "Insurance Agents", "Splash Pads"])("leaves %s out", (category) => {
    expect(nicheOf(category)).toBeUndefined();
  });

  it("maps page wording to an existing guide and falls back to general", () => {
    expect(contentNicheFor("medspa")).toBe("aesthetic");
    expect(contentNicheFor("salon")).toBe("salon");
    expect(contentNicheFor("legal")).toBe("office");
    expect(contentNicheFor("roofing")).toBe("general");
  });

  it.each(["Servpro of Ocala", "Terminix", "Planet Fitness", "Great Clips", "Starbucks", "H&R Block", "Two Men and a Truck"])("skips the chain %s", (name) => {
    expect(isExcluded(name)).toBe(true);
  });

  it.each(["Ocala Roofing Co", "Sunshine Lawn Care", "Sonics Cleaning", "Evca Accounting"])("keeps the independent business %s", (name) => {
    // Word boundaries keep short chain names (VCA, Sonic) from matching inside other names.
    expect(isExcluded(name)).toBe(false);
  });
});

describe("sending ramp", () => {
  it("allows 20 a day for the first two weeks, then 30", () => {
    expect(dailyEmailLimit("2026-11-01")).toBe(20);
    expect(dailyEmailLimit("2026-11-08")).toBe(20);
    expect(dailyEmailLimit("2026-11-09")).toBe(30);
    expect(dailyEmailLimit("2027-01-01")).toBe(30);
  });
});
