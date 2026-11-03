// Preview photos (Kriv, 2026-11-03): the business's own photos first, then stock photos found
// with several searches about what the business does. A photo used on any other lead is never
// used again, and no page repeats a photo.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as unsplash from "./unsplash.mjs";

export const PHOTOS_PER_LEAD = 6;

/** A stable key for a photo URL: Unsplash's photo path, otherwise the URL without its query. */
export function photoKey(url) {
  try {
    const u = new URL(url);
    return u.hostname === "images.unsplash.com" ? u.pathname : `${u.hostname}${u.pathname}`;
  } catch { return String(url); }
}

/** Photo keys used by every lead file except `exceptSlug`. */
export function usedPhotoKeys(repo, exceptSlug = null) {
  const used = new Set();
  const dir = join(repo, "leads");
  if (!existsSync(dir)) return used;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".json") || f === `${exceptSlug}.json`) continue;
    try { for (const url of JSON.parse(readFileSync(join(dir, f), "utf8")).brand?.photos ?? []) used.add(photoKey(url)); } catch { /* unreadable lead files are checked elsewhere */ }
  }
  return used;
}

/** Photos that must never be used (another business's branding, wrong subject): kriv-leads/photo-blocklist.json. */
export function blockedPhotoKeys(leadsDir) {
  const file = join(leadsDir ?? "", "photo-blocklist.json");
  return leadsDir && existsSync(file) ? JSON.parse(readFileSync(file, "utf8")).map((x) => (x.startsWith("http") ? photoKey(x) : x)) : [];
}

/** Photos Kriv or Claude picked from the business's own site: kriv-leads/own-photos/<slug>.json. */
export function ownPhotos(leadsDir, slug) {
  const file = join(leadsDir, "own-photos", `${slug}.json`);
  if (!slug || !existsSync(file)) return [];
  const list = JSON.parse(readFileSync(file, "utf8")).photos ?? [];
  return list.filter((p) => p.url && p.source).map((p) => ({ url: p.url, credit: { provider: "Business", source: p.source } }));
}

// Search results are cached for two weeks so many leads of one kind cost a few searches only.
async function results(ctx, query, page, deps) {
  const dir = join(ctx.leadsDir, "photo-cache"); mkdirSync(dir, { recursive: true });
  const file = join(dir, `${query.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${page}.json`);
  if (existsSync(file)) {
    const cached = JSON.parse(readFileSync(file, "utf8"));
    if (Date.now() - Date.parse(cached.at) < 14 * 864e5) return cached.results;
  }
  const found = await (deps.search ?? unsplash.search)(ctx.repo, query, page);
  writeFileSync(file, JSON.stringify({ at: new Date().toISOString(), query, page, results: found.results }));
  return found.results;
}

/**
 * Up to `count` photos for a lead: own photos, then stock taken in turn from each query so
 * the set mixes subjects. Each stock photo gets Unsplash's download tracking when used.
 */
export async function choosePhotos(ctx, { slug, queries, count = PHOTOS_PER_LEAD }, deps = {}) {
  const used = deps.used ?? usedPhotoKeys(ctx.repo, slug);
  for (const key of blockedPhotoKeys(ctx.leadsDir)) used.add(key);
  const chosen = [];
  const take = (p) => { const key = photoKey(p.url); if (used.has(key) || chosen.some((c) => photoKey(c.url) === key)) return false; chosen.push(p); used.add(key); return true; };
  for (const p of ownPhotos(ctx.leadsDir, slug)) if (chosen.length < count) take(p);
  const pools = [];
  for (let page = 1; page <= 3 && chosen.length < count; page++) {
    for (const q of queries) pools.push((await results(ctx, q, page, deps)).filter((r) => !r.warn && r.raw && r.download));
    // Round-robin across queries: one photo per subject before a second from any.
    for (let i = 0; chosen.length < count && pools.some((pool) => pool.length); i = (i + 1) % pools.length) {
      const next = pools[i].shift();
      if (!next) continue;
      const key = photoKey(`${next.raw}&w=1600`);
      if (used.has(key)) continue;
      take(await (deps.track ?? unsplash.track)(ctx.repo, next));
    }
  }
  if (!chosen.length) throw new Error("No suitable credited photos found. Held for investigation.");
  return chosen;
}
