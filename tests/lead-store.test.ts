import { describe, it, expect } from "vitest";
import { defaultLeadStore, layeredLeadStore, upstashLeadStore, type LeadStore } from "../src/lib/lead-store";

const memory = (records: Record<string, unknown>): LeadStore => ({ get: async (slug) => records[slug] ?? null });
function fakeUpstash(data: Record<string, string>, status = 200) {
  const calls: { url: string; auth: string | null }[] = [];
  const fetcher = (async (url: string, init?: RequestInit) => {
    calls.push({ url, auth: new Headers(init?.headers).get("authorization") });
    const key = decodeURIComponent(url.split("/get/")[1]);
    return new Response(JSON.stringify({ result: data[key] ?? null }), { status });
  }) as typeof fetch;
  return { fetcher, calls };
}

describe("Upstash lead store (Phase 5 adapter)", () => {
  it("reads lead:<slug> with the bearer token and parses the record", async () => {
    const { fetcher, calls } = fakeUpstash({ "lead:happy-hvac": JSON.stringify({ slug: "happy-hvac" }) });
    const store = upstashLeadStore({ url: "https://example.upstash.io/", token: "t0k", fetch: fetcher });
    expect(await store.get("happy-hvac")).toEqual({ slug: "happy-hvac" });
    expect(await store.get("missing")).toBeNull();
    expect(calls[0]).toEqual({ url: "https://example.upstash.io/get/lead%3Ahappy-hvac", auth: "Bearer t0k" });
  });
  it("fails loudly on errors and refuses plain http", async () => {
    const { fetcher } = fakeUpstash({}, 500);
    await expect(upstashLeadStore({ url: "https://x.upstash.io", token: "t", fetch: fetcher }).get("a")).rejects.toThrow(/HTTP 500/);
    expect(() => upstashLeadStore({ url: "http://x.upstash.io", token: "t" })).toThrow(/https/);
  });
  it("keeps committed JSON first and uses the database only for missing records", async () => {
    const store = layeredLeadStore([memory({ a: { from: "json" } }), memory({ a: { from: "db" }, b: { from: "db" } })]);
    expect(await store.get("a")).toEqual({ from: "json" });
    expect(await store.get("b")).toEqual({ from: "db" });
    expect(await store.get("c")).toBeNull();
  });
  it("stays on JSON files unless LEAD_STORE=upstash with credentials", async () => {
    const { fetcher, calls } = fakeUpstash({ "lead:db-only": JSON.stringify({ slug: "db-only" }) });
    expect(await defaultLeadStore({}, fetcher).get("db-only")).toBeNull();
    expect(calls).toHaveLength(0);
    expect(() => defaultLeadStore({ LEAD_STORE: "upstash" }, fetcher)).toThrow(/UPSTASH_REDIS_REST_URL/);
    const db = defaultLeadStore({ LEAD_STORE: "upstash", KV_REST_API_URL: "https://kv.upstash.io", KV_REST_API_TOKEN: "t" }, fetcher);
    expect(await db.get("db-only")).toEqual({ slug: "db-only" });
    expect(((await db.get("test-lead")) as { slug: string }).slug).toBe("test-lead");
  });
});
