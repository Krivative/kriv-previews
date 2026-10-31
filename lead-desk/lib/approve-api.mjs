// Approve and Publish. Only Kriv's clicks in the desk call these (the page's token); Claude and
// scripts never approve or publish. Approval needs a current prepared offer or the advanced
// manual QA checklist, plus an email draft; publishing needs a second, explicit confirm click.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { now, parse, log, rowToLead, isOptedOut, tx } from "./db.mjs";
import { openBlanks } from "./compose.mjs";
import { qaState } from "./build-api.mjs";
import { plan, startPublish, startLiveVerification, WORKTREE } from "./publish.mjs";
import { preparationReadiness } from "./preparation-state.mjs";
import { designAccepted, reviewBlockers, workflowOf, publicationVersion, contactBlocked, pendingPublication } from "./workflow-state.mjs";

const bad = (msg, status = 400) => ({ httpStatus: status, body: { error: msg } });
const lead = (db, id) => rowToLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(id));

/** Why this draft can't be approved yet; empty when it can. */
export function approveBlockers(ctx, l) {
  const out = [];
  if (!["draft", "approved"].includes(l.status)) return [`The lead is ${l.status}, not an unpublished preview.`];
  if (!designAccepted(ctx, l)) out.push("Review and approve the current design first.");
  out.push(...reviewBlockers(ctx, l).filter((b) => !out.includes(b)));
  const d = ctx.db.prepare("SELECT * FROM drafts WHERE slug = ?").get(l.slug);
  if (!d) return ["No preview saved."];
  const qa = qaState(ctx.repo, parse(d.qa, []));
  const open = qa.filter((q) => !q.pass);
  const prepared = preparationReadiness(ctx, l);
  if (prepared.managed) {
    if (!prepared.ready) out.push(prepared.reason);
  } else if (open.length) out.push(`${open.length} QA item${open.length > 1 ? "s" : ""} not ticked yet.`);
  const mail = ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id);
  if (!mail?.to_addr || !mail?.subject?.trim() || !mail?.body?.trim()) out.push("No complete email draft yet (every lead gets one): write it on the Email screen.");
  else if (openBlanks(mail.subject, mail.body).length) out.push("The email draft still has [[blanks]].");
  if (isOptedOut(ctx.db, l.email) || isOptedOut(ctx.db, mail?.to_addr)) out.push("The address is on the do-not-contact list.");
  return out;
}

export function approveLead(ctx, id) {
  const l = lead(ctx.db, id);
  if (!l) return bad("no such lead", 404);
  const w = workflowOf(ctx.db, id);
  if (w && (ctx.body?.publicationVersion !== publicationVersion(ctx, l) || ctx.body.expectedRevision !== w.revision)) return bad("The publication review changed. Reload before approving it.", 409);
  const blockers = approveBlockers(ctx, l);
  if (blockers.length) return bad(blockers.join(" "));
  if (ctx.body?.publicationVersion && ctx.body.publicationVersion !== publicationVersion(ctx, l)) return bad("The publication review changed. Reload before approving it.", 409);
  if (l.status === "approved" && (!workflowOf(ctx.db, id) || workflowOf(ctx.db, id).publication_version === publicationVersion(ctx, l))) return { ok: true, status: "approved" };
  const file = join(ctx.repo, "leads", `${l.slug}.json`);
  const rec = JSON.parse(readFileSync(file, "utf8"));
  rec.status = "approved";
  writeFileSync(file, JSON.stringify(rec, null, 2) + "\n");
  tx(ctx.db, () => {
    ctx.db.prepare("UPDATE lead_workflow SET publication_version = ?, revision = revision + 1, updated_at = ? WHERE lead_id = ?").run(publicationVersion(ctx, l), now(), l.id);
    ctx.db.prepare("UPDATE leads SET status = 'approved', updated_at = ? WHERE id = ?").run(now(), l.id);
    log(ctx.db, l.id, "status", { from: "draft", to: "approved", by: "Kriv" });
  });
  return { ok: true, status: "approved" };
}

function card(ctx, l) {
  const d = ctx.db.prepare("SELECT * FROM drafts WHERE slug = ?").get(l.slug);
  const qa = qaState(ctx.repo, parse(d?.qa, []));
  const mail = ctx.db.prepare("SELECT subject, status FROM emails WHERE lead_id = ?").get(l.id);
  return {
    id: l.id, name: l.name, town: l.town, state: l.state, niche: l.niche, slug: l.slug, status: l.status, template: d?.template,
    screenshots: parse(d?.screenshots, []), facts: parse(d?.facts, []), qaDone: qa.filter((q) => q.pass).length, qaTotal: qa.length,
    email: mail ?? null, blockers: l.status === "draft" ? approveBlockers(ctx, l) : [],
  };
}

