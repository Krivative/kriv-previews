// Reshuffles or pins the look of a story site (see src/stories/journey-style.ts).
//   node scripts/story-style.mjs <slug>                 give the lead a new random seed
//   node scripts/story-style.mjs <slug> --theme <name>  pin a theme (other parts stay with the seed)
//   node scripts/story-style.mjs <slug> --clear         back to the default (seeded by the slug)
// It only edits leads/<slug>.json. Nothing is published.
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";

const [slug, flag, value] = process.argv.slice(2);
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error("Usage: node scripts/story-style.mjs <slug> [--theme <name> | --clear]"); process.exit(1); }
const file = path.join(process.cwd(), "leads", `${slug}.json`);
const lead = JSON.parse(readFileSync(file, "utf8"));
if (!lead.story) { console.error(`${slug} is not a story site (no "story" in its record).`); process.exit(1); }
if (flag === "--clear") delete lead.storyStyle;
else if (flag === "--theme" && value) lead.storyStyle = { ...lead.storyStyle, theme: value };
else lead.storyStyle = { seed: randomBytes(4).toString("hex") };
writeFileSync(file, `${JSON.stringify(lead, null, 2)}\n`);
console.log(`${slug}: storyStyle = ${JSON.stringify(lead.storyStyle ?? "default (seeded by the slug)")}`);
console.log("Open the lead's page in the local preview to see the new look. Nothing was published.");
