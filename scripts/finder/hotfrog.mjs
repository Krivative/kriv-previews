// node scripts/finder/hotfrog.mjs <out.json> <town-st,town-st,...>  (e.g. "waco-tx,ocala-fl")
// Hotfrog listings for the pilot niches: search pages, then each company page; 5-9 s pause
// between requests (scripts/finder/sources.mjs). Output holds business emails: write it outside
// Git (docs/LEAD-FINDER.md). NICHES=plumbing,auto limits the niches.
import { writeFileSync } from "node:fs";
import { hotfrog, HOTFROG_CATS } from "./sources.mjs";

const niches = process.env.NICHES ? process.env.NICHES.split(",") : Object.keys(HOTFROG_CATS);
const out = await hotfrog((process.argv[3] ?? "san-antonio").split(","), { niches });
writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
