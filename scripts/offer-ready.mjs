// Is a lead ready to be sent its offer? Read-only by default.
//   node scripts/offer-ready.mjs <slug>          check one lead: blockers, warnings and its links
//   node scripts/offer-ready.mjs --all           every lead: how many are offer-ready and what holds the rest back
//   node scripts/offer-ready.mjs <slug> --add    add the quotation block for the lead's market (only edits leads/<slug>.json)
// Nothing is sent, published or approved. Works for any business, template or story style.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { checkLead, draftOffer, summarise } from "./lib/offer-ready.mjs";

const [target, flag] = process.argv.slice(2);
const root = process.cwd();
const today = new Date().toISOString().slice(0, 10);
const read = (slug) => JSON.parse(readFileSync(path.join(root, "leads", `${slug}.json`), "utf8"));

// Facts the record cannot know: whether a story's narration files are on disk, and whether its cast is still a draft.
function extras(lead) {
  if (!lead.story) return {};
  const out = { missingAudio: [], castDraft: false };
  const stem = lead.story.replace(/-journey$/, "");
  const storyFile = path.join(root, "src", "stories", `${lead.story}.ts`);
  if (existsSync(storyFile)) for (const m of readFileSync(storyFile, "utf8").matchAll(/["'`](\/audio\/[^"'`?]+\.mp3)/g)) if (!existsSync(path.join(root, "public", m[1]))) out.missingAudio.push(m[1]);
  const castFile = path.join(root, "src", "stories", "casts", `${stem}.tsx`);
  if (existsSync(castFile)) out.castDraft = /draft:\s*true/.test(readFileSync(castFile, "utf8"));
  return out;
}

if (!target) { console.error("Usage: node scripts/offer-ready.mjs <slug> [--add] | --all"); process.exit(1); }

if (target === "--all") {
  const slugs = readdirSync(path.join(root, "leads")).filter((f) => f.endsWith(".json") && !f.startsWith("test-")).map((f) => f.slice(0, -5));
  const results = slugs.map((slug) => { const lead = read(slug); return checkLead(lead, today, extras(lead)); });
  const sum = summarise(results);
  console.log(`${sum.ready} of ${sum.total} leads are offer-ready today (${today}).`);
  if (sum.ready) console.log(`Ready: ${results.filter((r) => r.ready).map((r) => r.slug).join(", ")}`);
  console.log("\nWhat holds the rest back:");
  for (const [why, count] of sum.blockers) console.log(`  ${String(count).padStart(4)}  ${why}`);
  process.exit(0);
}

if (!/^[a-z0-9-]+$/.test(target) || !existsSync(path.join(root, "leads", `${target}.json`))) { console.error(`No lead named "${target}".`); process.exit(1); }
const lead = read(target);

if (flag === "--add") {
  if (lead.offer) { console.log(`${target} already has an offer (${lead.offer.plan}, ${lead.offer.quoteNumber}). Nothing changed.`); process.exit(0); }
  if (["sent", "replied"].includes(lead.status)) { console.error("This lead is already with a client. Get Kriv’s approval before changing its offer."); process.exit(2); }
  const offer = draftOffer(lead, today, `KRIV-${(lead.business?.address?.country ?? "XX")}-${today.slice(0, 4)}-${target.slice(0, 12).toUpperCase()}`);
  if (!offer) { console.error("The record has no country for the business, so no plan can be chosen. Nothing changed."); process.exit(1); }
  const { sources, ...rest } = lead;
  writeFileSync(path.join(root, "leads", `${target}.json`), `${JSON.stringify({ ...rest, offer, ...(sources ? { sources } : {}) }, null, 2)}\n`);
  console.log(`${target}: added ${JSON.stringify(offer)}. Only leads/${target}.json changed; nothing was published.`);
  process.exit(0);
}

const r = checkLead(lead, today, extras(lead));
console.log(`${lead.business?.name ?? target} (${r.facts.country}, ${r.facts.niche}${r.facts.story ? `, story: ${r.facts.story}` : ""})`);
console.log(r.ready ? "OFFER-READY" : "NOT READY");
for (const b of r.blockers) console.log(`  blocker  ${b}`);
for (const w of r.warnings) console.log(`  warning  ${w}`);
console.log(`\n  site     https://kriv.agency/${target}`);
if (lead.offer) console.log(`  offer    https://kriv.agency/for/${target}/offer`);
if (lead.story) console.log(`  kit      https://kriv.agency/for/${target}/brand-kit`);
process.exit(r.ready ? 0 : 2);
