// The Lead Desk database: one SQLite file outside Git (it holds business emails and names).
// Default C:\Users\user\kriv-leads\lead-desk.db; LEAD_DESK_DB overrides it (tests use ":memory:").
import { DatabaseSync } from "node:sqlite";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_DB = join(homedir(), "kriv-leads", "lead-desk.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,              -- stable id (draft deskId, else draft slug, else slug of name + state)
  key TEXT UNIQUE NOT NULL,         -- dedupe key: website host, else listing URL, else id
  phone_digits TEXT,                -- second dedupe key
  name TEXT, state TEXT, town TEXT, niche TEXT, address TEXT, phone TEXT, website TEXT,
  email TEXT, email_found_at TEXT, other_emails TEXT DEFAULT '[]',
  website_status TEXT, flags TEXT DEFAULT '[]', looks_dated TEXT DEFAULT '[]',
  bucket TEXT,                      -- qualified | near | notChecked | toReview | none | ungraded | manual
  why TEXT,
  status TEXT NOT NULL DEFAULT 'found', -- found | declined | draft | approved | live | sent | replied | expired
  slug TEXT,                        -- leads/<slug>.json once a preview exists
  via TEXT, checked_at TEXT, note TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS leads_phone ON leads(phone_digits);
CREATE TABLE IF NOT EXISTS sources (
  lead_id TEXT NOT NULL, field TEXT NOT NULL, url TEXT NOT NULL,
  PRIMARY KEY (lead_id, field, url)
);
CREATE TABLE IF NOT EXISTS candidates (key TEXT PRIMARY KEY, data TEXT NOT NULL, found_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS checks (host TEXT PRIMARY KEY, data TEXT NOT NULL, checked_at TEXT, shot TEXT);
CREATE TABLE IF NOT EXISTS visual (host TEXT PRIMARY KEY, failed TEXT NOT NULL, at TEXT NOT NULL, by TEXT);
CREATE TABLE IF NOT EXISTS drafts (
  slug TEXT PRIMARY KEY, lead_id TEXT NOT NULL, template TEXT, facts TEXT DEFAULT '[]', qa TEXT DEFAULT '[]',
  screenshots TEXT DEFAULT '[]', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS emails (
  lead_id TEXT PRIMARY KEY, to_addr TEXT, subject TEXT, body TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | sent
  sent_at TEXT, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS linkedin (
  lead_id TEXT PRIMARY KEY, who TEXT, url TEXT, confidence TEXT, how TEXT, note TEXT, followup TEXT,
  status TEXT NOT NULL DEFAULT 'to send', -- to send | sent | accepted | replied | skipped
  sent_at TEXT, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS opt_outs (value TEXT PRIMARY KEY, kind TEXT NOT NULL, reason TEXT, at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, lead_id TEXT, action TEXT NOT NULL, detail TEXT);
CREATE TABLE IF NOT EXISTS setup_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT UNIQUE NOT NULL, when_text TEXT, what TEXT, done INTEGER NOT NULL DEFAULT 0, links TEXT DEFAULT '[]');
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS pages (url TEXT PRIMARY KEY, status INTEGER, html TEXT, text TEXT, fetched_at TEXT NOT NULL); -- their pages, for the preview form
`;

// Columns added after the first release, for databases created before them.
const MIGRATIONS = ["ALTER TABLE drafts ADD COLUMN form TEXT"];

export function openDb(file = process.env.LEAD_DESK_DB || DEFAULT_DB) {
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  for (const m of MIGRATIONS) { try { db.exec(m); } catch { /* already there */ } }
  return db;
}

export const now = () => new Date().toISOString();
export const json = (v) => JSON.stringify(v ?? null);
export const parse = (s, d = null) => { try { return s == null ? d : JSON.parse(s); } catch { return d; } };
export const digits = (p) => (p ? String(p).replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "") || null : null);
export const slugify = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "lead";

export function log(db, leadId, action, detail = null) {
  db.prepare("INSERT INTO history (at, lead_id, action, detail) VALUES (?, ?, ?, ?)").run(now(), leadId, action, detail == null ? null : typeof detail === "string" ? detail : json(detail));
}

/** Runs fn inside one transaction. */
export function tx(db, fn) {
  db.exec("BEGIN");
  try { const r = fn(); db.exec("COMMIT"); return r; } catch (e) { db.exec("ROLLBACK"); throw e; }
}

/** The lead row with JSON columns parsed. */
export function rowToLead(r) {
  if (!r) return null;
  return { ...r, other_emails: parse(r.other_emails, []), flags: parse(r.flags, []), looks_dated: parse(r.looks_dated, []) };
}

/** A domain or address on the do-not-contact list blocks every email to it. */
export function isOptedOut(db, email) {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  const domain = e.split("@")[1] ?? "";
  return !!db.prepare("SELECT 1 FROM opt_outs WHERE value IN (?, ?)").get(e, domain);
}
