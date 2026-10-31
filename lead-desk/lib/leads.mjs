// Lead records: upsert with dedupe (website host, listing URL, phone), status rules, sources.
import { host } from "../../scripts/finder/rules.mjs";
import { now, json, parse, digits, slugify, log } from "./db.mjs";

// Statuses only move forward through this order, except declined and expired, which Kriv
// (or an opt-out) sets on purpose and which an import never overrides.
const ORDER = ["found", "draft", "approved", "live", "sent", "replied"];
export const STATUSES = [...ORDER, "declined", "expired"];
export function laterStatus(a, b) {
  if (a === "declined" || a === "expired") return a;
  if (b === "declined" || b === "expired") return b;
  return ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a;
}

export const leadKey = (rec) => (rec.website ? host(rec.website) : null) ?? rec.listingUrl ?? rec.key ?? slugify(`${rec.name}-${rec.state}`);

/** Finds the lead a record belongs to: same key, else same phone number, else same business email. */
export function findLead(db, rec) {
  const byKey = db.prepare("SELECT * FROM leads WHERE key = ?").get(leadKey(rec));
  if (byKey) return byKey;
  const p = digits(rec.phone);
  const byPhone = p ? db.prepare("SELECT * FROM leads WHERE phone_digits = ?").get(p) : null;
  if (byPhone) return byPhone;
  return rec.email ? db.prepare("SELECT * FROM leads WHERE lower(email) = lower(?)").get(rec.email) ?? null : null;
}

function uniqueId(db, id) {
  let out = id;
  for (let i = 2; db.prepare("SELECT 1 FROM leads WHERE id = ?").get(out); i++) out = `${id}-${i}`;
  return out;
}

const FIELDS = ["name", "state", "town", "niche", "address", "phone", "website", "email", "email_found_at", "website_status", "why", "via", "checked_at", "slug"];

/**
 * Inserts a lead or fills the gaps of the existing one. `rec` uses the finder's field names
 * (emailFoundAt, websiteStatus, otherBusinessEmails, looksDated, sources). Returns the lead id.
 * opts: { id, status, bucket, overwrite: [fields to replace even when set] }
 */
export function upsertLead(db, rec, opts = {}) {
  const t = now();
  const row = {
    name: rec.name || null, state: rec.state ?? null, town: rec.town ?? null, niche: rec.niche ?? null, address: rec.address ?? null,
    phone: rec.phone ?? null, website: rec.website ?? null, email: rec.email ?? null, email_found_at: rec.emailFoundAt ?? null,
    website_status: rec.websiteStatus ?? null, why: rec.why ?? null, via: rec.via ?? null, checked_at: rec.checkedAt ?? null, slug: rec.slug ?? null,
  };
  const prev = findLead(db, rec);
  let id;
  if (!prev) {
    id = uniqueId(db, opts.id ?? slugify(`${rec.name || rec.website}-${rec.state}`));
    db.prepare(`INSERT INTO leads (id, key, phone_digits, ${FIELDS.join(", ")}, other_emails, flags, looks_dated, bucket, status, created_at, updated_at)
      VALUES (?, ?, ?, ${FIELDS.map(() => "?").join(", ")}, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, leadKey(rec), digits(rec.phone), ...FIELDS.map((f) => row[f]), json(rec.otherBusinessEmails ?? []), json(rec.flags ?? []), json(rec.looksDated ?? []),
        opts.bucket ?? null, opts.status ?? "found", t, t);
  } else {
    id = prev.id;
    const over = new Set(opts.overwrite ?? []);
    const merged = Object.fromEntries(FIELDS.map((f) => [f, over.has(f) && row[f] != null ? row[f] : prev[f] ?? row[f]]));
    const flags = parse(prev.flags, []).length && !over.has("flags") ? prev.flags : json(rec.flags ?? parse(prev.flags, []));
    const looks = parse(prev.looks_dated, []).length && !over.has("looks_dated") ? prev.looks_dated : json(rec.looksDated ?? parse(prev.looks_dated, []));
    const others = json([...new Set([...parse(prev.other_emails, []), ...(rec.otherBusinessEmails ?? [])])]);
    db.prepare(`UPDATE leads SET ${FIELDS.map((f) => `${f} = ?`).join(", ")}, phone_digits = COALESCE(phone_digits, ?), other_emails = ?, flags = ?, looks_dated = ?,
      bucket = ?, status = ?, updated_at = ? WHERE id = ?`)
      .run(...FIELDS.map((f) => merged[f]), digits(rec.phone), others, flags, looks, opts.bucket ?? prev.bucket, laterStatus(prev.status, opts.status ?? prev.status), t, id);
  }
  for (const url of rec.sources ?? []) addSource(db, id, "listing", url);
  if (rec.emailFoundAt) addSource(db, id, "email", rec.emailFoundAt);
  return id;
}

export function addSource(db, leadId, field, url) {
  if (!url || !/^https?:\/\//.test(url)) return;
  db.prepare("INSERT OR IGNORE INTO sources (lead_id, field, url) VALUES (?, ?, ?)").run(leadId, field, url);
}

/** Changes a lead's status on purpose (Kriv's click), logged in history. */
export function setStatus(db, id, status, by = "Kriv") {
  if (!STATUSES.includes(status)) throw new Error(`unknown status ${status}`);
  const prev = db.prepare("SELECT status FROM leads WHERE id = ?").get(id);
  if (!prev) throw new Error(`no lead ${id}`);
  db.prepare("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?").run(status, now(), id);
  log(db, id, "status", { from: prev.status, to: status, by });
}
