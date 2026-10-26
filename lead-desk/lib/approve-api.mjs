// Approve and Publish. Only Kriv's clicks in the desk call these (the page's token); Claude and
// scripts never approve or publish. Approval needs every QA item ticked and an email draft
// (every lead gets one); publishing needs a second, explicit confirm click.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { now, parse, log, rowToLead, isOptedOut, tx } from "./db.mjs";
import { openBlanks } from "./compose.mjs";
import { qaState } from "./build-api.mjs";
import { plan, startPublish, WORKTREE } from "./publish.mjs";

const bad = (msg, status = 400) => ({ httpStatus: status, body: { error: msg } });
const lead = (db, id) => rowToLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(id));

/** Why this draft can't be approved yet; empty when it can. */
export function approveBlockers(ctx, l) {
  const out = [];
  if (l.status !== "draft") return [`The lead is ${l.status}, not a draft.`];
  const d = ctx.db.prepare("SELECT * FROM drafts WHERE slug = ?").get(l.slug);
  if (!d) return ["No preview saved."];
  const qa = qaState(ctx.repo, parse(d.qa, []));
  const open = qa.filter((q) => !q.pass);
  if (open.length) out.push(`${open.length} QA item${open.length > 1 ? "s" : ""} not ticked yet.`);
  const mail = ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id);
  if (!mail?.subject || !mail?.body) out.push("No email draft yet (every lead gets one): write it on the Email screen.");
  else if (openBlanks(mail.subject, mail.body).length) out.push("The email draft still has [[blanks]].");
  if (isOptedOut(ctx.db, l.email) || isOptedOut(ctx.db, mail?.to_addr)) out.push("The address is on the do-not-contact list.");
  return out;
}

export function approveLead(ctx, id) {
  const l = lead(ctx.db, id);
  if (!l) return bad("no such lead", 404);
  const blockers = approveBlockers(ctx, l);
  if (blockers.length) return bad(blockers.join(" "));
  const file = join(ctx.repo, "leads", `${l.slug}.json`);
  const rec = JSON.parse(readFileSync(file, "utf8"));
  rec.status = "approved";
  writeFileSync(file, JSON.stringify(rec, null, 2) + "\n");
  tx(ctx.db, () => {
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
    return plan(ctx.repo, l.slug, status);
  }],
  // Kriv's confirm click. `confirm` must repeat the slug shown in the confirm panel.
  ["POST", /^\/api\/leads\/(?<id>[^/]+)\/publish$/, (ctx) => {
    const l = lead(ctx.db, ctx.params.id);
    if (!l?.slug) return bad("no preview", 404);
    if (ctx.body.confirm !== l.slug) return bad("Publishing needs the confirm click.");
    const status = l.status === "expired" ? "expired" : "approved";
    if (status === "approved" && l.status !== "approved") return bad("Only an approved page can be published.");
    try { return startPublish(ctx, l, { status, dryRun: !!ctx.body.dryRun }); } catch (e) { return bad(e.message); }
  }],
];
