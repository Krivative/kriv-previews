// node scripts/finder/chamber.mjs <out.json> <listUrl...>   (output outside Git)
// ChamberMaster/GrowthZone member directories: finds niche categories (also behind
// "More..." quick links), then each member's detail page and its website link.
// curl, 4-7 s between requests (scripts/finder/sources.mjs).
import { writeFileSync } from "node:fs";
import { chamber } from "./sources.mjs";

const [out, ...lists] = process.argv.slice(2);
writeFileSync(out, JSON.stringify(await chamber(lists), null, 2));
