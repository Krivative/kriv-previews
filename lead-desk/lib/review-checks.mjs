// Verification only. This never generates wording, replaces a record, or queues a revision.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { now, json, parse, rowToLead, log } from "./db.mjs";
import { readSources, schemaProblems, fetchPage } from "./builder.mjs";
import { autoChecks, ensureDev, shoot } from "./preview.mjs";
import { startJob, npmRoot } from "./jobs.mjs";
import { preparationFingerprint, recordFingerprint } from "./preparation-state.mjs";
import { previewSnapshot, qaFor, workflowOf, contactBlocked, designAccepted, workflowState } from "./workflow-state.mjs";
import { factChecks } from "./auto-facts.mjs";
import { blockedPhotoKeys } from "./photos.mjs";
import { emailsIn } from "../../scripts/site-flags.mjs";

export async function verifyReview(ctx, id, deps = {}, cancelled = () => false) {
  const l = rowToLead(ctx.db.prepare("SELECT * FROM leads WHERE id = ?").get(id));
  const prior = ctx.db.prepare("SELECT * FROM preparations WHERE lead_id = ?").get(id);
  const w = workflowOf(ctx.db, id);
  const snapshot = l && previewSnapshot(ctx, l);
  if (!snapshot || !["draft", "approved"].includes(l.status) || w?.decision === "declined") throw new Error("Save an active preview before running verification.");
  const mail = ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(id);
  if (contactBlocked(ctx.db, l, mail)) throw new Error("This lead may not be contacted.");
  const original = readFileSync(join(ctx.repo, "leads", `${l.slug}.json`), "utf8");
  const mailBefore = json(mail);
  const report = parse(prior?.report, {});
  let previouslyBound = false;
  try { previouslyBound = report.passed && (preparationFingerprint(ctx, l, report) === prior?.fingerprint || report.recordFingerprint === recordFingerprint(snapshot.record)); } catch { /* manual facts review is needed */ }
  const sourceBefore = new Map((report.sourceUrls ?? []).map((u) => [u, ctx.db.prepare("SELECT text FROM pages WHERE url = ?").get(u)?.text]));
  const originalRevision = w?.revision ?? 0;
  const current = () => {
    const latest = ctx.db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
    if (cancelled() || !latest || latest.slug !== l.slug || latest.status !== l.status || (workflowOf(ctx.db, id)?.revision ?? 0) !== originalRevision || contactBlocked(ctx.db, latest, ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(id))) throw new Error("The lead decision changed during verification. Nothing was approved.");
    if (readFileSync(join(ctx.repo, "leads", `${l.slug}.json`), "utf8") !== original || json(ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(id)) !== mailBefore) throw new Error("The preview or email changed during verification. Review the new version.");
  };
  ctx.db.prepare("INSERT INTO preparations (lead_id, state, updated_at) VALUES (?, 'preparing', ?) ON CONFLICT(lead_id) DO UPDATE SET state = 'preparing', updated_at = excluded.updated_at").run(id, now());
  try {
    l.sources = ctx.db.prepare("SELECT url FROM sources WHERE lead_id = ?").all(id).map((s) => s.url);
    const pages = (await (deps.readSources ?? readSources)(ctx.db, l, { refresh: true })).filter((p) => p.status === 200 && p.text);
    // Also every business page the preview cites (about, services, history), so facts are checked
    // against the page they came from. Tests that stub readSources skip the network here.
    const fetchExtra = deps.fetchPage ?? (deps.readSources ? null : fetchPage);
    for (const u of fetchExtra ? (snapshot.record.sources ?? []).filter((u) => !/unsplash\.com|kriv\.agency/.test(u) && !pages.some((p) => p.url === u)).slice(0, 6) : []) {
      try { const p = await fetchExtra(ctx.db, u, { refresh: true }); if (p.status === 200 && p.text) pages.push({ url: p.url, status: p.status, html: p.html ?? "", text: p.text.slice(0, 20000) }); } catch { /* a cited page that cannot be read leaves its facts unconfirmed */ }
    }
    current();
    if (!pages.length) throw new Error("Business sources could not be read. Retry when they are available.");
    const published = pages.flatMap((p) => emailsIn(p.text, [...String(p.html ?? "").matchAll(/href=["'](mailto:[^"']+)["']/gi)].map((m) => ({ href: m[1] }))));
    if (!l.email || !published.includes(l.email.toLowerCase())) throw new Error("The business mailbox could not be confirmed on current sources.");
    if (schemaProblems(snapshot.record).length || snapshot.record.expiresAt < now().slice(0, 10)) throw new Error("The record is invalid or expired. Review the draft first.");
    await (deps.ensureDev ?? ensureDev)(ctx.repo);
    current();
    const shot = await (deps.shoot ?? shoot)(ctx.repo, l.slug, { ...process.env, NODE_PATH: process.env.NODE_PATH || await npmRoot() });
    current();
    if (!shot.ok || shot.files.length !== 2) throw new Error("Desktop or mobile capture failed. Review the error and retry.");
    const auto = await (deps.autoChecks ?? autoChecks)(snapshot.record, { schemaOk: true, shootOk: true, allowApproved: l.status === "approved" });
    current();
    // The former hand-ticked items, checked against the pages just read (Kriv, 2026-11-03).
    const facts = factChecks({ record: snapshot.record, pages, mail: ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(id), approved: designAccepted(ctx, l, snapshot), approvedAt: w?.decision_at ?? null, blocked: blockedPhotoKeys(ctx.leadsDir) });
    const qa = qaFor(ctx, l).map((q) => {
      const key = Object.keys(auto).find((k) => q.item.startsWith(k));
      if (key) return { ...q, pass: auto[key].pass, auto: true, why: auto[key].why };
      const fact = Object.keys(facts).find((k) => q.item.startsWith(k));
      if (!fact) return q;
      // Your own tick on an item the Desk could not confirm stays; the Desk never unticks it.
      if (q.pass && !q.auto && q.by !== "desk") return q;
      return { ...q, pass: facts[fact].pass, auto: false, by: "desk", why: facts[fact].why };
    });
    const screenshots = shot.files.map((file, i) => ({ file, label: i ? "Mobile" : "Desktop" }));
    ctx.db.prepare("UPDATE drafts SET qa = ?, screenshots = ?, updated_at = ? WHERE slug = ? AND lead_id = ?").run(json(qa), json(screenshots), now(), l.slug, id);
    if (Object.keys(auto).length !== 10 || Object.values(auto).some((q) => !q.pass)) throw new Error("A technical check failed. See the verification details.");
    const sourcesUnchanged = pages.length === sourceBefore.size && pages.every((p) => sourceBefore.get(p.url) === p.text);
    const manualComplete = qa.every((q) => q.pass);
    const failed = [...new Set(qa.filter((q) => !q.pass && q.why).map((q) => q.why))];
    if (!(previouslyBound && sourcesUnchanged) && !manualComplete) throw new Error(failed.length ? `Needs your look: ${failed.join(" ")}` : "Verify the remaining business facts against the refreshed sources, then run checks again.");
    const nextReport = { passed: true, recordFingerprint: recordFingerprint(snapshot.record), sourceUrls: pages.map((p) => p.url), screenshots, checkedAt: now(), checks: Object.keys(auto),
      summary: "Business sources and technical checks verified. Review the current desktop and mobile design.", reviewer: manualComplete ? "Automatic fact checks + your design approval + technical checks" : "Unchanged source-matched facts + technical checks" };
    const fingerprint = preparationFingerprint(ctx, l, nextReport);
    ctx.db.prepare("UPDATE preparations SET state = 'ready', report = ?, fingerprint = ?, updated_at = ? WHERE lead_id = ?").run(json(nextReport), fingerprint, now(), id);
    log(ctx.db, id, "review checks complete", { by: "technical checks; no generation" });
    return { ok: true };
  } catch (e) {
    ctx.db.prepare("UPDATE preparations SET state = 'held', fingerprint = NULL, report = ?, updated_at = ? WHERE lead_id = ?").run(json({ ...report, reason: e.message, passed: false }), now(), id);
    log(ctx.db, id, "review checks need you", { reason: e.message });
    throw e;
  }
}

