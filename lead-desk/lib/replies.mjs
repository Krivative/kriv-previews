// Reply handling (Kriv chose "Gmail read + drafts" with one follow-up, a booking link and a daily
// summary, 2026-11-02). Every 30 minutes while the Desk or an unattended run is active:
//   - replies from businesses KRIV emailed are matched to their lead and sorted;
//   - unsubscribes go on the do-not-contact list at once (docs/OUTREACH.md), bounces too;
//   - interested / question / not-now replies get a suggested answer in Gmail Drafts;
//   - a business with no reply 4 days after the email gets ONE follow-up draft, never more.
// Nothing is ever sent: lib/gmail.mjs has no send call. Reply text is untrusted data; it is only
// stored and matched against fixed patterns, never used as instructions.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { now, log, isOptedOut } from "./db.mjs";
import { setStatus } from "./leads.mjs";
import { addOptOut } from "./optouts.mjs";
import { teamName } from "./compose.mjs";
import { startJob } from "./jobs.mjs";
import { gmailClient, gmailConfigured, parseMessage, replyRaw } from "./gmail.mjs";
import { emailFooter, isOptOut } from "../../src/outreach/footer.ts";
import { FREE_MAIL } from "../../scripts/site-flags.mjs";

export const CATEGORIES = { interested: "Interested", question: "Question", not_now: "Not now", opt_out: "Unsubscribe", bounce: "Bounced", auto: "Auto-reply", other: "Other reply" };
export const SYNC_EVERY_MINUTES = 30;
export const FOLLOW_UP_AFTER_DAYS = 4;
const OPT_OUT_LABEL = "KRIV Outreach/Opt-out";

