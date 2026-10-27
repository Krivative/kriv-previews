// One source for the founder's current stage. Read-only: never approves, publishes or prepares.
import { createHash } from "node:crypto";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse, isOptedOut } from "./db.mjs";
import { preparationReadiness } from "./preparation-state.mjs";
import { qaChecklist } from "./preview.mjs";
import { openBlanks } from "./compose.mjs";
import { SLUG_PATTERN } from "../../src/lib/site-schema.ts";
import { jobStatus } from "./jobs.mjs";

const hash = (v) => createHash("sha256").update(typeof v === "string" || Buffer.isBuffer(v) ? v : JSON.stringify(v)).digest("hex");
const kitCache = new Map();
export const workflowOf = (db, id) => db.prepare("SELECT * FROM lead_workflow WHERE lead_id = ?").get(id) ?? null;
export const reviewHold = (db, id) => ["revision", "declined"].includes(workflowOf(db, id)?.decision);
export const reviewPaused = (db, id) => ["approved", "revision", "declined"].includes(workflowOf(db, id)?.decision);
export function pendingPublication(db, id) {
  const published = db.prepare("SELECT id FROM history WHERE lead_id = ? AND action = 'published' ORDER BY id DESC LIMIT 1").get(id);
  const verified = db.prepare("SELECT id FROM history WHERE lead_id = ? AND action = 'live (checked)' ORDER BY id DESC LIMIT 1").get(id);
  return !!published && published.id > (verified?.id ?? 0);
}

// Include presentation code: a shared-template edit also changes what was visually accepted.
function kitVersion(repo, template) {
  const files = ["src/sections/Sections.tsx", "src/sections/Chrome.tsx", "src/sections/Pages.tsx", "src/sections/SiteRenderer.tsx", "src/sections/Photo.tsx", "src/sections/Rich.tsx", "src/sections/ctas.ts", "src/sections/inert.ts", "src/sections/sections.module.css", "src/sections/SignatureSections.tsx", "src/sections/GalleryViewer.tsx", "src/sections/signature.module.css", "src/lib/site-pages.ts", "src/app/globals.css"];
  if (/^[a-z-]+$/.test(template ?? "")) files.push(`src/templates/${template}.ts`);
  const stamp = files.map((f) => { const p = join(repo, f); return existsSync(p) ? [f, statSync(p).mtimeMs, statSync(p).size] : [f, null]; });
  const key = JSON.stringify([repo, template, stamp]);
  if (!kitCache.has(key)) {
    if (kitCache.size > 100) kitCache.clear();
    kitCache.set(key, hash(files.map((f) => [f, existsSync(join(repo, f)) ? hash(readFileSync(join(repo, f))) : null])));
  }
  return kitCache.get(key);
}

export function previewSnapshot(ctx, l) {
  try {
    if (!SLUG_PATTERN.test(l.slug ?? "")) return null;
    const record = JSON.parse(readFileSync(join(ctx.repo, "leads", `${l.slug}.json`), "utf8"));
    if (record.slug !== l.slug) return null;
    const d = ctx.db.prepare("SELECT screenshots FROM drafts WHERE slug = ? AND lead_id = ?").get(l.slug, l.id);
    const screenshots = parse(d?.screenshots, []);
    const content = { ...record, status: "draft" };
    const images = screenshots.map((s) => ({ ...s, digest: existsSync(s.file) ? hash(readFileSync(s.file)) : null }));
    return { record, screenshots, version: hash([content, images, kitVersion(ctx.repo, record.template)]),
      viewable: images.length === 2 && images.every((s) => s.digest) };
  } catch { return null; }
}

