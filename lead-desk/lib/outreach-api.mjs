// Email and LinkedIn screens. The desk never sends: "Open in Gmail" returns a compose link for
// Kriv's browser, and LinkedIn is only copy buttons and a status Kriv sets by hand.
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { now, log, rowToLead, isOptedOut, tx } from "./db.mjs";
import { laterStatus } from "./leads.mjs";
import { loadTemplates, valuesFor, fill, openBlanks, fullBody, gmailComposeUrl, DAILY_EMAIL_LIMIT, LINKEDIN_NOTE_MAX } from "./compose.mjs";

const bad = (msg, status = 400) => ({ httpStatus: status, body: { error: msg } });
const lead = (db, id) => rowToLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(id));
const sentToday = (db) => db.prepare("SELECT COUNT(*) n FROM emails WHERE status = 'sent' AND sent_at >= ?").get(new Date().toISOString().slice(0, 10)).n;

/** Why Gmail may not open yet for this lead; empty when it may. */
export function emailBlockers(db, l, mail) {
  const out = [];
  if (mail?.status === "sent") return [`Already sent${mail.sent_at ? ` on ${mail.sent_at.slice(0, 10)}` : ""}: it's a one-time email, so Gmail won't open for it again.`];
  if (!mail) out.push("No draft yet: start from a template and save it.");
  else if (!mail.to_addr) out.push("No email address.");
  else if (isOptedOut(db, mail.to_addr)) out.push("This address or its domain is on the do-not-contact list.");
  if (["declined", "expired"].includes(l.status)) out.push(`The lead is ${l.status}.`);
  else if (!["live", "sent", "replied"].includes(l.status)) out.push("The preview page is not live yet: approve and publish it first, so the link in the email works.");
  const blanks = openBlanks(mail?.subject, mail?.body);
  if (blanks.length) out.push(`Fill in the blanks first: ${blanks.join(", ")}.`);
  if (!mail?.subject?.trim()) out.push("No subject.");
  if (mail?.status !== "sent" && sentToday(db) >= DAILY_EMAIL_LIMIT) out.push(`Already ${DAILY_EMAIL_LIMIT} emails marked sent today (docs/OUTREACH.md limit).`);
  return out;
}

function emailView(db, l, leadsDir) {
  const mail = db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id) ?? null;
  const blockers = emailBlockers(db, l, mail);
  return {
    lead: { id: l.id, name: l.name, status: l.status, email: l.email, email_found_at: l.email_found_at, slug: l.slug, website: l.website, website_status: l.website_status, flags: l.flags, looks_dated: l.looks_dated, town: l.town },
    mail,
    preview: mail ? fullBody(mail.body) : null,
    templates: loadTemplates().email.map(({ id, label }) => ({ id, label })),
    blockers,
    gmailUrl: !blockers.length ? gmailComposeUrl({ to: mail.to_addr, subject: mail.subject, body: mail.body }) : null,
    sentToday: sentToday(db), dailyLimit: DAILY_EMAIL_LIMIT,
    file: join(leadsDir, "emails", `${l.slug ?? l.id}.txt`),
  };
}

function saveEmail(db, l, { to, subject, body }, leadsDir) {
  const t = now();
  const prev = db.prepare("SELECT status FROM emails WHERE lead_id = ?").get(l.id);
  if (prev?.status === "sent") throw new Error("This email is marked sent; it can't be edited.");
  db.prepare(`INSERT INTO emails (lead_id, to_addr, subject, body, status, updated_at) VALUES (?, ?, ?, ?, 'draft', ?)
    ON CONFLICT(lead_id) DO UPDATE SET to_addr = excluded.to_addr, subject = excluded.subject, body = excluded.body, updated_at = excluded.updated_at`)
    .run(l.id, String(to ?? "").trim(), String(subject ?? "").trim(), String(body ?? "").replace(/\s+$/, ""), t);
  // Same text file as before the desk existed (outside Git), so nothing depends on the database alone.
  mkdirSync(join(leadsDir, "emails"), { recursive: true });
  writeFileSync(join(leadsDir, "emails", `${l.slug ?? l.id}.txt`), `To: ${to}\nSubject: ${subject}\n\n${fullBody(body)}\n`);
  log(db, l.id, "email saved", { subject });
}

const LI_STATUSES = ["to send", "sent", "accepted", "replied", "skipped"];

