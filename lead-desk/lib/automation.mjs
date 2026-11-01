// No paid AI. Background collection, checks and preset preparation run whenever the Desk is
// open (Kriv, 2026-10-28) unless Kriv pauses them. Kriv's only manual work is publication and outreach.
import { now, parse, json, rowToLead, log, isOptedOut } from "./db.mjs";
import { jobStatus, startJob, startCheck, startFind } from "./jobs.mjs";
import { prepareLead } from "./preparation.mjs";
import { preparationReadiness } from "./preparation-state.mjs";
import { isExcluded } from "../../scripts/finder/rules.mjs";
import { reviewPaused } from "./workflow-state.mjs";
import { CHAMBERS, CHAMBERS_PER_DAY } from "./chambers.mjs";
import { NICHE_IDS, LEGACY_NICHES } from "../public/niches.js";

export const DEFAULT_SEARCH = { source: "hotfrog", towns: ["ocala-fl"], niches: NICHE_IDS, lists: [] };
// Previews prepared per day (was 10; Kriv asked for ~30 emails a day, 2026-11-01).
export const DAILY_PREPARATIONS = 30;
const setting = (db, key) => db.prepare("SELECT value FROM settings WHERE key = ?").get(key)?.value;
// On by default. A separate key so an older opt-in "off" value does not keep it paused.
/** The saved search. A saved copy of the original six types (the old default) means every type. */
export function savedSearch(db) {
  const s = parse(setting(db, "automation_search"), DEFAULT_SEARCH);
  const legacy = Array.isArray(s.niches) && s.niches.length === LEGACY_NICHES.length && LEGACY_NICHES.every((n) => s.niches.includes(n));
  return legacy ? { ...s, niches: NICHE_IDS } : s;
}
export function automationStatus(ctx) {
  const enabled = setting(ctx.db, "automation_paused") !== "1";
  return { enabled, running: enabled, mode: "templates", reason: enabled ? "Finding, checking and building previews automatically. No paid AI." : "Automatic building is paused. No paid AI is used.", search: savedSearch(ctx.db) };
}
function due(p) { return !p || p.state === "queued" || (p.state !== "preparing" && p.updated_at.slice(0, 10) !== now().slice(0, 10)); }
export function nextPreparation(ctx) {
  const rows = ctx.db.prepare("SELECT * FROM leads WHERE bucket = 'qualified' AND status IN ('found', 'draft') ORDER BY status = 'draft' DESC, updated_at").all().map(rowToLead);
  return rows.find((l) => {
    if (reviewPaused(ctx.db, l.id)) return false;
    if (!l.email || isOptedOut(ctx.db, l.email) || ctx.db.prepare("SELECT status FROM emails WHERE lead_id = ?").get(l.id)?.status === "sent") return false;
    const p = ctx.db.prepare("SELECT * FROM preparations WHERE lead_id = ?").get(l.id);
    // A draft built by hand (no preparation record) is never replaced automatically.
    if (!p && l.status === "draft") return false;
    // Nor is one changed outside the worker after its last run (a Build-screen save or check).
    const draft = l.slug ? ctx.db.prepare("SELECT updated_at FROM drafts WHERE slug = ?").get(l.slug) : null;
    if (p && draft && draft.updated_at > p.updated_at) return false;
    return due(p) || (p?.state === "ready" && !preparationReadiness(ctx, l).ready);
  });
}
export function startPreparation(ctx, lead) {
  return startJob("prepare", `Preparing ${lead.name} for your review`, 1, async (job) => {
    const r = await prepareLead(ctx, lead.id, {}, () => job.cancelled);
    job.done = 1; return r;
  });
}
/**
 * Up to `limit` candidate websites that have never been checked, newest finds first.
 * Filters BEFORE limiting: website-less listings and excluded chains never get a check,
 * so taking the first rows and filtering afterwards starved every newer find (found
 * 2026-11-01: no checks ran from 10-28 while 160 chamber finds waited).
 */
export function uncheckedWebsites(db, limit = 20) {
  return db.prepare("SELECT c.data FROM candidates c LEFT JOIN checks k ON k.host = c.key WHERE k.host IS NULL AND json_extract(c.data, '$.website') IS NOT NULL ORDER BY c.found_at DESC").all()
    .map((r) => parse(r.data, {})).filter((c) => c.website && !isExcluded(c.name ?? "", c.website)).slice(0, limit).map((c) => c.website);
}