/**
 * The next approved design whose checks are not done and were not already tried today, or null.
 * The Desk runs these by itself (Kriv, 2026-11-03), so approving a design is the only click.
 */
export function nextAutoCheck(ctx) {
  const today = now().slice(0, 10);
  const rows = ctx.db.prepare("SELECT l.* FROM leads l JOIN lead_workflow w ON w.lead_id = l.id WHERE w.decision = 'approved' AND l.status IN ('draft', 'approved') AND l.slug IS NOT NULL ORDER BY w.decision_at").all().map(rowToLead);
  return rows.find((l) => {
    // Tried today and nothing changed since (a new approval or one of your ticks starts it again).
    const last = ctx.db.prepare("SELECT action, at FROM history WHERE lead_id = ? AND action IN ('review checks need you', 'review checks complete', 'check ticked by Kriv', 'design approved') ORDER BY id DESC LIMIT 1").get(l.id);
    if (last && last.at >= today && ["review checks need you", "review checks complete"].includes(last.action)) return false;
    if (ctx.db.prepare("SELECT state FROM preparations WHERE lead_id = ?").get(l.id)?.state === "preparing") return false;
    const s = workflowState(ctx, l);
    return s.designApproved && !s.checksReady && !s.contactBlocked && s.stage === "qa";
  }) ?? null;
}
export function startAutoCheck(ctx, l) {
  return startJob("review-checks", `Checking ${l.name} for you`, 1, (job) => verifyReview(ctx, l.id, {}, () => job.cancelled));
}

export const reviewCheckRoutes = [
  ["POST", /^\/api\/workflow\/(?<id>[^/]+)\/checks$/, (ctx) => {
    try {
      const l = ctx.db.prepare("SELECT * FROM leads WHERE id = ?").get(ctx.params.id);
      if (!l || !["draft", "approved"].includes(l.status) || workflowOf(ctx.db, l.id)?.decision === "declined") return { httpStatus: 400, body: { error: "Only an active, unpublished preview can be checked." } };
      return startJob("review-checks", `Verifying ${l.name}`, null, (job) => verifyReview(ctx, l.id, {}, () => job.cancelled));
    } catch (e) { return { httpStatus: 409, body: { error: e.message } }; }
  }],
];
