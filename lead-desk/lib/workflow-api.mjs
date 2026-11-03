// Founder review actions. Tests supply synthetic repositories and databases only.
import { mkdirSync, copyFileSync, existsSync, constants, writeFileSync } from "node:fs";
import { join } from "node:path";
import { now, json, parse, rowToLead, log, tx } from "./db.mjs";
import { workflowOf, workflowState, previewSnapshot, mailVersion, contactBlocked, pendingPublication } from "./workflow-state.mjs";
import { fullBody, openBlanks } from "./compose.mjs";
import { automationStatus } from "./automation.mjs";

const bad = (error, httpStatus = 400) => ({ httpStatus, body: { error } });
const lead = (db, id) => rowToLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(id));
export const DECLINE_REASONS = ["Website already looks professional", "Not a suitable prospect", "Poor design direction", "Information insufficient", "Other"];
const STEPS = ["design", "checks", "email", "publish", "followup", "history", "details", "revision", "build", "verify-live", "takedown", "wait-publish"];

function ensureWorkflow(db, id) {
  db.prepare("INSERT OR IGNORE INTO lead_workflow (lead_id, updated_at) VALUES (?, ?)").run(id, now());
}
function mismatch(ctx, id) {
  return !Number.isInteger(ctx.body.expectedRevision) || ctx.body.expectedRevision !== (workflowOf(ctx.db, id)?.revision ?? 0);
}
// Some older records have no business name (only a website); show the site instead of crashing.
const displayName = (l) => l.name || (l.website ? String(l.website).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") : "Unnamed business");
function summary(ctx, l) {
  const s = workflowState(ctx, l);
  return { id: l.id, name: displayName(l), town: l.town, state: l.state, niche: l.niche, website: l.website,
    status: l.status, slug: l.slug, updatedAt: l.updated_at, createdAt: l.created_at, note: l.note, thumbnail: s.screenshots[0]?.file ?? null,
    ...Object.fromEntries(["stage", "label", "next", "action", "priority", "attention", "progress", "completedSteps", "totalSteps"].map((k) => [k, s[k]])),
    due: s.workflow?.followup_due ?? null };
}
export function reviewView(ctx, l) {
  const s = workflowState(ctx, l);
  const history = ctx.db.prepare("SELECT id, at, action, detail FROM history WHERE lead_id = ? ORDER BY id DESC").all(l.id).map((h) => ({ ...h, detail: parse(h.detail, h.detail) }));
  return { lead: { id: l.id, name: l.name, town: l.town, state: l.state, niche: l.niche, website: l.website, status: l.status, slug: l.slug, note: l.note, email: l.email }, state: s,
    emailBody: s.email ? fullBody(s.email.body) : null,
    sources: ctx.db.prepare("SELECT field, url FROM sources WHERE lead_id = ?").all(l.id),
    facts: parse(ctx.db.prepare("SELECT facts FROM drafts WHERE lead_id = ? AND slug = ?").get(l.id, l.slug)?.facts, []), history,
    versions: ctx.db.prepare("SELECT id, decision, feedback, section, reason, scope, at FROM review_decisions WHERE lead_id = ? ORDER BY id DESC").all(l.id),
    draft: ctx.db.prepare("SELECT * FROM review_drafts WHERE lead_id = ?").get(l.id) ?? { revision: 0, feedback: "", section: "" },
    declineReasons: DECLINE_REASONS,
    nextLead: ctx.db.prepare("SELECT * FROM leads WHERE id != ? AND status IN ('draft', 'approved') AND slug IS NOT NULL ORDER BY updated_at").all(l.id).map(rowToLead).map((r) => summary(ctx, r)).filter((r) => r.stage === "review")[0]?.id ?? null };
}

function archive(ctx, l, snapshot, requestId) {
  if (!snapshot) return { record: null, screenshots: [], status: l.status };
  const dir = join(ctx.leadsDir, "review-versions", snapshot.version);
  mkdirSync(dir, { recursive: true });
  const screenshots = snapshot.screenshots.map((s, i) => {
    const file = join(dir, `${requestId}-${i}.png`);
    if (!existsSync(file)) copyFileSync(s.file, file, constants.COPYFILE_EXCL);
    return { file, label: s.label };
  });
  return { record: snapshot.record, screenshots, status: l.status };
}

export function decideReview(ctx) {
  const l = lead(ctx.db, ctx.params.id);
  if (!l) return bad("No such lead.", 404);
  const b = ctx.body;
  if (!["approved", "revision", "declined", "reopen"].includes(b.decision)) return bad("Choose Approve, Revise or Decline.");
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(b.requestId ?? "")) return bad("Reload the review before saving this decision.");
  const previous = ctx.db.prepare("SELECT lead_id, decision FROM review_decisions WHERE request_id = ?").get(b.requestId);
  if (previous) return previous.lead_id === l.id && previous.decision === b.decision ? { ok: true, duplicate: true, ...reviewView(ctx, l) } : bad("This request belongs to another decision.", 409);
  if (mismatch(ctx, l.id)) return bad("This lead changed in another window. Reload before deciding.", 409);
  if (ctx.db.prepare("SELECT state FROM preparations WHERE lead_id = ?").get(l.id)?.state === "preparing") return bad("Preparation is running. Wait for it to finish before deciding.", 409);
  if (l.status === "approved" && pendingPublication(ctx.db, l.id)) return bad("This page has already been published and awaits verification. Check publication before changing its decision.");
  const w = workflowOf(ctx.db, l.id);
  const snapshot = previewSnapshot(ctx, l);
  if (contactBlocked(ctx.db, l, ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id)) || l.status === "expired") return bad("This lead is expired or on the do-not-contact list.");
  if (b.decision === "reopen") {
    if (w?.decision !== "declined" && l.status !== "declined") return bad("Only a declined concept or prospect can be reconsidered.");
  } else {
    if (!["draft", "approved"].includes(l.status) || w?.decision === "declined") return bad("Only an active, unpublished preview can be reviewed.");
    if (!snapshot?.viewable) return bad("Capture both desktop and mobile previews before deciding.");
    if (b.previewVersion !== snapshot.version) return bad("The preview changed. Reload and review the current version.", 409);
  }
  const feedback = String(b.feedback ?? "").trim();
  const section = String(b.section ?? "").trim();
  const reason = String(b.reason ?? "").trim();
  if (feedback.length > 6000 || section.length > 100) return bad("Keep feedback under 6,000 characters and the section under 100.");
  if (b.decision === "revision" && !feedback) return bad("Tell us what you would like changed.");
  if (reason && !DECLINE_REASONS.includes(reason)) return bad("Choose one of the decline reasons.");
  const scope = b.scope === "business" ? "business" : "concept";
  if (w && b.decision === w.decision && snapshot?.version === w.preview_version && feedback === w.feedback && section === w.section && reason === w.decline_reason && scope === w.decline_scope) return { ok: true, duplicate: true, ...reviewView(ctx, l) };
  let saved;
  try { saved = archive(ctx, l, snapshot?.viewable ? snapshot : null, b.requestId); }
  catch { return bad("The review version could not be preserved. No decision was saved. Please try again.", 500); }
  const revokePublication = l.status === "approved" && ["revision", "declined"].includes(b.decision);
  if (revokePublication) writeFileSync(join(ctx.repo, "leads", `${l.slug}.json`), JSON.stringify({ ...snapshot.record, status: "draft" }, null, 2) + "\n");
  tx(ctx.db, () => {
    ensureWorkflow(ctx.db, l.id);
    const at = now();
    ctx.db.prepare(`UPDATE lead_workflow SET revision = revision + 1, decision = ?, preview_version = ?, decision_at = ?,
      feedback = ?, section = ?, decline_reason = ?, decline_scope = ?, publication_version = NULL, updated_at = ? WHERE lead_id = ?`)
      .run(b.decision === "reopen" ? "pending" : b.decision, snapshot?.version ?? null, at, feedback, section, reason, scope, at, l.id);
    ctx.db.prepare("INSERT INTO review_decisions (request_id, lead_id, decision, preview_version, feedback, section, reason, scope, snapshot, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(b.requestId, l.id, b.decision, snapshot?.version ?? null, feedback, section, reason, scope, json(saved), at);
    if (revokePublication) ctx.db.prepare("UPDATE leads SET status = 'draft' WHERE id = ?").run(l.id);
    if (b.decision === "declined" && scope === "business") ctx.db.prepare("UPDATE leads SET status = 'declined' WHERE id = ?").run(l.id);
    if (b.decision === "reopen" && l.status === "declined") ctx.db.prepare("UPDATE leads SET status = ? WHERE id = ?").run(l.slug ? "draft" : "found", l.id);
    ctx.db.prepare("UPDATE leads SET updated_at = ? WHERE id = ?").run(at, l.id);
    ctx.db.prepare("DELETE FROM review_drafts WHERE lead_id = ?").run(l.id);
    log(ctx.db, l.id, b.decision === "approved" ? "design approved" : b.decision === "revision" ? "revision requested" : b.decision === "reopen" ? "review reopened" : "concept declined", { feedback, section, reason, scope, previewVersion: snapshot?.version ?? null, by: "Kriv" });
  });
  return { ok: true, ...reviewView(ctx, lead(ctx.db, l.id)) };
}