export function automationTick(ctx) {
  if (!automationStatus(ctx).running || jobStatus()?.status === "running") return;
  const preparedToday = ctx.db.prepare("SELECT COUNT(*) n FROM preparations WHERE state = 'ready' AND updated_at >= ?").get(now().slice(0, 10)).n;
  const queuedRevision = ctx.db.prepare("SELECT lead_id FROM preparations WHERE state = 'queued' AND revision IS NOT NULL LIMIT 1").get();
  if (queuedRevision) {
    const lead = rowToLead(ctx.db.prepare("SELECT * FROM leads WHERE id = ?").get(queuedRevision.lead_id));
    if (lead && !reviewPaused(ctx.db, lead.id) && ["found", "draft"].includes(lead.status) && lead.bucket === "qualified") return startPreparation(ctx, lead);
  }
  if (preparedToday >= DAILY_PREPARATIONS) return;
  const lead = nextPreparation(ctx);
  if (lead) return startPreparation(ctx, lead);
  // Technically modern sites ("Visual review") are skipped: Kriv chose not to grade them by hand
  // (2026-10-28), and a visual grade is never invented. They stay parked on the Review screen.
  const ungraded = uncheckedWebsites(ctx.db);
  if (ungraded.length) return startCheck(ctx, ungraded);
  const find = nextFind(ctx);
  if (find) return startFind(ctx, find);
  // Then re-check businesses checked before social links and search descriptions were recorded,
  // so the Sales Discover list can offer social media, SEO and booking services (2026-11-01).
  const refresh = sitesForSalesRefresh(ctx.db);
  if (refresh.length) return startCheck(ctx, refresh);
}

/**
 * Up to `limit` websites of open businesses whose saved check predates the social-link and
 * search-description facts: modern sites first (they need a non-website offer), then the rest.
 */
export function sitesForSalesRefresh(db, limit = 20) {
  return db.prepare(`SELECT l.website FROM leads l JOIN checks k ON k.host = l.key
    WHERE l.website IS NOT NULL AND l.bucket IN ('toReview', 'qualified', 'near') AND l.status NOT IN ('sent', 'replied', 'declined', 'expired')
      AND json_extract(k.data, '$.socialLinks') IS NULL AND json_extract(k.data, '$.error') IS NULL
    ORDER BY l.bucket = 'toReview' DESC, l.updated_at DESC`).all()
    .map((r) => r.website).filter((w) => !isExcluded("", w)).slice(0, limit);
}
const put = (db, key, value) => db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, String(value));
/**
 * The next directory search, or null when today's are done: Hotfrog for the chosen towns once a
 * day, then CHAMBERS_PER_DAY chamber directories in rotation. Records the run before it starts.
 */
export function nextFind(ctx) {
  const today = now().slice(0, 10);
  const search = savedSearch(ctx.db);
  if (setting(ctx.db, "automation_find_day") !== today) {
    put(ctx.db, "automation_find_day", today);
    return search;
  }
  const [day, runs] = String(setting(ctx.db, "automation_chamber_runs") ?? "").split(":");
  const done = day === today ? Number(runs) || 0 : 0;
  if (done >= CHAMBERS_PER_DAY || !CHAMBERS.length) return null;
  const i = (Number(setting(ctx.db, "automation_chamber_next")) || 0) % CHAMBERS.length;
  put(ctx.db, "automation_chamber_runs", `${today}:${done + 1}`);
  put(ctx.db, "automation_chamber_next", i + 1);
  return { source: "chamber", lists: [CHAMBERS[i].list], niches: search.niches };
}
export function startAutomation(ctx) {
  ctx.db.prepare("UPDATE preparations SET state = 'held', report = ?, fingerprint = NULL WHERE state = 'preparing'").run(json({ reason: "Preparation was interrupted. It will retry on the next daily cycle." }));
  const tick = () => { try { automationTick(ctx); } catch (e) { log(ctx.db, null, "automation paused", { reason: e.message }); } };
  const timer = setInterval(tick, 60000); timer.unref();
  return () => clearInterval(timer);
}
