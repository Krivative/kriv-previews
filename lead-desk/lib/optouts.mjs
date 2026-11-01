// The do-not-contact list, shared by the Desk API and reply handling (lib/replies.mjs).
import { FREE_MAIL } from "../../scripts/site-flags.mjs";
import { now, log, isOptedOut, tx } from "./db.mjs";

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
