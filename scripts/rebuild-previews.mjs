// node scripts/rebuild-previews.mjs [slug...]
// Kriv's authorized rebuild (2026-11-03): for each lead with C:\Users\user\kriv-leads\content\<slug>.json,
// re-prepares the preview with a fitting design, new non-repeating photos (own photos first) and the
// source-backed content in that file. The result goes back to Kriv's review; nothing is approved,
// published or sent. Unsplash allows 50 requests an hour on the demo key: when the limit is hit the
// script stops; run it again later and it continues with the leads not yet rebuilt.
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { openDb } from "../lead-desk/lib/db.mjs";
import { prepareLead } from "../lead-desk/lib/preparation.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const leadsDir = process.env.KRIV_LEADS_DIR || join(homedir(), "kriv-leads");
const ctx = { repo, leadsDir, reportsDir: join(homedir(), "kriv-reports"), db: openDb(join(leadsDir, "lead-desk.db")) };
const contentDir = join(leadsDir, "content");
const doneFile = join(contentDir, "rebuilt.json");
const done = existsSync(doneFile) ? JSON.parse(readFileSync(doneFile, "utf8")) : {};
const wanted = process.argv.slice(2);
const slugs = readdirSync(contentDir).filter((f) => f.endsWith(".json") && f !== "rebuilt.json").map((f) => f.slice(0, -5))
  .filter((s) => (wanted.length ? wanted.includes(s) : !done[s]));
for (const slug of slugs) {
  const spec = JSON.parse(readFileSync(join(contentDir, `${slug}.json`), "utf8"));
  const lead = ctx.db.prepare("SELECT id FROM leads WHERE slug = ?").get(slug);
  if (!lead) { console.log(`skip ${slug}: no lead`); continue; }
  try {
    await prepareLead(ctx, lead.id, { rebuild: { note: spec.note ?? "Rebuild with fitting design, new photos and source-backed content (Kriv, 2026-11-03)", queries: spec.queries, design: spec.design, niche: spec.niche, content: spec.content } });
    if (spec.niche) ctx.db.prepare("UPDATE leads SET niche = ? WHERE id = ?").run(spec.niche, lead.id);
    const rec = JSON.parse(readFileSync(join(repo, "leads", `${slug}.json`), "utf8"));
    done[slug] = { at: new Date().toISOString(), template: rec.template, photos: rec.brand.photos.length };
    writeFileSync(doneFile, JSON.stringify(done, null, 2));
    console.log(`ok ${slug}: ${rec.template}, ${rec.brand.photos.length} photos`);
  } catch (e) {
    console.log(`held ${slug}: ${e.message}`);
    if (/hourly limit/i.test(e.message)) { console.log("Unsplash limit reached; run again in an hour."); break; }
  }
}
