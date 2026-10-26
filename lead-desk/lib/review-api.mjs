// Review: qualified leads, sites waiting for the visual review, near misses, not checked.
// The visual review is Kriv's (or Claude's) judgement on the 6-item checklist in
// docs/LEAD-FINDER.md; 2 or more failed items make a working site count as weak (rule unchanged).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { now, json, parse, log, isOptedOut } from "./db.mjs";
import { rerunRules } from "./pipeline.mjs";
import { startShots } from "./jobs.mjs";

const bad = (msg, status = 400) => ({ httpStatus: status, body: { error: msg } });

export const VISUAL_CHECKLIST = [
  "Unchanged builder template, or builder branding left showing",
  "No real photos: clip art, tiny or blurry images, or none",
  "Clashing colours or more than 3 fonts",
  "Wall of text or a cramped layout with no clear call to action",
  "Placeholder text, empty sections or broken images; headings that render like default links",
  "Outdated look (gradients and bevels, tables, fixed narrow width) or newest copyright 2020 or older",
];

function shotsFor(leadsDir, key, checkShot) {
  const dir = join(leadsDir, "shots", "review");
  const desktop = join(dir, `${key}-desktop.png`);
  const phone = join(dir, `${key}-phone.png`);
  return { desktop: existsSync(desktop) ? desktop : null, phone: existsSync(phone) ? phone : checkShot && existsSync(checkShot) ? checkShot : null };
}

export const reviewRoutes = [
  ["GET", /^\/api\/review$/, ({ db, query, leadsDir }) => {
    const tab = ["qualified", "toReview", "near", "notChecked"].includes(query.tab) ? query.tab : "qualified";
    const where = ["l.bucket = ?"], args = [tab];
    if (tab !== "qualified") where.push("l.status = 'found'");
    if (query.state) { where.push("l.state = ?"); args.push(query.state); }
    if (query.niche) { where.push("l.niche = ?"); args.push(query.niche); }
    const counts = Object.fromEntries(db.prepare("SELECT bucket, COUNT(*) n FROM leads WHERE bucket = 'qualified' OR status = 'found' GROUP BY bucket").all().map((r) => [r.bucket, r.n]));
    const rows = db.prepare(`SELECT l.*, k.shot AS check_shot, v.failed AS visual FROM leads l LEFT JOIN checks k ON k.host = l.key LEFT JOIN visual v ON v.host = l.key
      WHERE ${where.join(" AND ")} ORDER BY CASE l.status WHEN 'found' THEN 0 WHEN 'draft' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END, l.state, l.town, l.name LIMIT 500`).all(...args);
    return {
      tab, counts, checklist: VISUAL_CHECKLIST,
      rows: rows.map((r) => ({
        id: r.id, key: r.key, name: r.name, state: r.state, town: r.town, niche: r.niche, website: r.website, website_status: r.website_status, why: r.why,
        email: r.email, email_found_at: r.email_found_at, status: r.status, slug: r.slug, note: r.note, optedOut: isOptedOut(db, r.email),
        looks_dated: parse(r.looks_dated, []), visual: parse(r.visual, null), shots: shotsFor(leadsDir, r.key, r.check_shot),
      })),
    };
  }],
  // Kriv's visual grade for one site: the failed items in Kriv's own words (the email quotes them).
  ["POST", /^\/api\/visual\/(?<key>[^/]+)$/, async ({ db, params, body }) => {
    const failed = (body.failed ?? []).map((s) => String(s).trim()).filter(Boolean);
    const lead = db.prepare("SELECT id FROM leads WHERE key = ?").get(params.key);
    if (!lead) return bad("no such site", 404);
    const by = body.by === "Claude" ? "Claude" : "Kriv";
    db.prepare("INSERT INTO visual (host, failed, at, by) VALUES (?, ?, ?, ?) ON CONFLICT(host) DO UPDATE SET failed = excluded.failed, at = excluded.at, by = excluded.by").run(params.key, json(failed), now(), by);
    db.prepare("UPDATE leads SET looks_dated = ?, updated_at = ? WHERE id = ?").run(json(failed), now(), lead.id);
    log(db, lead.id, "visual review", { failed, by });
    const rules = await rerunRules(db, { keys: [params.key] });
    return { failed, bucket: db.prepare("SELECT bucket FROM leads WHERE id = ?").get(lead.id).bucket, rules };
  }],
  ["POST", /^\/api\/review\/shots$/, (ctx) => {
    const keys = ctx.body.keys ?? [];
    const urls = keys.map((k) => ctx.db.prepare("SELECT website FROM leads WHERE key = ?").get(k)?.website).filter(Boolean);
    try { return startShots(ctx, urls); } catch (e) { return bad(e.message); }
  }],
];