const STOP = /\b(not interested|no thanks|no,? thank you|please stop|stop (emailing|contacting)|don'?t (email|contact)|not for us|we'?re (all )?set|we are (all )?set|we'?re good|we are good)\b/i;
const LATER = /\b(not (right )?now|maybe later|not at (this|the moment|the present) time|next (year|month|quarter|spring|summer|fall|winter)|too busy|circle back|reach out (again )?(later|in)|in the future|after the (holidays|new year))\b/i;
const KEEN = /\b(interested|sounds (good|great|interesting)|let'?s (talk|chat|connect|set up)|call me|give me a call|give us a call|tell me more|more (info|information|details)|how much|pricing|price|cost|quote|estimate|schedule|book a|set up a (call|time|meeting)|send (me|us) (more|the|a)|yes,? please|love to)\b/i;

/** One reply's category from its sender, subject and text (fixed patterns, no AI). */
export function classifyReply({ fromAddr = "", subject = "", text = "", autoSubmitted = "" }) {
  if (/^(mailer-daemon|postmaster)@/i.test(fromAddr) || /\b(delivery status notification|undeliverable|mail delivery (failed|subsystem)|returned mail|delivery (has )?failed|address not found)\b/i.test(subject)) return "bounce";
  if (/^auto-(replied|generated)/i.test(autoSubmitted) || /\b(out of (the )?office|automatic reply|auto(matic)?[- ]?(reply|response)|away from (the )?office|on vacation|annual leave)\b/i.test(subject)) return "auto";
  if (isOptOut(text) || isOptOut(subject) || STOP.test(text)) return "opt_out";
  if (LATER.test(text)) return "not_now";
  if (KEEN.test(text)) return "interested";
  if (text.includes("?")) return "question";
  return "other";
}

const bookingLine = (link) => (link ? `You can pick a time for a short call here: ${link}` : "What day and time would suit you for a short call this week?");
/** The suggested answer for a reply, or null when none is needed (unsubscribe, bounce, auto-reply). */
export function answerFor(category, { name, bookingLink = "" }) {
  const hi = `Hi ${teamName(name)} team,`;
  if (category === "interested") return `${hi}\n\nThanks for getting back to me, glad it caught your interest.\n\n${bookingLine(bookingLink)}\n\nTo make the call useful, what matters most to you right now: more enquiries, a better website, or more time back in your week?`;
  if (category === "question" || category === "other") return `${hi}\n\nThanks for your reply. I would rather give you a proper answer than a generic one, so a short call is the easiest way.\n\n${bookingLine(bookingLink)}\n\nIf you prefer email, tell me a little more about what you need and I will answer here.`;
  if (category === "not_now") return `${hi}\n\nThanks for letting me know, I appreciate the reply. I will leave it there for now. If anything changes, just reply to this email.`;
  return null;
}
/** The single follow-up for a business that has not replied. */
export function followUpFor({ name, bookingLink = "" }) {
  return `Hi ${teamName(name)} team,\n\nJust following up on my note from a few days ago. Happy to send more details or set up a short call, whichever is easier for you.\n\n${bookingLine(bookingLink)}\n\n${emailFooter()}`;
}

const setting = (db, key) => db.prepare("SELECT value FROM settings WHERE key = ?").get(key)?.value ?? "";
const put = (db, key, value) => db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, String(value));
export function setBookingLink(db, link) {
  const v = String(link ?? "").trim();
  if (v) { let u; try { u = new URL(v); } catch { throw new Error("Enter the full booking link, starting with https://"); } if (u.protocol !== "https:") throw new Error("The booking link must start with https://"); }
  put(db, "booking_link", v); log(db, null, "booking link", { set: !!v });
  return v;
}

const epoch = (iso) => Math.floor(Date.parse(iso) / 1000);
const domainOf = (addr) => String(addr).split("@")[1]?.toLowerCase() ?? "";
function sentLeads(db) {
  return db.prepare(`SELECT l.id, l.name, l.email, l.status, e.sent_at, e.subject FROM leads l JOIN emails e ON e.lead_id = l.id
    WHERE e.status = 'sent' AND l.email IS NOT NULL AND e.sent_at IS NOT NULL ORDER BY e.sent_at`).all();
}
function leadFor(leads, msg) {
  return leads.find((l) => l.email.toLowerCase() === msg.fromAddr)
    ?? leads.find((l) => !FREE_MAIL.test(domainOf(l.email)) && domainOf(l.email) === domainOf(msg.fromAddr));
}

async function optOutLabel(gmail, cache) {
  if (cache.label) return cache.label;
  const found = (await gmail.labels()).find((l) => l.name === OPT_OUT_LABEL);
  cache.label = found?.id ?? (await gmail.createLabel(OPT_OUT_LABEL)).id;
  return cache.label;
}

/**
 * One pass: new replies (and bounces) since the oldest sent email, then follow-ups. Returns counts.
 * `gmail` is lib/gmail.mjs's client (a fake in tests).
 */
export async function syncReplies(ctx, gmail, { say = () => {}, maxFollowUps = 10, at = new Date() } = {}) {
  const { db } = ctx, leads = sentLeads(db), bookingLink = setting(db, "booking_link");
  const out = { checked: 0, new: 0, opted_out: 0, bounced: 0, drafts: 0, followups: 0 };
  if (!leads.length) { put(db, "replies_last_sync", now()); return out; }
  const since = epoch(leads[0].sent_at) - 86400;
  const queries = [];
  for (let i = 0; i < leads.length; i += 15) {
    const who = [...new Set(leads.slice(i, i + 15).flatMap((l) => [l.email, ...(FREE_MAIL.test(domainOf(l.email)) ? [] : [domainOf(l.email)])]))];
    queries.push(`from:(${who.join(" OR ")}) after:${since} -in:sent`);
  }
  queries.push(`from:(mailer-daemon OR postmaster) after:${since}`);
  const seen = new Set(), cache = {}, draftedThreads = new Set();
  for (const q of queries) for (const ref of await gmail.search(q, 100)) {
    if (seen.has(ref.id) || db.prepare("SELECT 1 FROM replies WHERE message_id = ?").get(ref.id)) continue;
    seen.add(ref.id); out.checked++;
    const msg = parseMessage(await gmail.message(ref.id));
    if (msg.labelIds.includes("SENT")) continue;
    const category = classifyReply(msg);
    const lead = category === "bounce" ? leads.find((l) => msg.text.toLowerCase().includes(l.email.toLowerCase())) : leadFor(leads, msg);
    if (!lead || msg.receivedAt < lead.sent_at) continue;
    let handled = "", draftId = null;
    if (category === "opt_out") {
      addOptOut(db, { value: lead.email, reason: "replied: unsubscribe", leadId: lead.id });
      if (msg.fromAddr !== lead.email.toLowerCase()) addOptOut(db, { value: msg.fromAddr, reason: "replied: unsubscribe", leadId: lead.id });
      try { await gmail.labelThread(msg.threadId, [await optOutLabel(gmail, cache)]); } catch (e) { say(`label failed: ${e.message}`); }
      handled = "added to do-not-contact"; out.opted_out++;
    } else if (category === "bounce") {
      db.prepare("INSERT OR IGNORE INTO opt_outs (value, kind, reason, at) VALUES (?, 'email', 'bounced', ?)").run(lead.email.toLowerCase(), now());
      handled = "address bounced: never emailed again"; out.bounced++;
    } else if (category === "auto") {
      handled = "auto-reply: nothing to do";
    } else {
      if (!["expired", "declined", "replied"].includes(lead.status)) setStatus(db, lead.id, "replied", "Reply sync");
      const body = answerFor(category, { name: lead.name, bookingLink });
      if (body && !draftedThreads.has(msg.threadId)) {
        draftId = (await gmail.createDraft({ threadId: msg.threadId, raw: replyRaw({ to: msg.from || msg.fromAddr, subject: msg.subject || lead.subject || "Your message", body, inReplyTo: msg.messageId, references: msg.references }) })).id;
        draftedThreads.add(msg.threadId); out.drafts++;
      }
      handled = draftId ? "suggested answer in Gmail Drafts" : "waiting for you";
    }
    db.prepare("INSERT INTO replies (message_id, lead_id, thread_id, from_addr, subject, received_at, category, text, draft_id, handled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(msg.id, lead.id, msg.threadId, msg.fromAddr, msg.subject, msg.receivedAt, category, msg.text, draftId, handled, now());
    log(db, lead.id, "reply", { category, handled });
    out.new++; say(`${CATEGORIES[category]}: ${lead.name}`);
  }
  out.followups = await draftFollowUps(ctx, gmail, { say, max: maxFollowUps, at, bookingLink });
  put(db, "replies_last_sync", now()); put(db, "replies_last_error", "");
  if (ctx.leadsDir) writeSummary(ctx);
  return out;
}

/** One follow-up draft per business that has not replied FOLLOW_UP_AFTER_DAYS after the email. */
export async function draftFollowUps(ctx, gmail, { say = () => {}, max = 10, at = new Date(), bookingLink = "" } = {}) {
  const { db } = ctx;
  const due = new Date(at.getTime() - FOLLOW_UP_AFTER_DAYS * 86400000).toISOString(), oldest = new Date(at.getTime() - 30 * 86400000).toISOString();
  const rows = db.prepare(`SELECT l.id, l.name, l.email, e.sent_at, e.subject FROM leads l JOIN emails e ON e.lead_id = l.id
    WHERE e.status = 'sent' AND e.sent_at <= ? AND e.sent_at >= ? AND l.status NOT IN ('replied', 'expired', 'declined')
      AND NOT EXISTS (SELECT 1 FROM followups f WHERE f.lead_id = l.id)
      AND NOT EXISTS (SELECT 1 FROM replies r WHERE r.lead_id = l.id AND r.category <> 'auto') ORDER BY e.sent_at`).all(due, oldest);
  let n = 0;
  for (const l of rows) {
    if (n >= max) break;
    if (isOptedOut(db, l.email)) continue;
    const [ref] = await gmail.search(`in:sent to:${l.email} after:${epoch(l.sent_at) - 2 * 86400}`, 5);
    if (!ref) { say(`no sent email found in Gmail for ${l.name}; no follow-up`); continue; }
    const sent = parseMessage(await gmail.message(ref.id));
    const draft = await gmail.createDraft({ threadId: sent.threadId, raw: replyRaw({ to: l.email, subject: sent.subject || l.subject || "Following up", body: followUpFor({ name: l.name, bookingLink }), inReplyTo: sent.messageId, references: sent.references }) });
    db.prepare("INSERT INTO followups (lead_id, thread_id, draft_id, drafted_at) VALUES (?, ?, ?, ?)").run(l.id, sent.threadId, draft.id, now());
    log(db, l.id, "follow-up drafted", { thread: sent.threadId });
    n++; say(`Follow-up drafted: ${l.name}`);
  }
  return n;
}

/** Daily summary for the status board: business names and categories only (no addresses or text). */
export function replySummary(db, at = new Date()) {
  const since = (days) => new Date(at.getTime() - days * 86400000).toISOString();
  const counts = Object.fromEntries(Object.keys(CATEGORIES).map((c) => [c, 0]));
  for (const r of db.prepare("SELECT category, COUNT(*) n FROM replies WHERE received_at >= ? GROUP BY category").all(since(30))) counts[r.category] = r.n;
  const waiting = db.prepare(`SELECT l.name, r.category, r.received_at FROM replies r JOIN leads l ON l.id = r.lead_id
    WHERE r.received_at >= ? AND r.category IN ('interested', 'question', 'not_now', 'other') ORDER BY r.received_at DESC LIMIT 20`).all(since(14))
    .map((r) => ({ name: r.name, category: CATEGORIES[r.category], receivedAt: r.received_at }));
  return { updatedAt: now(), last30Days: counts, waiting, followUpsLast7Days: db.prepare("SELECT COUNT(*) n FROM followups WHERE drafted_at >= ?").get(since(7)).n,
    sentLast7Days: db.prepare("SELECT COUNT(*) n FROM emails WHERE status = 'sent' AND sent_at >= ?").get(since(7)).n };
}
export function writeSummary(ctx) { writeFileSync(join(ctx.leadsDir, "replies-summary.json"), JSON.stringify(replySummary(ctx.db), null, 2)); }

export function replySyncDue(ctx, at = Date.now()) {
  if (!ctx.leadsDir || !gmailConfigured(ctx.leadsDir)) return false;
  const last = Date.parse(setting(ctx.db, "replies_last_sync") || "") || 0;
  return at - last >= SYNC_EVERY_MINUTES * 60000;
}
export function startReplySync(ctx) {
  // Record the attempt first so a failing sign-in retries every 30 minutes, not every minute.
  put(ctx.db, "replies_last_sync", now());
  return startJob("replies", "Checking replies in Gmail", null, async (job, say) => {
    try { return await syncReplies(ctx, gmailClient({ leadsDir: ctx.leadsDir }), { say }); }
    catch (e) { put(ctx.db, "replies_last_error", e.message); log(ctx.db, null, "reply sync failed", { reason: e.message }); throw e; }
  });
}

const bad = (error, httpStatus = 400) => ({ httpStatus, body: { error } });
export const replyRoutes = [
  ["GET", /^\/api\/replies$/, ({ db, leadsDir }) => ({
    connected: !!leadsDir && gmailConfigured(leadsDir), lastSync: setting(db, "replies_last_sync") || null, lastError: setting(db, "replies_last_error") || null,
    bookingLink: setting(db, "booking_link"), categories: CATEGORIES, followUpAfterDays: FOLLOW_UP_AFTER_DAYS,
    replies: db.prepare(`SELECT r.message_id id, r.thread_id threadId, r.category, r.received_at receivedAt, r.handled, r.draft_id IS NOT NULL hasDraft, l.id leadId, l.name
      FROM replies r LEFT JOIN leads l ON l.id = r.lead_id ORDER BY r.received_at DESC LIMIT 100`).all().map((r) => ({ ...r, hasDraft: !!r.hasDraft })),
    followups: db.prepare("SELECT f.thread_id threadId, f.drafted_at draftedAt, l.id leadId, l.name FROM followups f JOIN leads l ON l.id = f.lead_id ORDER BY f.drafted_at DESC LIMIT 100").all(),
    summary: replySummary(db),
  })],
  ["POST", /^\/api\/replies\/sync$/, (ctx) => {
    if (!ctx.leadsDir || !gmailConfigured(ctx.leadsDir)) return bad("Gmail is not connected yet. Run node scripts/gmail-setup.mjs first.", 409);
    try { startReplySync(ctx); return { started: true }; } catch (e) { return bad(e.message, 409); }
  }],
  ["POST", /^\/api\/replies\/settings$/, ({ db, body }) => { try { return { bookingLink: setBookingLink(db, body?.bookingLink) }; } catch (e) { return bad(e.message); } }],
];
