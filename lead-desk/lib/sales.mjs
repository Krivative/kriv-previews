// KRIV owns the shared business record; imported research never grants readiness.
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { now, json, parse, tx, log } from "./db.mjs";
import { findLead, upsertLead, addSource } from "./leads.mjs";
import { generateWithHarvey, probeClaude } from "./harvey-runtime.mjs";
import { PROBLEM_SENTENCES } from "./compose.mjs";
import { plain, host } from "../../scripts/finder/rules.mjs";

import { SERVICE, OFFERS, alsoLine, serviceFindings } from "./services.mjs";
export { OFFERS };
export const EVIDENCE_TYPES = { observation: "General observation", website_issue: "Website issue", booking_gap: "Booking observation", followup_gap: "Confirmed follow-up problem", social_gap: "Social media observation", search_gap: "Search visibility observation" };
const text = (max) => z.string().trim().max(max);
const publicUrl = text(2000).refine(value => {
  try {
    const u = new URL(value), h = u.hostname.replace(/^\[|\]$/g, "");
    return ["http:", "https:"].includes(u.protocol) && !u.username && !u.password && !u.port
      && !/^(localhost$|0$|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|::|fc[\da-f]{2}:|fd[\da-f]{2}:|fe80:)/i.test(h)
      && h.includes(".") && !h.endsWith(".local");
  } catch { return false; }
}, "Use a public http(s) source URL without credentials or a custom port.");
const observation = z.object({ id: text(80).min(1), type: z.enum(Object.keys(EVIDENCE_TYPES)), claim: text(1200).min(1), url: publicUrl,
  observedAt: z.iso.datetime(), confirmed: z.boolean() }).strict();
const researchSchema = z.object({ expectedRevision: z.number().int().nonnegative(), offer: z.enum(Object.keys(OFFERS)), evidence: z.array(observation).max(30) }).strict();
const draftSchema = z.object({ subject: text(160).min(1), body: text(4000).min(1), evidenceIds: z.array(text(80)).max(30) }).strict();

