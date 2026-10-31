// Admin for the Phase 5 lead database (Upstash Redis REST). Nothing here runs
// automatically; there is no account yet (Kriv chose code only on 2026-11-01).
//   node scripts/lead-db.mjs put <slug...> [--dry-run]   validate leads/<slug>.json and store it as lead:<slug>
//   node scripts/lead-db.mjs list                        slugs stored in the database
//   node scripts/lead-db.mjs del <slug>                  remove one record
// Needs UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_*). Never prints the token.
import { readFileSync } from "node:fs";
import { SiteData } from "../src/lib/site-schema.ts";

const [cmd, ...rest] = process.argv.slice(2);
const dryRun = rest.includes("--dry-run");
const slugs = rest.filter((a) => !a.startsWith("--"));
const url = (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "").replace(/\/+$/, "");
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

async function redis(command) {
  if (!url.startsWith("https://") || !token) throw new Error("Set UPSTASH_REDIS_REST_URL (https) and UPSTASH_REDIS_REST_TOKEN first.");
  const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(command) });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`Upstash ${command[0]} failed: ${body.error ?? res.status}`);
  return body.result;
}

if (cmd === "put" && slugs.length) {
  for (const slug of slugs) {
    const site = SiteData.parse(JSON.parse(readFileSync(new URL(`../leads/${slug}.json`, import.meta.url), "utf8")));
    if (site.slug !== slug) throw new Error(`leads/${slug}.json has slug "${site.slug}"`);
    if (dryRun) { console.log(`valid  ${slug} (${site.status}, expires ${site.expiresAt})`); continue; }
    await redis(["SET", `lead:${slug}`, JSON.stringify(site)]);
    console.log(`stored ${slug}`);
  }
} else if (cmd === "list") {
  console.log((await redis(["KEYS", "lead:*"])).map((k) => k.slice(5)).sort().join("\n") || "(none)");
} else if (cmd === "del" && slugs.length === 1) {
  console.log((await redis(["DEL", `lead:${slugs[0]}`])) ? `deleted ${slugs[0]}` : `${slugs[0]} was not stored`);
} else {
  console.error("Usage: node scripts/lead-db.mjs put <slug...> [--dry-run] | list | del <slug>");
  process.exit(1);
}
