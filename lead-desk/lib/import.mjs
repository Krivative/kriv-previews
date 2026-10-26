// Imports everything found so far into the Lead Desk database. Safe to run again: records are
// merged by website, listing URL or phone, and statuses only move forward.
//   node lead-desk/lib/import.mjs            (reads C:\Users\user\kriv-leads, kriv-reports, leads/)
// Sources, all outside Git except leads/*.json:
//   kriv-leads/drafts.json, emails/*.txt     built previews, facts, QA, screenshots, email drafts
//   kriv-leads/qualified.json, near-misses.json, not-checked.json, review/visual-candidates.json
//   kriv-leads/linkedin.json                 LinkedIn contacts and notes
//   kriv-leads/import/desk-decisions/        Kriv's clicks on the old Lead Desk artifact
//   kriv-leads/import/raw/                   raw finder data: listings, check-site batches, visual.json
//   kriv-reports/data/setup-tasks.json       Kriv's setup tasks
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { host, fromHotfrog, fromChamber, candidateMap } from "../../scripts/finder/rules.mjs";
import { flagsFor } from "../../scripts/site-flags.mjs";
import { emailFooter } from "../../src/outreach/footer.ts";
import { openDb, now, json, slugify, log, tx } from "./db.mjs";
import { upsertLead, addSource, laterStatus } from "./leads.mjs";
import { rerunRules } from "./pipeline.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const J = (p, d = null) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8").replace(/^\uFEFF/, "")) : d);
const ls = (d, re) => (existsSync(d) ? readdirSync(d).filter((f) => re.test(f)) : []);

/** "To: x\nSubject: y\n\nbody" -> { to, subject, body } with the standard footer removed. */
export function parseEmailFile(text) {
  const t = text.replace(/\r\n/g, "\n");
  const to = t.match(/^To:\s*(.*)$/m)?.[1].trim() ?? null;
  const subject = t.match(/^Subject:\s*(.*)$/m)?.[1].trim() ?? null;
  let body = t.slice(t.indexOf("\n\n") + 2);
  const footer = emailFooter();
  const i = body.lastIndexOf(footer.split("\n")[0] + "\n" + footer.split("\n")[1]);
  if (i >= 0) body = body.slice(0, i);
  return { to, subject, body: body.replace(/\s+$/, "") };
}