function fail(message, status = 400) { const e = new Error(message); e.httpStatus = status; throw e; }
function valid(schema, value) { const r = schema.safeParse(value); if (!r.success) fail(r.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ").slice(0, 800)); return r.data; }
function lead(db, id) { const l = db.prepare("SELECT * FROM leads WHERE id = ?").get(id); if (!l) fail("Business not found.", 404); return l; }
function workspace(db, id) { return db.prepare("SELECT * FROM sales_workspaces WHERE lead_id = ?").get(id) ?? { lead_id: id, revision: 0, offer: "discovery", evidence: "[]", contacts: "[]", draft: null }; }
function checkRevision(w, revision) { if (w.revision !== revision) fail("This record changed in another window. Your edits are still here; reload before saving.", 409); }
function storeWorkspace(db, id, w) {
  const previous = db.prepare("SELECT draft FROM sales_workspaces WHERE lead_id=?").get(id)?.draft;
  if (previous && previous !== w.draft) db.prepare("INSERT INTO sales_draft_versions (lead_id, draft, archived_at) VALUES (?, ?, ?)").run(id, previous, now());
  db.prepare(`INSERT INTO sales_workspaces (lead_id, revision, offer, evidence, contacts, draft, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(lead_id) DO UPDATE SET revision=excluded.revision, offer=excluded.offer, evidence=excluded.evidence, contacts=excluded.contacts, draft=excluded.draft, updated_at=excluded.updated_at`)
    .run(id, w.revision, w.offer, w.evidence, w.contacts, w.draft, now());
}

export function contactHold(db, l) {
  if (["declined", "expired"].includes(l.status)) return "This business is declined or expired. Reconsider it in the existing review workflow first.";
  const decision = db.prepare("SELECT decision, decline_scope FROM lead_workflow WHERE lead_id=?").get(l.id);
  if (decision?.decision === "declined" && decision.decline_scope === "prospect") return "This prospect was declined in the review workspace.";
  const values = [l.email, l.website].filter(Boolean);
  for (const c of parse(workspace(db, l.id).contacts, [])) values.push(c.email);
  const blocks = db.prepare("SELECT value FROM opt_outs").all().map(r => r.value.toLowerCase());
  for (const value of values) {
    let address = "", domain = "";
    if (value.includes("@") && !value.startsWith("http")) { address = value.toLowerCase(); domain = address.split("@")[1]; }
    else { try { domain = new URL(value).hostname.toLowerCase(); } catch { continue; } }
    const canonical = address.replace(/\+[^@]+(?=@)/, "");
    if (blocks.some(b => b.includes("@") ? b.replace(/\+[^@]+(?=@)/, "") === canonical : domain === b || domain.endsWith(`.${b}`))) return "This business matches the do-not-contact list.";
  }
  return "";
}

export function freshEvidence(evidence) {
  return evidence.filter(e => e.confirmed && Date.now() - Date.parse(e.observedAt) <= 30 * 86400000 && Date.parse(e.observedAt) <= Date.now());
}
// Websites lead (Kriv, 2026-11-01); then booking, social media and search, in that order.
const WHY = {
  website: "A reviewed website issue supports discussing a concept. The existing website qualification checks still apply.",
  build: "Explore the reviewed booking or follow-up observation with booking and CRM setup (KRIV Build demonstration). Confirm the need in conversation.",
  smm: "A reviewed social media observation supports offering social content (videos, shorts, image posts). Social media management fits too.",
  seo: "A reviewed search observation supports a conversation about local SEO.",
  discovery: "There is not enough reviewed evidence for a specific offer. Start by understanding their priorities.",
};
export function recommendOffer(evidence) {
  const types = new Set(freshEvidence(evidence).map(e => e.type));
  const fits = ["website", "build", "smm", "social", "seo"].filter(id => SERVICE[id].needs.some(t => types.has(t)));
  const offer = fits.find(id => WHY[id]) ?? "discovery";
  return { offer, why: WHY[offer], also: fits.filter(id => id !== offer).map(id => SERVICE[id].label) };
}

export function salesDetail(db, id) {
  const l = lead(db, id), w = workspace(db, id), evidence = parse(w.evidence, []), draft = parse(w.draft);
  const usable = freshEvidence(evidence);
  const staleDraft = !!draft && (draft.researchKey !== researchKey(w) || draft.evidenceIds.some(id => !usable.some(e => e.id === id)));
  return { business: { id: l.id, name: l.name, website: l.website, email: l.email, status: l.status, bucket: l.bucket, slug: l.slug, town: l.town, niche: l.niche },
    revision: w.revision, offer: w.offer, evidence, contacts: parse(w.contacts, []), draft, staleDraft,
    recommendation: recommendOffer(evidence), hold: contactHold(db, l),
    history: db.prepare("SELECT at, action, detail FROM history WHERE lead_id = ? AND action LIKE 'sales-%' ORDER BY id DESC LIMIT 30").all(id).map(r => ({ ...r, detail: parse(r.detail) })) };
}
function researchKey(w) { return createHash("sha256").update(w.offer + w.evidence).digest("hex"); }

export function saveResearch(db, id, body) {
  const data = valid(researchSchema, body);
  if (new Set(data.evidence.map(e => e.id)).size !== data.evidence.length) fail("Each observation must have a different ID.");
  if (data.evidence.some(e => Date.parse(e.observedAt) > Date.now() + 60000)) fail("Observation dates cannot be in the future.");
  return tx(db, () => {
    lead(db, id); const w = workspace(db, id); checkRevision(w, data.expectedRevision);
    storeWorkspace(db, id, { ...w, revision: w.revision + 1, offer: data.offer, evidence: json(data.evidence) });
    for (const e of data.evidence) addSource(db, id, "sales-research", e.url);
    log(db, id, "sales-research-saved", { offer: data.offer, observations: data.evidence.length, confirmed: data.evidence.filter(e => e.confirmed).length });
    return salesDetail(db, id);
  });
}

export function addSavedResearch(db, id, revision) {
  const l = lead(db, id), w = workspace(db, id); checkRevision(w, revision);
  const pages = db.prepare("SELECT p.url, p.text, p.fetched_at FROM pages p JOIN sources s ON s.url = p.url WHERE s.lead_id = ? AND p.status = 200 ORDER BY p.fetched_at DESC LIMIT 10").all(id);
  const evidence = parse(w.evidence, []);
  for (const p of pages) {
    const url = publicUrl.safeParse(p.url);
    if (!url.success || !p.text?.trim() || !z.iso.datetime().safeParse(p.fetched_at).success) continue;
    const key = `page-${createHash("sha256").update(p.url).digest("hex").slice(0, 20)}`;
    if (!evidence.some(e => e.id === key) && evidence.length < 30) evidence.push({ id: key, type: "observation", claim: p.text.trim().slice(0, 1200), url: p.url, observedAt: p.fetched_at, confirmed: false });
  }
  if (evidence.length === parse(w.evidence, []).length) fail(`No new saved source text is available for ${l.name}. Add a sourced observation below.`);
  return saveResearch(db, id, { expectedRevision: revision, offer: w.offer, evidence });
}

// Discovery: businesses the existing finder already found and checked. No network,
// no new provider. Check results become UNCONFIRMED observations for founder review.
export const DISCOVERY_BUCKETS = { qualified: "Qualified by the finder", near: "Near miss (no business email yet)", toReview: "Modern website (offer SEO, social media, ads or booking)" };
const NO_INITIAL = ["sent", "replied", "declined", "expired"];
function checkedAt(db, l) {
  let at = Date.parse(l.checked_at ?? "");
  if (Number.isNaN(at) && l.website) {
    try { at = Date.parse(db.prepare("SELECT checked_at FROM checks WHERE host = ?").get(host(l.website))?.checked_at ?? ""); } catch { /* no usable host */ }
  }
  return Number.isNaN(at) || at > Date.now() + 60000 ? null : new Date(at).toISOString();
}
export function checkFindings(db, l) {
  const at = checkedAt(db, l);
  const sources = db.prepare("SELECT url FROM sources WHERE lead_id = ? ORDER BY rowid").all(l.id).map(r => r.url);
  const url = [l.website, ...sources].find(u => u && publicUrl.safeParse(u).success);
  if (!at || !url) return { at, url, findings: [] };
  const findings = [];
  // Services beyond websites: social links, search description, booking links (services.mjs).
  if (l.website) {
    let check = null;
    try { check = parse(db.prepare("SELECT data FROM checks WHERE host = ?").get(host(l.website))?.data); } catch { /* no usable host */ }
    findings.push(...serviceFindings(check, l.niche));
  }
  for (const flag of parse(l.flags, [])) {
    if (flag === "not-checked") continue;
    const claim = flag === "no-website" ? "No business website was found in the directory listing."
      : flag === "unreachable" ? "The website did not load when KRIV's site check ran (dead domain, error page or certificate problem). Confirm it from your own connection."
      : PROBLEM_SENTENCES[flag] ?? `The automatic site check found: ${plain(flag)}.`;
    findings.push({ key: `flag:${flag}`, claim });
  }
  for (const item of parse(l.looks_dated, [])) if (String(item).trim()) findings.push({ key: `visual:${item}`, claim: `Visual review noted: ${String(item).trim()}.` });
  return { at, url, findings: findings.map(f => ({ id: `check-${createHash("sha256").update(f.key).digest("hex").slice(0, 16)}`, type: f.type ?? "website_issue", claim: f.claim.slice(0, 1200), url, observedAt: at, confirmed: false })) };
}

export function discoverList(db, query = {}) {
  const bucket = Object.hasOwn(DISCOVERY_BUCKETS, query.bucket) ? query.bucket : "qualified";
  const rows = db.prepare(`SELECT l.* FROM leads l LEFT JOIN sales_workspaces s ON s.lead_id = l.id
    WHERE l.bucket = ? AND l.status NOT IN (${NO_INITIAL.map(() => "?").join(",")}) AND (s.lead_id IS NULL OR s.evidence = '[]')
    ORDER BY COALESCE(l.checked_at, l.updated_at) DESC LIMIT 500`).all(bucket, ...NO_INITIAL);
  const usable = rows.filter(l => !contactHold(db, l)).map(l => ({ l, check: checkFindings(db, l) })).filter(x => x.check.findings.length);
  const niches = [...new Set(usable.map(x => x.l.niche).filter(Boolean))].sort(), states = [...new Set(usable.map(x => x.l.state).filter(Boolean))].sort();
  const items = usable.filter(x => (!query.niche || x.l.niche === query.niche) && (!query.state || x.l.state === query.state)).slice(0, 50).map(({ l, check }) => ({
    id: l.id, name: l.name, town: l.town, state: l.state, niche: l.niche, website: l.website, hasEmail: !!l.email, checkedAt: check.at,
    stale: Date.now() - Date.parse(check.at) > 30 * 86400000, findings: check.findings.map(f => f.claim) }));
  return { bucket, buckets: DISCOVERY_BUCKETS, niches, states, total: usable.length, items };
}

// Synchronous end to end, so no other request can interleave between the checks and the save.
export function discoverResearch(db, id, expectedRevision) {
  const l = lead(db, id), w = workspace(db, id), hold = contactHold(db, l);
  if (hold) fail(hold, 409);
  if (NO_INITIAL.includes(l.status)) fail("Initial outreach is already recorded or this business is closed. Continue in the existing workflow.", 409);
  const evidence = parse(w.evidence, []);
  // From the Discover list the client has no revision; only an empty workspace may be started there.
  if (expectedRevision == null) { if (evidence.length) fail("This business already has research. Open it to add the site-check findings.", 409); }
  else checkRevision(w, expectedRevision);
  const added = checkFindings(db, l).findings.filter(f => !evidence.some(e => e.id === f.id)).slice(0, Math.max(0, 30 - evidence.length));
  if (!added.length) fail(`No new site-check findings are available for ${l.name}. Run the website check again or add an observation.`);
  saveResearch(db, id, { expectedRevision: w.revision, offer: w.offer, evidence: [...evidence, ...added] });
  log(db, id, "sales-discovered", { findings: added.length, bucket: l.bucket });
  return salesDetail(db, id);
}

// RFC-4180 subset, including quoted multiline cells. No executable formulas are evaluated.
export function parseHarveyCsv(csv) {
  if (typeof csv !== "string" || csv.length > 500000) fail("Choose a CSV under 500 KB.");
  const rows = []; let row = [], cell = "", quoted = false, closed = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (quoted) { if (c === '"') { if (csv[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } } else cell += c; continue; }
    if (closed && ![",", "\r", "\n"].includes(c)) fail("Malformed CSV after a quoted field.");
    if (c === '"') { if (cell) fail("Malformed CSV quote."); quoted = true; }
    else if (c === ",") { row.push(cell); cell = ""; closed = false; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && csv[i + 1] === "\n") i++; row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; closed = false; }
    else cell += c;
  }
  if (quoted) fail("CSV contains an unclosed quoted field.");
  row.push(cell); if (row.some(Boolean)) rows.push(row);
  const headers = (rows.shift() ?? []).map(h => h.replace(/^\uFEFF/, "").trim());
  if (!headers.includes("company_name") || !headers.includes("website")) fail("Use a Harvey export with company_name and website columns.");
  if (new Set(headers).size !== headers.length || headers.some(h => ["__proto__", "constructor", "prototype"].includes(h))) fail("CSV headers must be unique field names.");
  if (!rows.length || rows.length > 100) fail("Import between 1 and 100 businesses at a time.");
  return rows.map(r => { if (r.length !== headers.length) fail("CSV rows must match the header columns."); return Object.fromEntries(headers.map((h, i) => [h, r[i]])); });
}

export function importProspects(db, body) {
  const input = typeof body.csv === "string" ? parseHarveyCsv(body.csv) : body.businesses;
  if (!Array.isArray(input) || input.length < 1 || input.length > 100) fail("Add between 1 and 100 businesses.");
  // Validate the entire batch before mutation. Import never adopts status, score or verification.
  const records = input.map(raw => valid(z.object({
    name: text(200).min(1), website: publicUrl, sourceUrl: publicUrl,
    niche: text(100).default(""), note: text(1200).default(""), email: z.union([z.email().max(254), z.literal("")]).default(""),
    emailStatus: text(40).default("unknown"), blocked: z.boolean(),
  }), { name: raw.company_name ?? raw.name, website: raw.website, sourceUrl: raw.source_url || raw.sourceUrl || raw.website,
    niche: raw.industry ?? raw.niche ?? "", note: raw.personalization ?? raw.note ?? "", email: raw.email ?? "", emailStatus: raw.email_status ?? "unknown", blocked: ["opted_out", "unsubscribed", "bounced", "invalid"].includes(raw.status) || raw.email_status === "invalid" }));
  return tx(db, () => {
    const ids = [], skipped = []; let added = 0;
    for (const r of records) {
      if (r.blocked) { skipped.push({ name: r.name, reason: "Export marks this contact as opted out or invalid." }); continue; }
      const candidate = { name: r.name, state: "", website: r.website, niche: r.niche, sources: [r.sourceUrl], via: body.csv ? "Harvey export" : "Sales workspace" };
      const prior = findLead(db, candidate);
      // DNC check before insertion, including unverified imported email.
      const blocks = db.prepare("SELECT value FROM opt_outs").all().map(x => x.value.toLowerCase());
      const domain = new URL(r.website).hostname.toLowerCase(), emailDomain = r.email.split("@")[1]?.toLowerCase();
      if (blocks.some(b => b.includes("@") ? b.replace(/\+[^@]+(?=@)/, "") === r.email.toLowerCase().replace(/\+[^@]+(?=@)/, "") : [domain, emailDomain].some(d => d && (d === b || d.endsWith(`.${b}`))))) { skipped.push({ name: r.name, reason: "Do not contact." }); continue; }
      if (prior && contactHold(db, prior)) { skipped.push({ name: r.name, reason: contactHold(db, prior) }); continue; }
      // Existing leads are not reclassified or advanced; new records await normal checks.
      const id = prior?.id ?? upsertLead(db, candidate, { bucket: "ungraded" });
      if (!prior) added++;
      const w = workspace(db, id), evidence = parse(w.evidence, []), contacts = parse(w.contacts, []);
      const key = `import-${createHash("sha256").update(r.sourceUrl + r.note).digest("hex").slice(0, 20)}`;
      if (r.note && !evidence.some(e => e.id === key) && evidence.length < 30) evidence.push({ id: key, type: "observation", claim: r.note, url: r.sourceUrl, observedAt: now(), confirmed: false });
      if (r.email && !contacts.some(c => c.email.toLowerCase() === r.email.toLowerCase()) && contacts.length < 10) contacts.push({ email: r.email, claimedStatus: r.emailStatus, source: r.sourceUrl });
      const changed = w.evidence !== json(evidence) || w.contacts !== json(contacts) || !w.updated_at;
      if (changed) { storeWorkspace(db, id, { ...w, revision: w.revision + 1, evidence: json(evidence), contacts: json(contacts) }); log(db, id, "sales-imported", { source: candidate.via, contactsNeedVerification: contacts.length }); }
      addSource(db, id, "sales-research", r.sourceUrl); ids.push(id);
    }
    return { ids: [...new Set(ids)], added, skipped };
  });
}

function draftInputs(db, id) {
  const l = lead(db, id), w = workspace(db, id), hold = contactHold(db, l);
  if (hold) fail(hold, 409);
  if (["sent", "replied"].includes(l.status)) fail("Initial outreach is already recorded. Continue in the existing email and follow-up workspace.", 409);
  const evidence = freshEvidence(parse(w.evidence, []));
  if (!evidence.length) fail("Review at least one sourced observation from the last 30 days before drafting.");
  const needs = SERVICE[w.offer]?.needs;
  if (needs && !evidence.some(e => needs.includes(e.type))) fail(`The ${SERVICE[w.offer].label} offer needs a reviewed ${needs.map(t => EVIDENCE_TYPES[t].toLowerCase()).join(" or ")}.`);
  return { l, w, evidence };
}

export function validateDraft(value, evidence) {
  const d = valid(draftSchema, value);
  if (!d.evidenceIds.length || d.evidenceIds.some(id => !evidence.some(e => e.id === id))) fail("The draft must reference reviewed evidence only.");
  if (/[\r\n]/.test(d.subject) || /<[^>]+>|\{\{|\[\[|https?:|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(d.subject + " " + d.body)) fail("Keep this initial draft plain text, with no links, addresses, HTML or placeholders.");
  if (d.body.split(/\s+/).length > 150) fail("Keep the initial draft under 150 words.");
  return d;
}

export function saveSalesDraft(db, id, body) {
  return tx(db, () => {
    const { w, evidence } = draftInputs(db, id); checkRevision(w, body.expectedRevision);
    const d = validateDraft({ subject: body.subject, body: body.body, evidenceIds: body.evidenceIds }, evidence);
    const draft = { ...d, provider: "edited", researchKey: researchKey(w), createdAt: now() };
    storeWorkspace(db, id, { ...w, revision: w.revision + 1, draft: json(draft) });
    log(db, id, "sales-draft-saved", { provider: "edited" }); return salesDetail(db, id);
  });
}

export function starterDraft(db, id, revision) {
  const { l, w, evidence } = draftInputs(db, id); checkRevision(w, revision);
  const e = evidence[0];
  const service = SERVICE[w.offer] ?? SERVICE.discovery;
  // A neutral starting point, explicitly labelled as a template, never passed off as AI.
  const draft = { subject: `A question for ${l.name}`.slice(0, 160), body: `Hello ${l.name} team,\n\nI was looking at your business and wanted to ask about your priorities. ${service.question}\n\n${alsoLine(service.id)}\n\nKriv`, evidenceIds: [(evidence.find(x => service.needs?.includes(x.type)) ?? e).id], provider: "template", researchKey: researchKey(w), createdAt: now() };
  tx(db, () => { storeWorkspace(db, id, { ...w, revision: w.revision + 1, draft: json(draft) }); log(db, id, "sales-draft-created", { provider: "template" }); });
  return salesDetail(db, id);
}

const active = new Set();
export async function assistedDraft(ctx, id, revision) {
  const { db } = ctx, { l, w, evidence } = draftInputs(db, id); checkRevision(w, revision);
  if (db.prepare("SELECT value FROM settings WHERE key = 'sales_claude_enabled'").get()?.value !== "1") fail("Enable Claude drafting in Sales settings first.", 409);
  if (active.has(db)) fail("Another Claude draft is being prepared. Wait for it to finish.", 409);
  const attempts = db.prepare("SELECT COUNT(*) n FROM sales_runs WHERE started_at >= ?").get(now().slice(0, 10)).n;
  if (attempts >= 20) fail("The daily limit of 20 drafting attempts has been reached.", 429);
  active.add(db); const runId = randomUUID();
  db.prepare("INSERT INTO sales_runs (id, lead_id, provider, status, started_at, input_revision) VALUES (?, ?, 'claude', 'running', ?, ?)").run(runId, id, now(), revision);
  try {
    const result = await (ctx.salesGenerate ?? generateWithHarvey)({ name: l.name, offer: w.offer, evidence });
    const d = validateDraft(result, evidence);
    return tx(db, () => {
      const current = draftInputs(db, id); checkRevision(current.w, revision);
      if (db.prepare("SELECT value FROM settings WHERE key = 'sales_claude_enabled'").get()?.value !== "1") fail("Claude drafting was disabled during this request. The result was not saved.", 409);
      storeWorkspace(db, id, { ...w, revision: w.revision + 1, draft: json({ ...d, provider: "claude-harvey", researchKey: researchKey(w), createdAt: now() }) });
      db.prepare("UPDATE sales_runs SET status='done', finished_at=? WHERE id=?").run(now(), runId);
      log(db, id, "sales-draft-created", { provider: "claude-harvey", runId }); return salesDetail(db, id);
    });
  } catch (e) {
    db.prepare("UPDATE sales_runs SET status='failed', finished_at=? WHERE id=?").run(now(), runId);
    log(db, id, "sales-draft-failed", { runId }); throw e;
  } finally { active.delete(db); }
}

const wrap = fn => async ctx => { try { return await fn(ctx); } catch (e) { return { httpStatus: e.httpStatus ?? 400, body: { error: e.message } }; } };
export const salesRoutes = [
  ["GET", /^\/api\/sales$/, wrap(({ db, query }) => {
    const q = `%${String(query.q ?? "").slice(0, 100)}%`;
    return { businesses: db.prepare("SELECT l.id, l.name, l.website, l.status, l.bucket, s.offer, s.draft IS NOT NULL hasDraft FROM leads l LEFT JOIN sales_workspaces s ON s.lead_id=l.id WHERE l.name LIKE ? OR l.website LIKE ? ORDER BY l.updated_at DESC LIMIT 200").all(q, q), offers: OFFERS, evidenceTypes: EVIDENCE_TYPES };
  })],
  ["GET", /^\/api\/sales\/settings$/, wrap(({ db }) => ({ enabled: db.prepare("SELECT value FROM settings WHERE key='sales_claude_enabled'").get()?.value === "1", dailyLimit: 20, provider: "Claude through Harvey components" }))],
  ["POST", /^\/api\/sales\/settings$/, wrap(({ db, body }) => {
    if (typeof body.enabled !== "boolean") fail("Choose whether Claude drafting is enabled.");
    db.prepare("INSERT INTO settings (key,value) VALUES ('sales_claude_enabled',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(body.enabled ? "1" : "0");
    log(db, null, "sales-provider-setting", { enabled: body.enabled }); return { enabled: body.enabled };
  })],
  ["POST", /^\/api\/sales\/check-provider$/, wrap(async ctx => ctx.salesProbe ? ctx.salesProbe() : probeClaude())],
  ["POST", /^\/api\/sales\/import$/, wrap(({ db, body }) => importProspects(db, body))],
  ["GET", /^\/api\/sales\/discover$/, wrap(({ db, query }) => discoverList(db, query))],
  ["POST", /^\/api\/sales\/(?<id>[^/]+)\/discover$/, wrap(({ db, params, body }) => discoverResearch(db, params.id, body.expectedRevision ?? null))],
  ["GET", /^\/api\/sales\/(?<id>[^/]+)$/, wrap(({ db, params }) => salesDetail(db, params.id))],
  ["POST", /^\/api\/sales\/(?<id>[^/]+)\/research$/, wrap(({ db, params, body }) => saveResearch(db, params.id, body))],
  ["POST", /^\/api\/sales\/(?<id>[^/]+)\/saved-research$/, wrap(({ db, params, body }) => addSavedResearch(db, params.id, body.expectedRevision))],
  ["POST", /^\/api\/sales\/(?<id>[^/]+)\/starter$/, wrap(({ db, params, body }) => starterDraft(db, params.id, body.expectedRevision))],
  ["POST", /^\/api\/sales\/(?<id>[^/]+)\/generate$/, wrap(ctx => assistedDraft(ctx, ctx.params.id, ctx.body.expectedRevision))],
  ["POST", /^\/api\/sales\/(?<id>[^/]+)\/draft$/, wrap(({ db, params, body }) => saveSalesDraft(db, params.id, body))],
];