export const outreachRoutes = [
  ["GET", /^\/api\/email$/, ({ db }) => ({
    sentToday: sentToday(db), dailyLimit: DAILY_EMAIL_LIMIT,
    rows: db.prepare(`SELECT l.id, l.name, l.town, l.state, l.status, l.email, e.status AS email_status, e.subject, e.sent_at
      FROM leads l LEFT JOIN emails e ON e.lead_id = l.id
      WHERE e.lead_id IS NOT NULL OR (l.status IN ('draft', 'approved', 'live') AND l.email IS NOT NULL)
      ORDER BY CASE WHEN l.status = 'live' AND COALESCE(e.status, '') != 'sent' THEN 0 WHEN COALESCE(e.status, '') = 'sent' THEN 2 ELSE 1 END, l.updated_at DESC`).all()
      .map((r) => ({ ...r, optedOut: isOptedOut(db, r.email) })),
  })],
  ["GET", /^\/api\/email\/(?<id>[^/]+)$/, ({ db, params, leadsDir }) => {
    const l = lead(db, params.id);
    return l ? emailView(db, l, leadsDir) : bad("no such lead", 404);
  }],
  // Fills a template from the lead (not saved until Kriv clicks Save).
  ["POST", /^\/api\/email\/(?<id>[^/]+)\/template$/, ({ db, params, body }) => {
    const l = lead(db, params.id);
    const t = loadTemplates().email.find((x) => x.id === body.template);
    if (!l || !t) return bad("unknown lead or template", 404);
    const v = valuesFor(l);
    return { to: l.email ?? "", subject: fill(t.subject, v).text, body: fill(t.body, v).text };
  }],
  ["POST", /^\/api\/email\/(?<id>[^/]+)$/, ({ db, params, body, leadsDir }) => {
    const l = lead(db, params.id);
    if (!l) return bad("no such lead", 404);
    if (body.to && isOptedOut(db, body.to)) return bad("That address is on the do-not-contact list.");
    try { saveEmail(db, l, body, leadsDir); } catch (e) { return bad(e.message); }
    return emailView(db, l, leadsDir);
  }],
  // Kriv clicked Send in Gmail and now records it here.
  ["POST", /^\/api\/email\/(?<id>[^/]+)\/sent$/, ({ db, params, leadsDir }) => {
    const l = lead(db, params.id);
    const mail = l && db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(l.id);
    if (!mail) return bad("no email draft", 404);
    if (!["live", "sent", "replied"].includes(l.status)) return bad("The page is not live; an email can't have been sent with a working link.");
    tx(db, () => {
      db.prepare("UPDATE emails SET status = 'sent', sent_at = ?, updated_at = ? WHERE lead_id = ?").run(now(), now(), l.id);
      db.prepare("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?").run(laterStatus(l.status, "sent"), now(), l.id);
      log(db, l.id, "email sent (marked by Kriv)", { to: mail.to_addr, subject: mail.subject });
    });
    return emailView(db, lead(db, l.id), leadsDir);
  }],
  ["POST", /^\/api\/leads\/(?<id>[^/]+)\/replied$/, ({ db, params }) => {
    const l = lead(db, params.id);
    if (!l) return bad("no such lead", 404);
    db.prepare("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?").run(laterStatus(l.status, "replied"), now(), l.id);
    log(db, l.id, "replied (marked by Kriv)");
    return { ok: true };
  }],

  ["GET", /^\/api\/linkedin$/, ({ db }) => ({
    max: LINKEDIN_NOTE_MAX, statuses: LI_STATUSES,
    templates: { note: loadTemplates().linkedinNote, followup: loadTemplates().linkedinFollowup },
    rows: db.prepare(`SELECT l.id, l.name, l.town, l.state, l.status, l.slug, k.who, k.url, k.confidence, k.how, k.note, k.followup, k.status AS li_status, k.sent_at
      FROM leads l LEFT JOIN linkedin k ON k.lead_id = l.id
      WHERE k.lead_id IS NOT NULL OR l.status IN ('approved', 'live', 'sent', 'replied')
      ORDER BY l.status IN ('declined', 'expired'), CASE COALESCE(k.status, 'none') WHEN 'to send' THEN 0 WHEN 'none' THEN 1 WHEN 'accepted' THEN 2 ELSE 3 END, l.name`).all(),
  })],
  ["POST", /^\/api\/linkedin\/(?<id>[^/]+)\/fill$/, ({ db, params, body }) => {
    const l = lead(db, params.id);
    const all = [...loadTemplates().linkedinNote, ...loadTemplates().linkedinFollowup];
    const t = all.find((x) => x.id === body.template);
    if (!l || !t) return bad("unknown lead or template", 404);
    return { text: fill(t.text, { ...valuesFor(l), owner_first_name: String(body.owner_first_name ?? "").trim() }).text };
  }],
  ["POST", /^\/api\/linkedin\/(?<id>[^/]+)$/, ({ db, params, body }) => {
    const l = lead(db, params.id);
    if (!l) return bad("no such lead", 404);
    const note = String(body.note ?? "");
    if (note.length > LINKEDIN_NOTE_MAX) return bad(`The note is ${note.length} characters; LinkedIn allows ${LINKEDIN_NOTE_MAX}.`);
    if (body.status && !LI_STATUSES.includes(body.status)) return bad("unknown status");
    if (body.url && !/^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(body.url)) return bad("The profile link must be a linkedin.com address.");
    const prev = db.prepare("SELECT * FROM linkedin WHERE lead_id = ?").get(l.id);
    const status = body.status ?? prev?.status ?? "to send";
    db.prepare(`INSERT INTO linkedin (lead_id, who, url, confidence, how, note, followup, status, sent_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(lead_id) DO UPDATE SET who = excluded.who, url = excluded.url, confidence = excluded.confidence, how = excluded.how, note = excluded.note,
        followup = excluded.followup, status = excluded.status, sent_at = COALESCE(linkedin.sent_at, excluded.sent_at), updated_at = excluded.updated_at`)
      .run(l.id, body.who ?? prev?.who ?? null, body.url ?? prev?.url ?? null, body.confidence ?? prev?.confidence ?? null, body.how ?? prev?.how ?? null,
        note, body.followup ?? prev?.followup ?? null, status, status === "sent" && prev?.status !== "sent" ? now() : null, now());
    if (prev?.status !== status) log(db, l.id, "linkedin", { from: prev?.status ?? null, to: status });
    return { ok: true };
  }],
];
