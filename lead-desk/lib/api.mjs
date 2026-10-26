// HTTP handlers: [method, path regex, handler]. Handlers get { db, repo, leadsDir, reportsDir,
// params, query, body } and return a JSON-able value or { httpStatus, body } for an error.
import { FREE_MAIL } from "../../scripts/site-flags.mjs";
import { now, parse, log, rowToLead, isOptedOut, tx } from "./db.mjs";
import { setStatus, STATUSES } from "./leads.mjs";
import { importAll } from "./import.mjs";
import { rerunRules } from "./pipeline.mjs";
import { outreachRoutes } from "./outreach-api.mjs";
import { workRoutes } from "./work-api.mjs";
import { reviewRoutes } from "./review-api.mjs";
import { buildRoutes } from "./build-api.mjs";
import { approveRoutes, approveLead } from "./approve-api.mjs";
import { aiRoutes } from "./ai-api.mjs";

const bad = (msg, status = 400) => ({ httpStatus: status, body: { error: msg } });
const leadOr404 = (db, id) => db.prepare("SELECT * FROM leads WHERE id = ?").get(id);

export const NICHES = { dental: "Dental", hvac: "HVAC", chiro: "Chiropractic", medspa: "Med spa", plumbing: "Plumbing", auto: "Auto repair" };

/** What Kriv has to do next, newest work first. */
export function needsKriv(db) {
  const out = [];
  const q = (sql, ...a) => db.prepare(sql).all(...a);
  for (const l of q("SELECT id, name FROM leads WHERE status = 'draft' ORDER BY updated_at DESC")) out.push({ kind: "approve", id: l.id, title: `Approve or decline the preview for ${l.name}`, screen: "approve" });
  for (const l of q("SELECT id, name FROM leads WHERE status = 'approved' ORDER BY updated_at DESC")) out.push({ kind: "publish", id: l.id, title: `Publish ${l.name} (approved, not live yet)`, screen: "approve" });
  for (const l of q("SELECT l.id, l.name FROM leads l LEFT JOIN emails e ON e.lead_id = l.id WHERE l.status = 'live' AND COALESCE(e.status, 'draft') != 'sent' ORDER BY l.updated_at DESC")) out.push({ kind: "email", id: l.id, title: `Send the email to ${l.name} (page is live)`, screen: "email" });
  for (const l of q("SELECT l.id, l.name FROM leads l JOIN linkedin k ON k.lead_id = l.id WHERE k.status = 'to send' AND l.status IN ('live', 'sent', 'replied')")) out.push({ kind: "linkedin", id: l.id, title: `LinkedIn note to ${l.name}`, screen: "linkedin" });
  for (const l of q("SELECT id, name FROM leads WHERE status = 'expired' AND slug IS NOT NULL AND id IN (SELECT lead_id FROM history WHERE action = 'opt-out')")) out.push({ kind: "takedown", id: l.id, title: `Take down ${l.name}'s page (opted out)`, screen: "approve" });
  const build = q("SELECT COUNT(*) n FROM leads WHERE bucket = 'qualified' AND status = 'found'")[0].n;
  if (build) out.push({ kind: "build", title: `${build} qualified lead${build > 1 ? "s" : ""} without a preview`, screen: "review" });
  const review = q("SELECT COUNT(*) n FROM leads WHERE bucket = 'toReview' AND status = 'found'")[0].n;
  if (review) out.push({ kind: "visual", title: `${review} sites waiting for the visual review`, screen: "review" });
  return out;
}

function summary({ db }) {
  const count = (col) => Object.fromEntries(db.prepare(`SELECT COALESCE(${col}, '') k, COUNT(*) n FROM leads GROUP BY ${col}`).all().map((r) => [r.k, r.n]));
  return {
    total: db.prepare("SELECT COUNT(*) n FROM leads").get().n,
    byStatus: count("status"), byBucket: count("bucket"), byState: count("state"), byNiche: count("niche"),
    emailsSent: db.prepare("SELECT COUNT(*) n FROM emails WHERE status = 'sent'").get().n,
    linkedinSent: db.prepare("SELECT COUNT(*) n FROM linkedin WHERE status != 'to send'").get().n,
    needs: needsKriv(db),
    setup: db.prepare("SELECT * FROM setup_tasks ORDER BY done, id").all().map((t) => ({ ...t, done: !!t.done, links: parse(t.links, []) })),
    optOuts: db.prepare("SELECT * FROM opt_outs ORDER BY at DESC").all(),
    importedAt: db.prepare("SELECT value FROM settings WHERE key = 'imported_at'").get()?.value ?? null,
    niches: NICHES,
  };
}

function listLeads({ db, query }) {
  const where = [], args = [];
  for (const col of ["status", "bucket", "state", "niche"]) {
    if (query[col]) { const vals = query[col].split(","); where.push(`l.${col} IN (${vals.map(() => "?").join(",")})`); args.push(...vals); }
  }
  if (query.q) { where.push("(l.name LIKE ? OR l.website LIKE ? OR l.town LIKE ? OR l.email LIKE ?)"); args.push(...Array(4).fill(`%${query.q}%`)); }
  if (query.linkedin === "1") where.push("k.lead_id IS NOT NULL");
  const sql = `SELECT l.id, l.name, l.state, l.town, l.niche, l.website, l.email, l.website_status, l.bucket, l.status, l.slug, l.updated_at, l.note,
      l.looks_dated, e.status AS email_status, k.status AS linkedin_status, c.shot
    FROM leads l LEFT JOIN emails e ON e.lead_id = l.id LEFT JOIN linkedin k ON k.lead_id = l.id
    LEFT JOIN checks c ON c.host = l.key
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY l.updated_at DESC, l.name LIMIT ${Math.min(Number(query.limit ?? 500), 2000)}`;
  return db.prepare(sql).all(...args).map((r) => ({ ...r, looks_dated: parse(r.looks_dated, []), optedOut: isOptedOut(db, r.email) }));
}