export async function importAll(db, { leadsDir = join(homedir(), "kriv-leads"), reportsDir = join(homedir(), "kriv-reports"), repoDir = repo, hasMx } = {}) {
  const counts = {};
  const bump = (k, n = 1) => (counts[k] = (counts[k] ?? 0) + n);
  const t = now();

  tx(db, () => {
    // Setup tasks.
    for (const s of J(join(reportsDir, "data", "setup-tasks.json"), [])) {
      db.prepare("INSERT INTO setup_tasks (title, when_text, what, done, links) VALUES (?, ?, ?, ?, ?) ON CONFLICT(title) DO UPDATE SET when_text = excluded.when_text, what = excluded.what, done = MAX(done, excluded.done), links = excluded.links")
        .run(s.title, s.when ?? null, s.what ?? null, s.done ? 1 : 0, json(s.links ?? []));
      bump("setup tasks");
    }

    // Raw finder data: listings, check results, visual grades.
    const raw = join(leadsDir, "import", "raw");
    const { cands, add } = candidateMap();
    for (const f of ls(raw, /^r\d+-search\.txt$/)) for (const line of readFileSync(join(raw, f), "utf8").split(/\r?\n/)) {
      if (!line.trim() || line.startsWith("#")) continue;
      const [state, town, niche, url] = line.split("|");
      add({ state, town, niche, website: url, sources: [url], via: "web search" });
    }
    for (const c of J(join(raw, "candidates.json"))?.withSite ?? []) add({ state: "TX", town: "San Antonio", niche: c.niche, website: c.url, sources: [c.url], via: c.found.join("+") });
    for (const c of J(join(raw, "dir-candidates.json"), [])) add({ state: "TX", town: "San Antonio", niche: c.niche, website: c.website, sources: [c.website, c.directoryUrl], via: "directory" });
    for (const f of ls(raw, /^hotfrog.*\.json$/)) for (const h of J(join(raw, f), [])) add(fromHotfrog(h));
    for (const f of ls(raw, /^chamber.*\.json$/)) for (const m of J(join(raw, f), [])) add(fromChamber(m));
    const putCand = db.prepare("INSERT INTO candidates (key, data, found_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data");
    for (const [k, c] of cands) { putCand.run(k, json(c), t); bump("raw listings"); }
    const putCheck = db.prepare("INSERT INTO checks (host, data, checked_at) VALUES (?, ?, ?) ON CONFLICT(host) DO UPDATE SET data = excluded.data, checked_at = excluded.checked_at WHERE excluded.checked_at >= checks.checked_at OR checks.checked_at IS NULL");
    const checkFiles = [join(raw, "checks-all.json"), ...ls(join(raw, "batches"), /\.json$/).map((f) => join(raw, "batches", f))];
    for (const f of checkFiles) for (const r of J(f, [])) {
      const h = host(r.url);
      if (!h) continue;
      if (!r.flags) Object.assign(r, flagsFor(r));
      putCheck.run(h, json(r), r.checkedAt ?? null);
      bump("site checks");
    }
    for (const [h, v] of Object.entries(J(join(raw, "visual.json"), {}))) {
      db.prepare("INSERT INTO visual (host, failed, at, by) VALUES (?, ?, ?, ?) ON CONFLICT(host) DO NOTHING").run(h, json(v.failed ?? []), t, "Claude (imported)");
      bump("visual grades");
    }

    // Built previews: lead, draft, email.
    const drafts = J(join(leadsDir, "drafts.json"), []);
    for (const d of drafts) {
      const status = d.status === "sent" ? "sent" : d.status === "draft" ? "draft" : d.live ? "live" : "approved";
      const id = upsertLead(db, { ...d, sources: d.facts?.map((f) => f.source) ?? [] }, { id: d.deskId ?? d.slug, status, bucket: "qualified" });
      db.prepare("UPDATE leads SET slug = ? WHERE id = ?").run(d.slug, id);
      for (const f of d.facts ?? []) addSource(db, id, f.label, f.source);
      db.prepare(`INSERT INTO drafts (slug, lead_id, template, facts, qa, screenshots, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET template = excluded.template, facts = excluded.facts, qa = excluded.qa, screenshots = excluded.screenshots, updated_at = excluded.updated_at`)
        .run(d.slug, id, d.template ?? null, json(d.facts ?? []), json(d.qa ?? []), json((d.screenshots ?? []).map((s) => ({ ...s, file: join(reportsDir, s.file) }))), t, t);
      const file = d.emailFile && existsSync(d.emailFile) ? d.emailFile : join(leadsDir, "emails", `${d.slug}.txt`);
      const mail = existsSync(file) ? parseEmailFile(readFileSync(file, "utf8")) : { to: d.email, subject: d.emailSubject, body: (d.emailBody ?? "").replace(/\s+$/, "") };
      db.prepare(`INSERT INTO emails (lead_id, to_addr, subject, body, status, sent_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(lead_id) DO UPDATE SET status = CASE WHEN emails.status = 'sent' THEN 'sent' ELSE excluded.status END, sent_at = COALESCE(emails.sent_at, excluded.sent_at)`)
        .run(id, mail.to ?? d.email, mail.subject, mail.body, d.status === "sent" ? "sent" : "draft", d.sentAt ?? null, t);
      bump("previews");
      bump("email drafts");
    }
  });

  // Finder lists (the consolidated ones also hold the US cloud runs, which have no raw files here).
  tx(db, () => {
    for (const r of J(join(leadsDir, "qualified.json"), [])) { upsertLead(db, r, { id: slugify(`${r.name}-${r.state}`), bucket: "qualified" }); bump("qualified"); }
    for (const r of J(join(leadsDir, "review", "visual-candidates.json"), [])) { upsertLead(db, { ...r, websiteStatus: "fails the visual review" }, { id: slugify(`${r.name}-${r.state}`), bucket: "qualified" }); bump("visual-review leads"); }
    for (const r of J(join(leadsDir, "near-misses.json"), [])) { upsertLead(db, r, { id: slugify(`near-${r.name || r.website}-${r.state}`), bucket: "near" }); bump("near misses"); }
    for (const r of J(join(leadsDir, "not-checked.json"), [])) {
      upsertLead(db, { ...r, name: /just a moment|attention required|access denied/i.test(r.name ?? "") ? null : r.name }, { id: slugify(`nc-${r.name || r.website}-${r.state}`), bucket: "notChecked" });
      bump("not checked");
    }
  });

  // Rules over the raw data: adds sites still waiting for the visual review, keeps everything else.
  const rules = await rerunRules(db, { hasMx, onlyNew: true });
  counts["to visual review"] = rules.toReview;

  tx(db, () => {
    // Real lead pages in the repo (fixtures test-* excluded).
    for (const f of ls(join(repoDir, "leads"), /^(?!test-).*\.json$/)) {
      const l = J(join(repoDir, "leads", f));
      const d = db.prepare("SELECT lead_id FROM drafts WHERE slug = ?").get(l.slug);
      if (!d) { bump("lead pages without a desk record"); continue; }
      db.prepare("UPDATE drafts SET template = ? WHERE slug = ?").run(l.template, l.slug);
      bump("lead pages");
    }

    // Kriv's clicks on the old Lead Desk artifact.
    const decDir = join(leadsDir, "import", "desk-decisions", "decisions");
    for (const f of ls(decDir, /\.json$/)) {
      const id = f.replace(/\.json$/, "");
      const d = J(join(decDir, f));
      const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) ?? db.prepare("SELECT * FROM leads WHERE slug = ?").get(id);
      if (!lead) { bump("decisions without a lead"); continue; }
      const map = { approved: "approved", declined: "declined", sent: "sent" };
      if (map[d.decision]) {
        const to = d.decision === "declined" ? "declined" : laterStatus(lead.status, map[d.decision]);
        db.prepare("UPDATE leads SET status = ? WHERE id = ?").run(to, lead.id);
        if (d.decision === "sent") db.prepare("UPDATE emails SET status = 'sent', sent_at = COALESCE(sent_at, ?) WHERE lead_id = ?").run(d.at ?? null, lead.id);
      }
      if (d.note) db.prepare("UPDATE leads SET note = ? WHERE id = ?").run(d.note, lead.id);
      if (d.linkedinSent) db.prepare("UPDATE linkedin SET status = 'sent' WHERE lead_id = ? AND status = 'to send'").run(lead.id);
      const seen = db.prepare("SELECT 1 FROM history WHERE lead_id = ? AND action = 'desk decision' AND detail = ?").get(lead.id, json(d));
      if (!seen) db.prepare("INSERT INTO history (at, lead_id, action, detail) VALUES (?, ?, 'desk decision', ?)").run(d.at ?? t, lead.id, json(d));
      bump("desk decisions");
      counts._decisions = [...(counts._decisions ?? []), { id: lead.id, d }];
    }

    // LinkedIn contacts.
    for (const [id, c] of Object.entries(J(join(leadsDir, "linkedin.json"), {}))) {
      if (id.startsWith("_")) continue;
      const lead = db.prepare("SELECT id FROM leads WHERE id = ?").get(id) ?? db.prepare("SELECT id FROM leads WHERE slug = ?").get(id);
      if (!lead) { bump("LinkedIn without a lead"); continue; }
      db.prepare("INSERT INTO linkedin (lead_id, who, url, confidence, how, note, followup, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, NULL, 'to send', ?) ON CONFLICT(lead_id) DO NOTHING")
        .run(lead.id, c.who ?? null, c.url ?? null, c.confidence ?? null, c.how ?? null, c.message ?? null, t);
      bump("LinkedIn contacts");
    }
    // A LinkedIn "sent" click made before the contact row existed.
    for (const { id, d } of counts._decisions ?? []) if (d.linkedinSent) db.prepare("UPDATE linkedin SET status = 'sent' WHERE lead_id = ? AND status = 'to send'").run(id);
    delete counts._decisions;

    db.prepare("INSERT INTO settings (key, value) VALUES ('imported_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(t);
    log(db, null, "import", counts);
  });
  return counts;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const db = openDb();
  console.log(await importAll(db));
  const by = (col) => db.prepare(`SELECT ${col} AS k, COUNT(*) AS n FROM leads GROUP BY ${col} ORDER BY n DESC`).all().map((r) => `${r.k}: ${r.n}`).join(", ");
  console.log("leads", db.prepare("SELECT COUNT(*) n FROM leads").get().n, "| by bucket:", by("bucket"), "| by status:", by("status"));
}
