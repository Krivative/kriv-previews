// Synthetic fixtures shared by unit and isolated browser checks. Never opens a user database.
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb, now, json } from "../../lead-desk/lib/db.mjs";
import { upsertLead } from "../../lead-desk/lib/leads.mjs";
import { toRecord } from "../../lead-desk/lib/builder.mjs";
import { routes } from "../../lead-desk/lib/api.mjs";
import { previewSnapshot, mailVersion, workflowOf } from "../../lead-desk/lib/workflow-state.mjs";
import { qaChecklist } from "../../lead-desk/lib/preview.mjs";

export function reviewFixture(file = ":memory:") {
  const repo = mkdtempSync(join(tmpdir(), "kriv-workflow-test-"));
  for (const folder of ["docs", "leads", "data", "shots", "src/sections"]) mkdirSync(join(repo, folder), { recursive: true });
  copyFileSync(join(process.cwd(), "docs", "LEAD-QA.md"), join(repo, "docs", "LEAD-QA.md"));
  writeFileSync(join(repo, "src/sections/Sections.tsx"), "synthetic presentation v1");
  const db = openDb(file === ":temp:" ? join(repo, "data", "synthetic.db") : file);
  const ctx = { db, repo, leadsDir: join(repo, "data"), reportsDir: join(repo, "data") };
  const call = (method, url, body = {}) => {
    const u = new URL(url, "http://synthetic-desk.test");
    for (const [m, re, fn] of routes) {
      const match = m === method && u.pathname.match(re);
      if (match) return fn({ ...ctx, params: match.groups ?? {}, query: Object.fromEntries(u.searchParams), body });
    }
    throw new Error(`No synthetic route ${method} ${url}`);
  };
  const add = (name = "Example Air", options = {}) => {
    const slug = name.toLowerCase().replace(/[^a-z]+/g, "-");
    const site = `https://${slug}.example/`;
    const id = upsertLead(db, { name, state: options.state ?? "FL", town: "Example Town", niche: options.niche ?? "hvac", website: site, email: `office@${slug}.example` }, { bucket: "qualified", status: options.status ?? "draft" });
    const form = { slug, template: options.template ?? "hvac-calm", photos: [], f: { name: { v: name, s: site }, category: { v: "Synthetic test business", s: site }, city: { v: "Example Town", s: site }, region: { v: "FL", s: site }, headline: { v: "A fictional website for testing.", s: site }, sub: { v: "Synthetic data only. No real business or private information.", s: site } }, lists: { services: [{ name: "Example service", blurb: "A verified fixture description.", s: site }], hours: [], custom: [] } };
    const record = toRecord(form);
    record.status = options.status === "approved" ? "approved" : "draft";
    writeFileSync(join(repo, "leads", `${slug}.json`), json(record));
    const shots = ["desktop", "mobile"].map((label) => { const file = join(repo, "shots", `${slug}-${label}.png`); writeFileSync(file, `synthetic ${label} fixture`); return { file, label }; });
    const t = now();
    const qa = options.qa ? qaChecklist(repo).map((q) => ({ ...q, pass: true })) : [];
    db.prepare("INSERT INTO drafts (slug, lead_id, template, qa, screenshots, form, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(slug, id, record.template, json(qa), json(shots), json(form), t, t);
    db.prepare("UPDATE leads SET slug = ? WHERE id = ?").run(slug, id);
    db.prepare("INSERT INTO emails (lead_id, to_addr, subject, body, status, updated_at) VALUES (?, ?, 'Your concept website', ?, ?, ?)").run(id, `office@${slug}.example`, `A fictional concept at https://kriv.agency/${slug}`, options.status === "sent" || options.status === "replied" ? "sent" : "draft", t);
    db.prepare("INSERT INTO sources (lead_id, field, url) VALUES (?, 'website', ?)").run(id, site);
    db.prepare("INSERT INTO pages (url, status, text, html, fetched_at) VALUES (?, 200, ?, '', ?)").run(site, `${name}. office@${slug}.example. Example service.`, t);
    return id;
  };
  const view = (id) => call("GET", `/api/workflow/${id}`);
  let requests = 0;
  const decide = (id, decision, extra = {}) => {
    const s = view(id).state;
    return call("POST", `/api/workflow/${id}/decision`, { expectedRevision: s.revision, previewVersion: s.previewVersion, requestId: `test-request-${++requests}`, decision, ...extra });
  };
  const emailReview = (id) => { const s = view(id).state; return call("POST", `/api/workflow/${id}/email-review`, { expectedRevision: s.revision, emailVersion: s.emailVersion }); };
  const approvePublication = (id) => { const s = view(id).state; return call("POST", `/api/leads/${id}/approve`, { expectedRevision: s.revision, publicationVersion: s.publicationVersion }); };
  const row = (id) => db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
  return { ...ctx, ctx, call, add, view, decide, emailReview, approvePublication, row, snapshot: (id) => previewSnapshot(ctx, row(id)), workflow: (id) => workflowOf(db, id), mailVersion: (id) => mailVersion(db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(id)) };
}
