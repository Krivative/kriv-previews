// Runs Kriv's lead rules (scripts/finder/rules.mjs) over every listing and site check in the
// database and files each business as qualified, near miss, not checked or waiting for the
// visual review. Leads Kriv already acted on (past "found") keep their record.
import { promises as dns } from "node:dns";
import { classify, host } from "../../scripts/finder/rules.mjs";
import { parse, tx } from "./db.mjs";
import { upsertLead, findLead } from "./leads.mjs";

const mxCache = new Map();
export const defaultHasMx = (d) => {
  if (!mxCache.has(d)) mxCache.set(d, dns.resolveMx(d).then((r) => r.length > 0, () => false));
  return mxCache.get(d);
};

export function loadChecks(db) {
  return new Map(db.prepare("SELECT host, data FROM checks").all().map((r) => [r.host, parse(r.data)]));
}
export function loadVisual(db) {
  return Object.fromEntries(db.prepare("SELECT host, failed FROM visual").all().map((r) => [r.host, { failed: parse(r.failed, []) }]));
}

/** opts.onlyNew: add businesses not yet in the desk, leave existing ones untouched. */
export async function rerunRules(db, { hasMx = defaultHasMx, onlyNew = false, keys = null } = {}) {
  const checks = loadChecks(db);
  const visual = loadVisual(db);
  const rows = keys ? keys.map((k) => db.prepare("SELECT key, data FROM candidates WHERE key = ?").get(k)).filter(Boolean) : db.prepare("SELECT key, data FROM candidates").all();
  const results = [];
  for (const row of rows) {
    const c = parse(row.data);
    const { bucket, rec } = await classify(c, { checks, visual, hasMx });
    if (rec) results.push({ bucket, rec });
  }
  const counts = { qualified: 0, near: 0, notChecked: 0, toReview: 0, none: 0, updated: 0, added: 0 };
  tx(db, () => {
    for (const { bucket, rec } of results) {
      counts[bucket] = (counts[bucket] ?? 0) + 1;
      const prev = findLead(db, rec);
      if (bucket === "none") {
        // Graded "not dated" (or no longer weak): no longer waiting for anything.
        if (prev && !onlyNew && prev.status === "found" && prev.bucket !== "none") { db.prepare("UPDATE leads SET bucket = 'none', updated_at = ? WHERE id = ?").run(new Date().toISOString(), prev.id); counts.updated++; }
        continue;
      }
      if (prev && (onlyNew || prev.status !== "found")) continue;
      const prefix = { near: "near-", notChecked: "nc-" }[bucket] ?? "";
      upsertLead(db, rec, {
        id: `${prefix}${rec.name || host(rec.website) || "lead"}-${rec.state}`.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80),
        bucket,
        overwrite: ["website_status", "flags", "looks_dated", "email", "email_found_at", "why", "checked_at"],
      });
      counts[prev ? "updated" : "added"]++;
    }
  });
  return counts;
}
