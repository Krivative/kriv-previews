import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../lead-desk/lib/db.mjs";
import { fetchPage, prefill, serviceSuggestions } from "../lead-desk/lib/builder.mjs";
import { buildRoutes } from "../lead-desk/lib/build-api.mjs";
import { upsertLead } from "../lead-desk/lib/leads.mjs";
import { get } from "../scripts/finder/sources.mjs";

vi.mock("../scripts/finder/sources.mjs", async (importOriginal) => ({
  ...await importOriginal<typeof import("../scripts/finder/sources.mjs")>(),
  get: vi.fn(),
}));

const SITE = "https://acme.example/";
const fetched = vi.mocked(get);
const page = (url: string, html: string, status = 200) => ({ url, html, text: "Acme", status, blocked: status !== 200 });

describe("build sources: freshness", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-26T12:00:00.000Z"));
    fetched.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("reuses today's successful read but refreshes it on request and after UTC midnight", async () => {
    const db = openDb(":memory:");
    fetched.mockResolvedValue({ status: 200, html: "<p>Original</p>" });
    const original = await fetchPage(db, SITE);
    expect(original.fetched_at).toBe("2026-10-26T12:00:00.000Z");
    expect((await fetchPage(db, SITE)).text).toBe("Original");
    expect(fetched).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2026-10-26T13:00:00.000Z"));
    fetched.mockResolvedValue({ status: 200, html: "<p>Changed</p>" });
    expect(await fetchPage(db, SITE, { refresh: true })).toMatchObject({ text: "Changed", fetched_at: "2026-10-26T13:00:00.000Z" });
    vi.setSystemTime(new Date("2026-10-27T00:00:00.000Z"));
    await fetchPage(db, SITE);
    expect(fetched).toHaveBeenCalledTimes(3);
    db.close();
  });

  it("reports a blocked reread instead of presenting an older success as fresh", async () => {
    const db = openDb(":memory:");
    fetched.mockResolvedValueOnce({ status: 200, html: "<p>Old fact</p>" });
    await fetchPage(db, SITE);
    fetched.mockResolvedValueOnce({ status: 403, html: "" });
    const result = await fetchPage(db, SITE, { refresh: true });
    expect(result).toMatchObject({ status: 403, text: "", fetched_at: "2026-10-26T12:00:00.000Z" });
    expect(db.prepare("SELECT status, text FROM pages WHERE url = ?").get(SITE)).toMatchObject({ status: 403, text: "" });
    db.close();
  });

  it.each(["not-a-date", "2026-10-26T13:00:00.000Z"])("does not trust a cache timestamp of %s", async (timestamp) => {
    const db = openDb(":memory:");
    db.prepare("INSERT INTO pages (url, status, html, text, fetched_at) VALUES (?, 200, '<p>Old</p>', 'Old', ?)").run(SITE, timestamp);
    fetched.mockResolvedValue({ status: 200, html: "<p>New</p>" });
    expect((await fetchPage(db, SITE)).text).toBe("New");
    expect(fetched).toHaveBeenCalledTimes(1);
    db.close();
  });

  it("refreshes every discovered source through the prefill route and returns read timestamps", async () => {
    const db = openDb(":memory:");
    const repo = mkdtempSync(join(tmpdir(), "build-sources-"));
    mkdirSync(join(repo, "src", "templates"), { recursive: true });
    writeFileSync(join(repo, "src", "templates", "hvac-calm.ts"), 'id: "hvac-calm", name: "Breeze"');
    const id = upsertLead(db, { name: "Acme", website: SITE, town: "Ocala", state: "FL", niche: "hvac" });
    const listing = "https://directory.example/acme";
    db.prepare("INSERT INTO sources (lead_id, field, url) VALUES (?, 'listing', ?)").run(id, listing);
    const html = '<a href="/services">Services</a><a href="/contact">Contact</a>';
    fetched.mockImplementation(async (url: string) => ({ status: 200, html: url === SITE ? html : "<p>Fresh source</p>" }));
    const urls = [SITE, `${SITE}services`, `${SITE}contact`, listing];
    for (const url of urls) db.prepare("INSERT INTO pages (url, status, html, text, fetched_at) VALUES (?, 200, ?, 'Cached', '2026-10-26T11:00:00.000Z')").run(url, html);
    const route = buildRoutes.find(([method, pattern]) => method === "POST" && (pattern as RegExp).test(`/api/build/${id}/prefill`))!;
    const run = route[2] as (ctx: object) => Promise<{ pages: { url: string; text: string; fetched_at: string }[] }>;
    const result = await run({ db, repo, params: { id }, body: { refresh: true } });
    expect(fetched.mock.calls.map(([url]) => url).sort()).toEqual(urls.sort());
    expect(result.pages).toHaveLength(4);
    expect(result.pages.every((p) => p.fetched_at === "2026-10-26T12:00:00.000Z" && p.text !== "Cached")).toBe(true);
    expect(db.prepare("SELECT status FROM leads WHERE id = ?").get(id)).toMatchObject({ status: "found" });
    db.close();
  });
});

describe("build sources: service suggestions", () => {
  it("ignores arbitrary homepage headings, navigation, listings and blocked pages", () => {
    expect(serviceSuggestions([
      page(SITE, "<h2>Friendly local experts</h2><li>Payment plans</li>"),
      page("https://directory.example/acme/services", "<h2>AC repair</h2>"),
      page(`${SITE}services`, "<h2>Heating repair</h2>", 403),
    ], SITE)).toEqual([]);
  });

  it("keeps source wording from labeled service sections and stops at the next peer heading", () => {
    const html = '<nav><h2>Services</h2><li>Online payments</li></nav><h2>Our services</h2><h3>AC repair</h3><h3>ac repair</h3><h3>Heat pump installation</h3><h2>Meet our team</h2><li>Jane Smith</li>';
    expect(serviceSuggestions([page(SITE, html)], SITE)).toEqual([
      { name: "AC repair", blurb: "", s: SITE },
      { name: "Heat pump installation", blurb: "", s: SITE },
    ]);
  });

  it("reads explicit service pages but does not promote suggestions into the hero or invent services", () => {
    const url = `${SITE}services`;
    const pages = [page(url, "<header><h2>Pay your bill</h2></header><h2>Our services</h2><h3>AC repair</h3><footer><li>Our partners</li></footer>")];
    const form = prefill({ name: "Acme", town: "Ocala", state: "FL", niche: "hvac", website: SITE }, pages, [{ id: "hvac-calm" }]);
    expect(form.lists.services).toEqual([{ name: "AC repair", blurb: "", s: url }]);
    expect(form.f).not.toHaveProperty("sub");
    expect(serviceSuggestions(pages, undefined)).toEqual([]);
  });
});
