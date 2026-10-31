import { readFile } from "node:fs/promises";
import path from "node:path";

// Where lead records live. The MVP adapter reads leads/<slug>.json; a database
// adapter (Phase 5, below) implements the same interface. Callers validate the slug first.
export interface LeadStore {
  /** The raw record for `slug`, or null when there is none. */
  get(slug: string): Promise<unknown | null>;
}

export function jsonLeadStore(dir = path.join(process.cwd(), "leads")): LeadStore {
  return {
    async get(slug) {
      try {
        return JSON.parse(await readFile(path.join(dir, `${slug}.json`), "utf8"));
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw err;
      }
    },
  };
}

type Fetch = typeof fetch;

/**
 * Upstash Redis over its REST API (Phase 5). Records are JSON strings at
 * `lead:<slug>`. No SDK: one GET per request, never cached, 3-second timeout.
 * Errors throw so a database outage is loud instead of looking like a 404.
 */
export function upstashLeadStore(opts: { url: string; token: string; fetch?: Fetch; timeoutMs?: number }): LeadStore {
  const base = opts.url.replace(/\/+$/, "");
  if (!base.startsWith("https://")) throw new Error("Upstash REST URL must use https");
  const doFetch = opts.fetch ?? fetch;
  return {
    async get(slug) {
      const res = await doFetch(`${base}/get/${encodeURIComponent(`lead:${slug}`)}`, {
        headers: { Authorization: `Bearer ${opts.token}` }, cache: "no-store", signal: AbortSignal.timeout(opts.timeoutMs ?? 3000),
      });
      if (!res.ok) throw new Error(`Upstash lead lookup failed with HTTP ${res.status}`);
      const body = (await res.json()) as { result?: string | null; error?: string };
      if (body.error) throw new Error(`Upstash lead lookup failed: ${body.error}`);
      return body.result == null ? null : JSON.parse(body.result);
    },
  };
}

/** Tries each store in order and returns the first record found. */
export function layeredLeadStore(stores: LeadStore[]): LeadStore {
  return {
    async get(slug) {
      for (const store of stores) {
        const record = await store.get(slug);
        if (record !== null) return record;
      }
      return null;
    },
  };
}

/**
 * The store for this deployment. Committed JSON files always come first, so
 * existing pages never change. With LEAD_STORE=upstash and the REST URL/token
 * (Upstash's own names or the Vercel KV integration names), records missing
 * from leads/ are read from the database, so new leads need no deploy.
 */
export function defaultLeadStore(env: Record<string, string | undefined> = process.env, doFetch?: Fetch): LeadStore {
  const json = jsonLeadStore();
  if (env.LEAD_STORE !== "upstash") return json;
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("LEAD_STORE=upstash needs UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
  return layeredLeadStore([json, upstashLeadStore({ url, token, fetch: doFetch })]);
}