export const mailVersion = (mail) => mail?.subject && mail?.body ? hash([mail.to_addr, mail.subject, mail.body]) : null;
export function designAccepted(ctx, l, snapshot = previewSnapshot(ctx, l)) {
  const w = workflowOf(ctx.db, l.id);
  // Old publication approvals retain their original meaning; no historical data is rewritten.
  const legacy = ["approved", "live", "sent", "replied"].includes(l.status);
  return w ? (w.decision === "approved" && !!snapshot && w.preview_version === snapshot.version) || (w.decision === "pending" && !w.preview_version && legacy) : legacy;
}
export function contactBlocked(db, l, mail) {
  return isOptedOut(db, l.email) || isOptedOut(db, mail?.to_addr);
}
export function qaFor(ctx, l) {
  const d = ctx.db.prepare("SELECT qa FROM drafts WHERE slug = ?").get(l.slug);
  const saved = parse(d?.qa, []);
  return qaChecklist(ctx.repo).map((q) => { const s = saved.find((entry) => entry.item === q.item); return { ...q, ...s, pass: s?.pass === true, auto: q.auto || s?.auto || false }; });
}
export function requiredChecks(ctx, l) {
  const prepared = preparationReadiness(ctx, l);
  const qa = qaFor(ctx, l);
  return { prepared, qa, ready: prepared.managed ? prepared.ready : qa.length > 0 && qa.every((q) => q.pass),
    reason: prepared.managed ? prepared.reason : `${qa.filter((q) => !q.pass).length} checks still need your review.` };
}

export function publicationVersion(ctx, l) {
  const p = ctx.db.prepare("SELECT state, report, fingerprint FROM preparations WHERE lead_id = ?").get(l.id);
  const report = parse(p?.report, {});
  return hash([previewSnapshot(ctx, l)?.version, mailVersion(ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id)),
    ctx.db.prepare("SELECT qa FROM drafts WHERE slug = ?").get(l.slug)?.qa,
    p ?? null, (report.sourceUrls ?? []).map((url) => ctx.db.prepare("SELECT url, status, text, fetched_at FROM pages WHERE url = ?").get(url) ?? null)]);
}

export function reviewBlockers(ctx, l) {
  const w = workflowOf(ctx.db, l.id);
  if (!w) return [];
  const out = [];
  if (["revision", "declined"].includes(w.decision)) out.push(w.decision === "revision" ? "This preview is awaiting revision." : "This concept was declined.");
  else if (!designAccepted(ctx, l)) out.push("Review and approve the current design first.");
  const mail = ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id);
  if (!w.email_version || w.email_version !== mailVersion(mail)) out.push("Review the current email draft first.");
  return out;
}

