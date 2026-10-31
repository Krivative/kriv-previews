// Unsplash for preview photos, following its API guidelines (docs/PREVIEW-IMAGES.md): hotlink the
// URLs the API returns, call download_location when a photo is used, credit photographer and
// Unsplash with UTM links (the preview footer does that from brand.photoCredits).
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

let remaining = null;
export const rateLeft = () => remaining;

export function unsplashKey(repo) {
  const fromFile = (f) => (existsSync(f) ? readFileSync(f, "utf8").match(/^UNSPLASH_ACCESS_KEY=(.+)$/m)?.[1].trim() : undefined);
  return process.env.UNSPLASH_ACCESS_KEY ?? [join(repo, ".env.local"), join(homedir(), "kriv-secrets", "unsplash.env")].map(fromFile).find(Boolean) ?? null;
}

async function call(repo, path) {
  const key = unsplashKey(repo);
  if (!key) throw new Error("No Unsplash key: add UNSPLASH_ACCESS_KEY to .env.local");
  const res = await fetch(`https://api.unsplash.com${path}`, { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" } });
  remaining = Number(res.headers.get("x-ratelimit-remaining") ?? remaining);
  if (res.status === 403 && remaining === 0) throw new Error("Unsplash hourly limit reached (50 an hour on the demo key). Try again later.");
  if (!res.ok) throw new Error(`Unsplash answered ${res.status}`);
  return res.json();
}

// Hints for the reviewer, not filters: always look at the photo itself (same as scripts/pick-photos.mjs).
const WARN = /\b(man|woman|men|women|person|people|boy|girl|child|kid|doctor|dentist|nurse|patient|face|portrait|smil|logo|sign|text|brand)\w*/i;
const BUSINESS = /\b(dental|dentist|clinic|spa|chiro|hvac|heating|air|llc|inc|ltd|co\.|company|studio|medical|aesthetic|office)\b/i;

export async function search(repo, query, page = 1) {
  const data = await call(repo, `/search/photos?query=${encodeURIComponent(query)}&per_page=18&page=${page}&orientation=landscape&content_filter=high`);
  return {
    remaining,
    results: data.results.map((p) => {
      const desc = [p.description, p.alt_description].filter(Boolean).join(" / ");
      return {
        id: p.id, desc, thumb: p.urls.small, by: p.user.name,
        warn: [WARN.test(desc) ? `mentions "${desc.match(WARN)[0]}"` : "", BUSINESS.test(p.user.name) ? `uploaded by a business account ("${p.user.name}")` : ""].filter(Boolean).join("; "),
      };
    }),
  };
}

/** The hotlink URL and credit for a photo, and Unsplash's download tracking for using it. */
export async function use(repo, id) {
  const p = await call(repo, `/photos/${encodeURIComponent(id)}`);
  await call(repo, p.links.download_location.replace("https://api.unsplash.com", ""));
  return {
    id, url: `${p.urls.raw}&w=1600&q=80&fm=jpg&fit=max`, thumb: p.urls.small,
    credit: { provider: "Unsplash", photographer: p.user.name, profileUrl: p.user.links.html, photoPage: p.links.html },
  };
}
