// Verification only. This never generates wording, replaces a record, or queues a revision.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { now, json, parse, rowToLead, log } from "./db.mjs";
import { readSources, schemaProblems } from "./builder.mjs";
import { autoChecks, ensureDev, shoot } from "./preview.mjs";
import { startJob, npmRoot } from "./jobs.mjs";
import { preparationFingerprint, recordFingerprint } from "./preparation-state.mjs";
import { previewSnapshot, qaFor, workflowOf, contactBlocked } from "./workflow-state.mjs";
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
    const qa = qaFor(ctx, l).map((q) => {
      const key = Object.keys(auto).find((k) => q.item.startsWith(k));
      return key ? { ...q, pass: auto[key].pass, auto: true, why: auto[key].why } : q;
    });
    const screenshots = shot.files.map((file, i) => ({ file, label: i ? "Mobile" : "Desktop" }));
    ctx.db.prepare("UPDATE drafts SET qa = ?, screenshots = ?, updated_at = ? WHERE slug = ? AND lead_id = ?").run(json(qa), json(screenshots), now(), l.slug, id);
    if (Object.keys(auto).length !== 10 || Object.values(auto).some((q) => !q.pass)) throw new Error("A technical check failed. See the verification details.");
    const sourcesUnchanged = pages.length === sourceBefore.size && pages.every((p) => sourceBefore.get(p.url) === p.text);
    const manualComplete = qa.filter((q) => !q.auto).length > 0 && qa.filter((q) => !q.auto).every((q) => q.pass);
    if (!(previouslyBound && sourcesUnchanged) && !manualComplete) throw new Error("Verify the remaining business facts against the refreshed sources, then run checks again.");
    const nextReport = { passed: true, recordFingerprint: recordFingerprint(snapshot.record), sourceUrls: pages.map((p) => p.url), screenshots, checkedAt: now(), checks: Object.keys(auto),
      summary: "Business sources and technical checks verified. Review the current desktop and mobile design.", reviewer: manualComplete ? "Founder fact review + technical checks" : "Unchanged source-matched facts + technical checks" };
    const fingerprint = preparationFingerprint(ctx, l, nextReport);
    ctx.db.prepare("UPDATE preparations SET state = 'ready', report = ?, fingerprint = ?, updated_at = ? WHERE lead_id = ?").run(json(nextReport), fingerprint, now(), id);
    log(ctx.db, id, "review checks complete", { by: "technical checks; no generation" });
    return { ok: true };
  } catch (e) {
    ctx.db.prepare("UPDATE preparations SET state = 'held', fingerprint = NULL, report = ?, updated_at = ? WHERE lead_id = ?").run(json({ ...report, reason: e.message, passed: false }), now(), id);
    throw e;
  }
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