function getLead({ db, params }) {
  const l = rowToLead(leadOr404(db, params.id));
  if (!l) return bad("no such lead", 404);
  const check = db.prepare("SELECT * FROM checks WHERE host = ?").get(l.key);
  const draft = l.slug ? db.prepare("SELECT * FROM drafts WHERE slug = ?").get(l.slug) : null;
  return {
    ...l,
    optedOut: isOptedOut(db, l.email),
    sources: db.prepare("SELECT field, url FROM sources WHERE lead_id = ? ORDER BY field").all(l.id),
    check: check ? { ...parse(check.data), shot: check.shot } : null,
    visual: parse(db.prepare("SELECT failed FROM visual WHERE host = ?").get(l.key)?.failed, null),
    draft: draft ? { ...draft, facts: parse(draft.facts, []), qa: parse(draft.qa, []), screenshots: parse(draft.screenshots, []) } : null,
    outreach: db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id) ?? null,
    linkedin: db.prepare("SELECT * FROM linkedin WHERE lead_id = ?").get(l.id) ?? null,
    history: db.prepare("SELECT at, action, detail FROM history WHERE lead_id = ? ORDER BY at DESC, id DESC").all(l.id).map((h) => ({ ...h, detail: parse(h.detail, h.detail) })),
  };
}

// Kriv's clicks. "approved" is only ever set from the desk's Approve buttons (with the QA and
// email checks in approve-api.mjs); Claude and scripts never call it.
function postStatus(ctx) {
  const { db, params, body } = ctx;
  const l = leadOr404(db, params.id);
  if (!l) return bad("no such lead", 404);
  if (!STATUSES.includes(body.status)) return bad("unknown status");
  if (["live", "sent", "replied", "draft", "expired"].includes(body.status)) return bad(`${body.status} is set by Publish, Build, Email or an opt-out, not by hand`);
  if (body.status === "approved") {
    const r = approveLead(ctx, l.id);
    if (r.httpStatus) return r;
  } else setStatus(db, l.id, body.status);
  return getLead({ db, params });
}

function postNote({ db, params, body }) {
  if (!leadOr404(db, params.id)) return bad("no such lead", 404);
  const note = String(body.note ?? "").trim() || null;
  db.prepare("UPDATE leads SET note = ?, updated_at = ? WHERE id = ?").run(note, now(), params.id);
  log(db, params.id, "note", note);
  return { ok: true };
}

/**
 * Do-not-contact (docs/OUTREACH.md): the address and its domain, unless the domain is a free-mail
 * provider (blocking gmail.com would block every Gmail business). Matching leads become expired.
 * @param {import("node:sqlite").DatabaseSync} db
 * @param {{ value: string, reason?: string | null, leadId?: string | null }} opt
 */
export function addOptOut(db, { value, reason = null, leadId = null }) {
  const v = String(value ?? "").trim().toLowerCase().replace(/^mailto:/, "");
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$|^[a-z0-9.-]+\.[a-z]{2,}$/.test(v)) throw new Error("enter an email address or a domain");
  const values = v.includes("@") ? [v, ...(FREE_MAIL.test(v.split("@")[1]) ? [] : [v.split("@")[1]])] : [v];
  return tx(db, () => {
    for (const x of values) db.prepare("INSERT OR IGNORE INTO opt_outs (value, kind, reason, at) VALUES (?, ?, ?, ?)").run(x, x.includes("@") ? "email" : "domain", reason, now());
    const hit = db.prepare("SELECT id, email FROM leads WHERE email IS NOT NULL").all().filter((l) => isOptedOut(db, l.email)).map((l) => l.id);
    const ids = [...new Set([...hit, ...(leadId ? [leadId] : [])])];
    for (const id of ids) {
      db.prepare("UPDATE leads SET status = 'expired', updated_at = ? WHERE id = ?").run(now(), id);
      log(db, id, "opt-out", { values, reason });
    }
    return { added: values, expired: ids };
  });
}

export const routes = [
  ["GET", /^\/api\/summary$/, summary],
  ["GET", /^\/api\/leads$/, listLeads],
  ["GET", /^\/api\/leads\/(?<id>[^/]+)$/, getLead],
  ["POST", /^\/api\/leads\/(?<id>[^/]+)\/status$/, postStatus],
  ["POST", /^\/api\/leads\/(?<id>[^/]+)\/note$/, postNote],
  ["POST", /^\/api\/optouts$/, ({ db, body }) => { try { return addOptOut(db, body); } catch (e) { return bad(e.message); } }],
  ["POST", /^\/api\/setup\/(?<id>\d+)$/, ({ db, params, body }) => {
    db.prepare("UPDATE setup_tasks SET done = ? WHERE id = ?").run(body.done ? 1 : 0, Number(params.id));
    return { ok: true };
  }],
  ["POST", /^\/api\/import$/, async ({ db }) => importAll(db)],
  ["POST", /^\/api\/rules$/, async ({ db }) => rerunRules(db)],
  ...outreachRoutes,
  ...workRoutes,
  ...reviewRoutes,
  ...buildRoutes,
  ...approveRoutes,
  ...aiRoutes,
  ["GET", /^\/api\/history$/, ({ db }) => db.prepare("SELECT h.at, h.lead_id, l.name, h.action, h.detail FROM history h LEFT JOIN leads l ON l.id = h.lead_id ORDER BY h.at DESC, h.id DESC LIMIT 100").all()],
];
