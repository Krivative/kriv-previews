import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { defaultExpiry, getLead, isExpired } from "@/lib/leads";
import type { LeadStore } from "@/lib/lead-store";
import { SiteData } from "@/lib/site-schema";
import { templates } from "@/templates";

const dir = path.join(__dirname, "..", "leads");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
const testLead = JSON.parse(readFileSync(path.join(dir, "test-lead.json"), "utf8"));

function memoryStore(records: Record<string, unknown>): LeadStore {
  return { get: async (slug) => records[slug] ?? null };
}

describe("lead files", () => {
  it.each(files)("%s is a valid lead", (file) => {
    const site = SiteData.parse(JSON.parse(readFileSync(path.join(dir, file), "utf8")));
    expect(site.slug).toBe(file.replace(/\.json$/, ""));
    expect(templates[site.template]).toBeDefined();
    expect(site.sources.length).toBeGreaterThan(0);
  });
});

describe("schema", () => {
  it("requires sources", () => {
    expect(() => SiteData.parse({ ...testLead, sources: [] })).toThrow();
    const withoutSources = { ...testLead };
    delete withoutSources.sources;
    expect(() => SiteData.parse(withoutSources)).toThrow();
  });

  it("requires expiresAt on or after createdAt", () => {
    expect(() => SiteData.parse({ ...testLead, createdAt: "2026-10-24", expiresAt: "2026-10-23" })).toThrow();
  });

  it("requires an ISO country code", () => {
    const business = { ...testLead.business, address: { ...testLead.business.address, country: "USA" } };
    expect(() => SiteData.parse({ ...testLead, business })).toThrow();
  });
});

describe("getLead", () => {
  const today = "2026-10-24";
  const store = memoryStore({
    "test-lead": testLead,
    draft: { ...testLead, slug: "draft", status: "draft" },
    "ends-today": { ...testLead, slug: "ends-today", expiresAt: today },
    "ended-yesterday": { ...testLead, slug: "ended-yesterday", createdAt: "2026-09-01", expiresAt: "2026-10-23" },
    "marked-expired": { ...testLead, slug: "marked-expired", status: "expired" },
    "wrong-slug": { ...testLead, slug: "other" },
    broken: { ...testLead, slug: "broken", sources: [] },
    "bad-template": { ...testLead, slug: "bad-template", template: "nope" },
  });
  const get = (slug: string, allowDrafts = false) => getLead(slug, { store, today, allowDrafts });

  it("returns a live lead", async () => {
    const lead = await get("test-lead");
    expect(lead?.kind).toBe("live");
  });

  it("returns null for unknown and malformed slugs", async () => {
    for (const slug of ["missing", "", "../package", "..%2Fpackage", "Test-Lead", "a/b", "-x", "x-", "a".repeat(81)]) {
      expect(await get(slug)).toBeNull();
    }
  });

  it("hides drafts unless allowed", async () => {
    expect(await get("draft")).toBeNull();
    expect((await get("draft", true))?.kind).toBe("live");
  });

  it("serves through the last day and expires after it", async () => {
    expect((await get("ends-today"))?.kind).toBe("live");
    expect(await get("ended-yesterday")).toEqual({ kind: "expired" });
    expect(await get("marked-expired")).toEqual({ kind: "expired" });
  });

  it("throws on broken records instead of hiding them", async () => {
    await expect(get("wrong-slug")).rejects.toThrow();
    await expect(get("broken")).rejects.toThrow();
    await expect(get("bad-template")).rejects.toThrow();
  });

  it("reads leads/ with the default JSON store", async () => {
    expect((await getLead("test-lead", { today }))?.kind).toBe("live");
    expect(await getLead("does-not-exist", { today })).toBeNull();
  });
});

describe("expiry helpers", () => {
  it("defaults to 30 days", () => {
    expect(defaultExpiry("2026-10-24")).toBe("2026-11-23");
    expect(defaultExpiry("2026-12-15")).toBe("2027-01-14");
  });

  it("compares dates as UTC days", () => {
    expect(isExpired({ status: "sent", expiresAt: "2026-11-23" }, "2026-11-23")).toBe(false);
    expect(isExpired({ status: "sent", expiresAt: "2026-11-23" }, "2026-11-24")).toBe(true);
  });
});