export const workflowRoutes = [
  ["GET", /^\/api\/workflow$/, (ctx) => {
    const rows = ctx.db.prepare("SELECT * FROM leads ORDER BY updated_at DESC").all().map(rowToLead).map((l) => summary(ctx, l));
    rows.sort((a, b) => a.priority - b.priority || String(a.updatedAt ?? "").localeCompare(String(b.updatedAt ?? "")) || a.name.localeCompare(b.name));
    const saved = parse(ctx.db.prepare("SELECT value FROM settings WHERE key = 'review_resume'").get()?.value, null);
    const current = saved && rows.find((r) => r.id === saved.id && r.stage !== "completed");
    return { rows, automation: automationStatus(ctx), resume: current ? { ...current, step: saved.step } : rows.find((r) => r.attention) ?? rows.find((r) => r.stage !== "completed") ?? null };
  }],
  ["GET", /^\/api\/workflow\/(?<id>[^/]+)$/, (ctx) => { const l = lead(ctx.db, ctx.params.id); return l ? reviewView(ctx, l) : bad("No such lead.", 404); }],
  ["GET", /^\/api\/workflow\/(?<id>[^/]+)\/versions\/(?<version>\d+)$/, ({ db, params }) => {
    const d = db.prepare("SELECT snapshot, decision, at FROM review_decisions WHERE lead_id = ? AND id = ?").get(params.id, params.version);
    return d ? { ...parse(d.snapshot, {}), decision: d.decision, at: d.at } : bad("No saved version.", 404);
  }],
  ["POST", /^\/api\/workflow\/(?<id>[^/]+)\/decision$/, decideReview],
  ["POST", /^\/api\/workflow\/(?<id>[^/]+)\/edit-revision$/, (ctx) => {
    const l = lead(ctx.db, ctx.params.id); if (!l) return bad("No such lead.", 404);
    const w = workflowOf(ctx.db, l.id);
    if (mismatch(ctx, l.id)) return bad("The lead changed. Reload before editing.", 409);
    if (w?.decision !== "revision" || !["draft", "approved"].includes(l.status) || pendingPublication(ctx.db, l.id) || contactBlocked(ctx.db, l, ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id))) return bad("Only an unpublished concept awaiting revision can be edited.");
    const snapshot = previewSnapshot(ctx, l);
    if (!snapshot || snapshot.version !== ctx.body.previewVersion) return bad("The preview changed. Reload before editing.", 409);
    // The original record and captures already live in the immutable decision archive.
    if (!ctx.db.prepare("SELECT 1 FROM review_decisions WHERE lead_id = ? AND decision = 'revision'").get(l.id)) return bad("Save the revision request first.");
    if (l.status === "approved") {
      writeFileSync(join(ctx.repo, "leads", `${l.slug}.json`), JSON.stringify({ ...snapshot.record, status: "draft" }, null, 2) + "\n");
      tx(ctx.db, () => {
        ctx.db.prepare("UPDATE leads SET status = 'draft', updated_at = ? WHERE id = ?").run(now(), l.id);
        ctx.db.prepare("UPDATE lead_workflow SET publication_version = NULL, revision = revision + 1, updated_at = ? WHERE lead_id = ?").run(now(), l.id);
        log(ctx.db, l.id, "revision editor opened", { by: "Kriv", originalPreserved: true });
      });
    }
    return { ok: true, editor: `#build/${encodeURIComponent(l.id)}` };
  }],
  ["POST", /^\/api\/workflow\/(?<id>[^/]+)\/resume$/, ({ db, params, body }) => {
    if (!lead(db, params.id)) return bad("No such lead.", 404);
    if (!STEPS.includes(body.step)) return bad("Unknown review step.");
    db.prepare("INSERT INTO settings (key, value) VALUES ('review_resume', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(json({ id: params.id, step: body.step }));
    return { ok: true };
  }],
  ["POST", /^\/api\/workflow\/(?<id>[^/]+)\/draft$/, ({ db, params, body }) => {
    if (!lead(db, params.id)) return bad("No such lead.", 404);
    const d = db.prepare("SELECT * FROM review_drafts WHERE lead_id = ?").get(params.id);
    if (!Number.isInteger(body.expectedRevision) || (d?.revision ?? 0) !== body.expectedRevision) return bad("Feedback changed in another window. Your text is still here; reload before replacing the saved version.", 409);
    const feedback = String(body.feedback ?? ""); const section = String(body.section ?? "");
    if (feedback.length > 6000 || section.length > 100) return bad("Feedback is too long.");
    if (d?.feedback === feedback && d?.section === section) return { ok: true, revision: d.revision };
    db.prepare("INSERT INTO review_drafts (lead_id, revision, feedback, section, updated_at) VALUES (?, 1, ?, ?, ?) ON CONFLICT(lead_id) DO UPDATE SET revision = revision + 1, feedback = excluded.feedback, section = excluded.section, updated_at = excluded.updated_at")
      .run(params.id, feedback, section, now());
    return { ok: true, revision: (d?.revision ?? 0) + 1 };
  }],
  ["POST", /^\/api\/workflow\/(?<id>[^/]+)\/email-review$/, (ctx) => {
    const l = lead(ctx.db, ctx.params.id); if (!l) return bad("No such lead.", 404);
    if (mismatch(ctx, l.id)) return bad("This lead changed. Reload before reviewing the email.", 409);
    const mail = ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id);
    if (!mail?.to_addr || !mail?.subject?.trim() || !mail?.body?.trim() || openBlanks(mail.subject, mail.body).length) return bad("Complete the email draft first.");
    if (contactBlocked(ctx.db, l, mail) || ["declined", "expired"].includes(l.status) || ["revision", "declined"].includes(workflowOf(ctx.db, l.id)?.decision)) return bad("Outreach is blocked for this lead.");
    if (ctx.body.emailVersion !== mailVersion(mail)) return bad("The email changed. Review the current draft.", 409);
    if (workflowOf(ctx.db, l.id)?.email_version === mailVersion(mail)) return { ok: true, duplicate: true, ...reviewView(ctx, l) };
    tx(ctx.db, () => {
      ensureWorkflow(ctx.db, l.id);
      ctx.db.prepare("UPDATE lead_workflow SET email_version = ?, revision = revision + 1, updated_at = ? WHERE lead_id = ?").run(mailVersion(mail), now(), l.id);
      log(ctx.db, l.id, "email reviewed", { by: "Kriv" });
    });
    return { ok: true, ...reviewView(ctx, l) };
  }],
  ["POST", /^\/api\/workflow\/(?<id>[^/]+)\/followup$/, (ctx) => {
    const l = lead(ctx.db, ctx.params.id); if (!l) return bad("No such lead.", 404);
    if (mismatch(ctx, l.id)) return bad("This lead changed. Reload before saving the follow-up.", 409);
    if (!["sent", "replied"].includes(l.status) || contactBlocked(ctx.db, l, ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id))) return bad("Follow-ups are for contacted leads that may still be contacted.");
    const due = String(ctx.body.due ?? ""); const note = String(ctx.body.note ?? "").trim();
    if (due && (!/^\d{4}-\d{2}-\d{2}$/.test(due) || !Number.isFinite(Date.parse(due)) || new Date(due).toISOString().slice(0, 10) !== due)) return bad("Choose a valid follow-up date.");
    if (note.length > 6000) return bad("Keep the note under 6,000 characters.");
    const w = workflowOf(ctx.db, l.id);
    if (w && (w.followup_due ?? "") === due && w.followup_note === note && !!w.followup_done === (ctx.body.done === true)) return { ok: true, duplicate: true, ...reviewView(ctx, l) };
    tx(ctx.db, () => {
      ensureWorkflow(ctx.db, l.id);
      ctx.db.prepare("UPDATE lead_workflow SET followup_due = ?, followup_note = ?, followup_done = ?, revision = revision + 1, updated_at = ? WHERE lead_id = ?").run(due || null, note, ctx.body.done === true ? 1 : 0, now(), l.id);
      log(ctx.db, l.id, ctx.body.done === true ? "follow-up completed" : "follow-up saved", { due, note, by: "Kriv" });
    });
    return { ok: true, ...reviewView(ctx, l) };
  }],
];
