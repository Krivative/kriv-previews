// No paid AI. Background collection, checks and preset preparation run only after local opt-in.
import { now, parse, json, rowToLead, log, isOptedOut } from "./db.mjs";
import { jobStatus, startJob, startCheck, startFind, startShots } from "./jobs.mjs";
import { prepareLead } from "./preparation.mjs";
import { preparationReadiness } from "./preparation-state.mjs";
import { isExcluded } from "../../scripts/finder/rules.mjs";
import { reviewPaused } from "./workflow-state.mjs";

export const DEFAULT_SEARCH = { source: "hotfrog", towns: ["ocala-fl"], niches: ["hvac", "dental", "chiro", "medspa", "plumbing", "auto"], lists: [] };
const setting = (db, key) => db.prepare("SELECT value FROM settings WHERE key = ?").get(key)?.value;
export function automationStatus(ctx) {
  const enabled = setting(ctx.db, "automation_enabled") === "1";
  return { enabled, running: enabled, mode: "templates", reason: enabled ? "Preparing offers using niche templates and reusable wording. No paid AI." : "Background preparation is paused. No paid AI is used.", search: parse(setting(ctx.db, "automation_search"), DEFAULT_SEARCH) };
}
function due(p) { return !p || p.state === "queued" || (p.state !== "preparing" && p.updated_at.slice(0, 10) !== now().slice(0, 10)); }
export function nextPreparation(ctx) {
  const rows = ctx.db.prepare("SELECT * FROM leads WHERE bucket = 'qualified' AND status IN ('found', 'draft') ORDER BY status = 'draft' DESC, updated_at").all().map(rowToLead);
  return rows.find((l) => {
    if (reviewPaused(ctx.db, l.id)) return false;
    if (!l.email || isOptedOut(ctx.db, l.email) || ctx.db.prepare("SELECT status FROM emails WHERE lead_id = ?").get(l.id)?.status === "sent") return false;
    const p = ctx.db.prepare("SELECT * FROM preparations WHERE lead_id = ?").get(l.id);
    return due(p) || (p?.state === "ready" && !preparationReadiness(ctx, l).ready);
  });
}
export function startPreparation(ctx, lead) {
  return startJob("prepare", `Preparing ${lead.name} for your review`, 1, async (job) => {
    const r = await prepareLead(ctx, lead.id, {}, () => job.cancelled);
    job.done = 1; return r;
  });
}
export function automationTick(ctx) {
  if (!automationStatus(ctx).running || jobStatus()?.status === "running") return;
  const preparedToday = ctx.db.prepare("SELECT COUNT(*) n FROM preparations WHERE state = 'ready' AND updated_at >= ?").get(now().slice(0, 10)).n;
  const queuedRevision = ctx.db.prepare("SELECT lead_id FROM preparations WHERE state = 'queued' AND revision IS NOT NULL LIMIT 1").get();
  if (queuedRevision) {
    const lead = rowToLead(ctx.db.prepare("SELECT * FROM leads WHERE id = ?").get(queuedRevision.lead_id));
    if (lead && !reviewPaused(ctx.db, lead.id) && ["found", "draft"].includes(lead.status) && lead.bucket === "qualified") return startPreparation(ctx, lead);
  }
  if (preparedToday >= 10) return;
  const lead = nextPreparation(ctx);
  if (lead) return startPreparation(ctx, lead);
  // Technically modern sites still require the existing visual weak-site judgment. Collect
  // evidence for a later Codex session; never invent a visual grade to create more leads.
  const visual = ctx.db.prepare("SELECT * FROM leads WHERE bucket = 'toReview' AND status = 'found' ORDER BY updated_at").all().map(rowToLead)
    .find((l) => !l.flags.includes("not-checked") && setting(ctx.db, `shots_attempt:${l.id}`) !== now().slice(0, 10));
  if (visual) {
    ctx.db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(`shots_attempt:${visual.id}`, now().slice(0, 10));
    return startShots(ctx, [visual.website]);
  }
  const ungraded = ctx.db.prepare("SELECT c.data FROM candidates c LEFT JOIN checks k ON k.host = c.key WHERE k.host IS NULL LIMIT 20").all()
    .map((r) => parse(r.data, {})).filter((c) => c.website && !isExcluded(c.name ?? "", c.website)).map((c) => c.website);
  if (ungraded.length) return startCheck(ctx, ungraded);
  if (setting(ctx.db, "automation_find_day") !== now().slice(0, 10)) {
    const search = parse(setting(ctx.db, "automation_search"), DEFAULT_SEARCH);
    ctx.db.prepare("INSERT INTO settings (key, value) VALUES ('automation_find_day', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(now().slice(0, 10));
    return startFind(ctx, search);
  }
}
export function startAutomation(ctx) {
  ctx.db.prepare("UPDATE preparations SET state = 'held', report = ?, fingerprint = NULL WHERE state = 'preparing'").run(json({ reason: "Preparation was interrupted. It will retry on the next daily cycle." }));
  const tick = () => { try { automationTick(ctx); } catch (e) { log(ctx.db, null, "automation paused", { reason: e.message }); } };
  const timer = setInterval(tick, 60000); timer.unref();
  return () => clearInterval(timer);
}
