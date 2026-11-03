import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { kindOf, chooseDesign } from "../lead-desk/lib/fit.mjs";
import { choosePhotos, photoKey, usedPhotoKeys } from "../lead-desk/lib/photos.mjs";
import { templateList } from "../src/templates";

describe("designs that fit the business", () => {
  it("recognises kinds a broad niche hides", () => {
    expect(kindOf({ name: "Atlas Auto Glass, LLC", niche: "auto" }).id).toBe("autoglass");
    expect(kindOf({ name: "Getaway Brewing Co.", niche: "restaurant" }).id).toBe("brewery");
    expect(kindOf({ name: "Amacon Construction Limited", niche: "homeservices" }).id).toBe("construction");
    expect(kindOf({ name: "National RV Siding Ltd.", niche: "homeservices" }).id).toBe("rv");
    expect(kindOf({ name: "Golden Zone Cleaning", niche: "cleaning" }, "We clean houses, apartments and condos.").id).toBe("homecleaning");
    expect(kindOf({ name: "Spark Janitorial", niche: "cleaning" }, "Office cleaning.").id).toBe("cleaning");
    expect(kindOf({ name: "Golden Zone", niche: "homeservices" }, "Residential cleaning for condos.").id).toBe("homecleaning");
    expect(kindOf({ name: "Reed Service Company", niche: "hvac" }, "We build great teams").id).toBe("hvac");
  });

  it("never picks a design from another industry and spreads use across the fitting ones", () => {
    const kind = kindOf({ name: "Sunset Automotive", niche: "auto" });
    const first = chooseDesign(kind, templateList, { usage: {} });
    expect(kind.designs).toContain(first);
    const next = chooseDesign(kind, templateList, { usage: { [first!]: 3 } });
    expect(next).not.toBe(first);
    expect(chooseDesign(kind, templateList, { usage: {}, avoid: first })).not.toBe(first);
    const bold = chooseDesign(kind, templateList, { look: "bold" });
    expect(templateList.find((t) => t.id === bold)?.look).toBe("bold");
  });
});

describe("preview photos", () => {
  const result = (id: string) => ({ id, raw: `https://images.unsplash.com/photo-${id}?ixid=x`, download: `https://api.unsplash.com/photos/${id}/download`, thumb: "", credit: { provider: "Unsplash", photographer: "P", profileUrl: "https://unsplash.com/@p", photoPage: `https://unsplash.com/photos/${id}` }, warn: "" });
  const setup = () => {
    const repo = mkdtempSync(join(tmpdir(), "kriv-photos-")); const leadsDir = mkdtempSync(join(tmpdir(), "kriv-leads-"));
    mkdirSync(join(repo, "leads"));
    return { repo, leadsDir };
  };
  const deps = (pools: Record<string, string[]>, tracked: string[]) => ({
    search: async (_repo: string, query: string, page: number) => ({ results: page === 1 ? (pools[query] ?? []).map(result) : [] }),
    track: async (_repo: string, r: ReturnType<typeof result>) => { tracked.push(r.id); return { id: r.id, url: `${r.raw}&w=1600&q=80&fm=jpg&fit=max`, credit: r.credit }; },
  });

  it("puts the business's own photos first, mixes subjects and never repeats a photo", async () => {
    const ctx = setup();
    mkdirSync(join(ctx.leadsDir, "own-photos"));
    writeFileSync(join(ctx.leadsDir, "own-photos", "acme.json"), JSON.stringify({ photos: [{ url: "https://acme.example/van.jpg", source: "https://acme.example/" }] }));
    const tracked: string[] = [];
    const photos = await choosePhotos(ctx, { slug: "acme", queries: ["a", "b"], count: 4 }, deps({ a: ["a1", "a2", "a3"], b: ["b1", "b1", "b2"] }, tracked));
    expect(photos[0].credit).toEqual({ provider: "Business", source: "https://acme.example/" });
    expect(tracked).toEqual(["a1", "b1", "a2"]);
    expect(new Set(photos.map((p) => photoKey(p.url))).size).toBe(4);
  });

  it("skips photos another lead already uses", async () => {
    const ctx = setup();
    writeFileSync(join(ctx.repo, "leads", "other.json"), JSON.stringify({ brand: { photos: ["https://images.unsplash.com/photo-a1?ixid=y&w=1600"] } }));
    expect(usedPhotoKeys(ctx.repo).has("/photo-a1")).toBe(true);
    const tracked: string[] = [];
    await choosePhotos(ctx, { slug: "acme", queries: ["a"], count: 2 }, deps({ a: ["a1", "a2", "a3"] }, tracked));
    expect(tracked).toEqual(["a2", "a3"]);
  });
});
