// node scripts/finder/qualify.mjs <dataDir> <outDir>   (both outside Git)
// dataDir holds r*-search.txt (state|town|niche|url), hotfrog*.json, chamber*.json and
// batches/*.json (check-site.mjs output, see grade.sh).
// Joins every candidate source with every check-site result and applies Kriv's rules
// (scripts/finder/rules.mjs, shared with the Lead Desk): (no website OR weak website) AND a
// business mailbox (role or named after the business), independent (no chains, franchises,
// specialists). Writes qualified.json, near-misses.json, not-checked.json and to-review.json
// (sites that pass the technical check and show a business email, waiting for the visual
// review) to outDir (outside Git).
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { host, fromHotfrog, fromChamber, candidateMap, classify } from "./rules.mjs";

const [dir, outDir] = process.argv.slice(2);
const dns = (await import("node:dns")).promises;
const mxCache = new Map();
const hasMx = async (d) => {
  if (!mxCache.has(d)) mxCache.set(d, dns.resolveMx(d).then((r) => r.length > 0, () => false));
  return mxCache.get(d);
};
const J = (f) => (existsSync(join(dir, f)) ? JSON.parse(readFileSync(join(dir, f), "utf8").replace(/^﻿/, "")) : null);

// 1. Candidates keyed by website host (or by listing URL when there is no website).
const { cands, add } = candidateMap();
for (const f of readdirSync(dir).filter((f) => /^r\d+-search\.txt$/.test(f))) {
  for (const line of readFileSync(join(dir, f), "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [state, town, niche, url] = line.split("|");
    add({ state, town, niche, website: url, sources: [url], via: "web search" });
  }
}
for (const c of J("candidates.json")?.withSite ?? []) add({ state: "TX", town: "San Antonio", niche: c.niche, website: c.url, sources: [c.url], via: c.found.join("+") });
for (const c of J("dir-candidates.json") ?? []) add({ state: "TX", town: "San Antonio", niche: c.niche, website: c.website, sources: [c.website, c.directoryUrl], via: "directory" });
for (const f of readdirSync(dir).filter((f) => /^hotfrog.*[.]json$/.test(f))) for (const h of J(f) ?? []) add(fromHotfrog(h));
for (const f of readdirSync(dir).filter((f) => /^chamber.*[.]json$/.test(f))) for (const m of J(f) ?? []) add(fromChamber(m));

// 2. Check results keyed by host (latest wins).
const checks = new Map();
const files = ["checks-all.json", ...(existsSync(join(dir, "batches")) ? readdirSync(join(dir, "batches")) : []).filter((f) => f.endsWith(".json")).map((f) => join("batches", f))];
for (const f of files) for (const r of J(f) ?? []) { const h = host(r.url); if (h) checks.set(h, r); }

// 3. Rules.
const visual = J("visual.json") ?? {};
const qualified = [], near = [], notChecked = [], toReview = [];
const lists = { qualified, near, notChecked, toReview };
for (const c of cands.values()) {
  const { bucket, rec } = await classify(c, { checks, visual, hasMx });
  lists[bucket]?.push(rec);
}
writeFileSync(join(outDir, "to-review.json"), JSON.stringify(toReview, null, 2));
writeFileSync(join(outDir, "qualified.json"), JSON.stringify(qualified, null, 2));
writeFileSync(join(outDir, "near-misses.json"), JSON.stringify(near, null, 2));
writeFileSync(join(outDir, "not-checked.json"), JSON.stringify(notChecked, null, 2));
const count = (rows) => rows.reduce((m, r) => ((m[`${r.state}/${r.niche}`] = (m[`${r.state}/${r.niche}`] ?? 0) + 1), m), {});
console.log(`candidates ${cands.size}, graded ${checks.size}`);
console.log("qualified", qualified.length, JSON.stringify(count(qualified)));
console.log("near misses", near.length, "not checked", notChecked.length);
for (const q of qualified) console.log(`  ${q.state} ${q.town} ${q.niche} | ${q.name} | ${q.websiteStatus} | ${q.email}`);
