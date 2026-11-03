import { describe, it, expect } from "vitest";
import { factChecks, coreName, phoneIn } from "../lead-desk/lib/auto-facts.mjs";

const record = (over: Record<string, unknown> = {}) => ({
  slug: "acme-roofing",
  business: { name: "Acme Roofing, LLC", category: "Roofing", phoneDisplay: "(512) 555-0199", phoneE164: "+15125550199", address: { city: "Austin", region: "TX" } },
  hero: { headline: "Roofs done right in Austin", sub: "Repairs and replacements since 1998." },
  services: [{ name: "Roof repair", blurb: "Leaks and storm damage." }],
  about: { title: "About", body: "A family roofing company." },
  seo: { title: "Acme Roofing · Concept preview", description: "Acme Roofing, LLC" },
  design: {},
  brand: { photos: ["https://images.unsplash.com/photo-1?w=1600"], photoCredits: [{ provider: "Unsplash", source: "https://unsplash.com/photos/1" }] },
  sources: ["https://acme.example/", "https://unsplash.com/photos/1"],
  ...over,
});
const pages = [{ url: "https://acme.example/", text: "Acme Roofing. Family owned, established 1998. Call 512-555-0199. Austin, TX.", html: "" }];
const mail = { subject: "A concept for Acme Roofing", body: "Hi,\n\nhttps://kriv.agency/acme-roofing", status: "draft" };
const failed = (res: Record<string, { pass: boolean }>) => Object.entries(res).filter(([, v]) => !v.pass).map(([k]) => k);

describe("automatic checks that replaced Kriv's hand ticks", () => {
  it("passes a sourced page once the design is approved", () => {
    expect(failed(factChecks({ record: record(), pages, mail, approved: true }))).toEqual([]);
  });
  it("leaves the look-based items to the design approval", () => {
    expect(failed(factChecks({ record: record(), pages, mail, approved: false }))).toEqual(["Stock photos only", "Looked at both screenshots"]);
  });
  it("catches invented claims, a wrong phone, placeholders and a missing link", () => {
    const bad = record({ business: { ...record().business, phoneE164: "+15125550100", phoneDisplay: "(512) 555-0100" }, hero: { headline: "Austin's best roofer, 5 stars", sub: "[Street address]" } });
    const res = factChecks({ record: bad, pages, mail: { ...mail, body: "Hi" }, approved: true });
    expect(failed(res)).toEqual(expect.arrayContaining(["Every fact on the page appears", "Nothing invented or implied", "Unknown means absent", "Business name and phone exactly", "Honest subject"]));
    expect(res["Nothing invented or implied"].why).toMatch(/best/);
  });
  it("flags a blocked stock photo", () => {
    expect(factChecks({ record: record(), pages, mail, approved: true, blocked: ["/photo-1"] })["Each photo is a generic scene"].pass).toBe(false);
  });
  it("reads names and phones the way businesses write them", () => {
    expect(coreName("Atlas Auto Glass, LLC")).toBe("atlas auto glass");
    expect(phoneIn("call (512) 506-0909 today", "+15125060909")).toBe(true);
    expect(phoneIn("call 512.506.09091", "+15125060909")).toBe(false);
  });
});