export function workflowState(ctx, l) {
  const w = workflowOf(ctx.db, l.id);
  const snapshot = previewSnapshot(ctx, l);
  const mail = ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id) ?? null;
  const checks = requiredChecks(ctx, l);
  const approved = designAccepted(ctx, l, snapshot);
  const emailReady = !!mail?.to_addr && !!mail?.subject?.trim() && !!mail?.body?.trim() && !openBlanks(mail.subject, mail.body).length;
  const emailReviewed = !!w?.email_version && w.email_version === mailVersion(mail);
  const blocked = contactBlocked(ctx.db, l, mail);
  const newer = !!snapshot && !!w?.preview_version && snapshot.version !== w.preview_version;
  const job = jobStatus();
  const publishing = job?.status === "running" && job.kind === "publish" && job.leadId === l.id;
  let stage, label, next, action, priority = 6, attention = false;
  if (blocked) {
    stage = "completed"; label = "Do not contact"; next = l.status === "expired" && l.slug && !ctx.db.prepare("SELECT 1 FROM history WHERE lead_id = ? AND action = 'taken down'").get(l.id) ? "Review page removal" : "No outreach permitted"; action = next === "Review page removal" ? "takedown" : "history"; priority = 0; attention = action === "takedown";
  } else if (["declined", "expired"].includes(l.status) || w?.decision === "declined") {
    stage = "completed"; label = l.status === "expired" ? "Expired" : w?.decline_scope === "business" || l.status === "declined" ? "Prospect declined" : "Concept declined"; next = "View the decision history"; action = "history";
  } else if (["sent", "replied"].includes(l.status)) {
    stage = w?.followup_done ? "completed" : "followups"; label = w?.followup_done ? "Completed" : l.status === "replied" ? "Reply received" : "Awaiting reply";
    next = w?.followup_done ? "View the lead history" : w?.followup_due ? `Follow up ${w.followup_due}` : "Set the next follow-up"; action = "followup";
    attention = !w?.followup_done && (l.status === "replied" || !w?.followup_due || w.followup_due <= new Date().toISOString().slice(0, 10)); priority = attention ? 2 : 5;
  } else if (l.status === "live") {
    stage = "outreach"; label = "Published and verified"; next = emailReady ? emailReviewed || !w ? "Review and open in Gmail" : "Review the outgoing email" : "Complete the email draft"; action = "email"; priority = 3; attention = true;
  } else if (publishing) {
    stage = "publishing"; label = "Publication in progress"; next = "Wait for publication checks"; action = "wait-publish"; priority = 0;
  } else if (l.status === "approved" && pendingPublication(ctx.db, l.id)) {
    stage = "publishing"; label = "Publication verification pending"; next = "Check the published page"; action = "verify-live"; priority = 0; attention = true;
  } else if (w?.decision === "revision" && !newer) {
    stage = "revisions"; label = "Awaiting revision"; next = "Await changes or review another lead"; action = "revision"; priority = 5;
  } else if (!snapshot?.viewable) {
    stage = "preparing"; label = checks.prepared.managed && !checks.prepared.ready ? "Preparation needs attention" : "Preview being prepared"; next = snapshot ? "Capture desktop and mobile previews" : "Prepare the concept preview"; action = snapshot ? "checks" : "build"; priority = 4; attention = checks.prepared.managed && !checks.prepared.ready;
  } else if (!approved) {
    stage = "review"; label = newer && w?.decision === "revision" ? "Revised preview ready" : w?.decision === "approved" ? "Design changed — review again" : "Ready for review"; next = "Review the preview"; action = "design"; priority = 1; attention = true;
  } else if (!checks.ready) {
    stage = "qa"; label = "Design approved · checks remaining"; next = "Verify remaining business information"; action = "checks"; priority = 2; attention = true;
  } else if (!emailReady || (w && !emailReviewed)) {
    stage = "qa"; label = "Design and checks complete"; next = emailReady ? "Review the email draft" : "Complete the email draft"; action = "email"; priority = 2; attention = true;
  } else {
    const pendingLive = pendingPublication(ctx.db, l.id);
    stage = "publishing"; label = pendingLive ? "Publication verification pending" : "Ready for publishing"; next = pendingLive ? "Check the published page" : "Review publication readiness"; action = pendingLive ? "verify-live" : "publish"; priority = pendingLive ? 0 : 3; attention = true;
  }
  const progress = [!!snapshot?.viewable, approved, checks.ready, emailReady && (emailReviewed || !w), ["approved", "live", "sent", "replied"].includes(l.status), ["live", "sent", "replied"].includes(l.status), ["sent", "replied"].includes(l.status)];
  return { stage, label, next, action, priority, attention, progress, completedSteps: progress.filter(Boolean).length, totalSteps: progress.length,
    revision: w?.revision ?? 0, decision: w?.decision ?? "pending", designApproved: approved, previewVersion: snapshot?.version ?? null,
    canDecide: !!snapshot?.viewable && ["draft", "approved"].includes(l.status) && !blocked && !publishing && !pendingPublication(ctx.db, l.id) && w?.decision !== "declined",
    emailVersion: mailVersion(mail), emailReviewed, emailReady, contactBlocked: blocked,
    publicationCurrent: !w || (!!w.publication_version && w.publication_version === publicationVersion(ctx, l)), publicationVersion: publicationVersion(ctx, l),
    checksReady: checks.ready, checksManaged: checks.prepared.managed, checksReason: checks.reason,
    newer, workflow: w, screenshots: snapshot?.screenshots ?? [], record: snapshot?.record ?? null, qa: checks.qa, email: mail };
}