export const approveRoutes = [
  ["GET", /^\/api\/approve$/, (ctx) => {
    const q = (sql) => ctx.db.prepare(sql).all().map(rowToLead);
    return {
      worktree: WORKTREE,
      drafts: q("SELECT * FROM leads WHERE status = 'draft' AND slug IS NOT NULL ORDER BY updated_at DESC").map((l) => card(ctx, l)),
      approved: q("SELECT * FROM leads WHERE status = 'approved' AND slug IS NOT NULL ORDER BY updated_at DESC").map((l) => card(ctx, l)),
      takedowns: q("SELECT * FROM leads WHERE status = 'expired' AND slug IS NOT NULL AND id IN (SELECT lead_id FROM history WHERE action = 'opt-out') AND id NOT IN (SELECT lead_id FROM history WHERE action = 'taken down')").map((l) => card(ctx, l)),
    };
  }],
  ["POST", /^\/api\/leads\/(?<id>[^/]+)\/approve$/, (ctx) => approveLead(ctx, ctx.params.id)],
  // What a publish would change, for the confirm panel. Changes nothing.
  ["POST", /^\/api\/leads\/(?<id>[^/]+)\/publish\/plan$/, async (ctx) => {
    const l = lead(ctx.db, ctx.params.id);
    if (!l?.slug) return bad("no preview", 404);
    const status = l.status === "expired" ? "expired" : "approved";
    if (status === "approved" && l.status !== "approved") return bad("Only an approved page can be published.");
    if (status === "approved" && pendingPublication(ctx.db, l.id)) return bad("Publication is awaiting live verification. Check the published page instead of publishing again.");
    if (status === "approved" && workflowOf(ctx.db, l.id) && ctx.body.publicationVersion !== publicationVersion(ctx, l)) return bad("Reload the current publication review.", 409);
    const prepared = preparationReadiness(ctx, l);
    if (status === "approved" && prepared.managed && !prepared.ready) return bad(prepared.reason);
    if (status === "approved" && (contactBlocked(ctx.db, l, ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id)) || reviewBlockers(ctx, l).length || (workflowOf(ctx.db, l.id) && workflowOf(ctx.db, l.id).publication_version !== publicationVersion(ctx, l)))) return bad("Publication approval or contact permission changed. Review readiness again.");
    return plan(ctx.repo, l.slug, status);
  }],
  // Kriv's confirm click. `confirm` must repeat the slug shown in the confirm panel.
  ["POST", /^\/api\/leads\/(?<id>[^/]+)\/publish$/, (ctx) => {
    const l = lead(ctx.db, ctx.params.id);
    if (!l?.slug) return bad("no preview", 404);
    if (ctx.body.confirm !== l.slug) return bad("Publishing needs the confirm click.");
    const status = l.status === "expired" ? "expired" : "approved";
    if (status === "approved" && l.status !== "approved") return bad("Only an approved page can be published.");
    if (status === "approved" && pendingPublication(ctx.db, l.id)) return bad("Publication is awaiting live verification. Check the published page instead of publishing again.");
    if (status === "approved" && workflowOf(ctx.db, l.id) && ctx.body.publicationVersion !== publicationVersion(ctx, l)) return bad("Reload the current publication review.", 409);
    const prepared = preparationReadiness(ctx, l);
    if (status === "approved" && prepared.managed && !prepared.ready) return bad(prepared.reason);
    if (status === "approved" && (contactBlocked(ctx.db, l, ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id)) || reviewBlockers(ctx, l).length || (workflowOf(ctx.db, l.id) && workflowOf(ctx.db, l.id).publication_version !== publicationVersion(ctx, l)))) return bad("Publication approval or contact permission changed. Review readiness again.");
    try { return startPublish(ctx, l, { status, dryRun: !!ctx.body.dryRun }); } catch (e) { return bad(e.message); }
  }],
  ["POST", /^\/api\/leads\/(?<id>[^/]+)\/verify-live$/, (ctx) => {
    const l = lead(ctx.db, ctx.params.id);
    if (!l || l.status !== "approved" || !pendingPublication(ctx.db, l.id)) return bad("There is no publication awaiting verification.");
    try { return startLiveVerification(ctx, l); } catch (e) { return bad(e.message); }
  }],
];
