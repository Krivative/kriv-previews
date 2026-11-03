/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- exercises the JavaScript Desk modules with a fake Gmail; fictional businesses only.
import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../lead-desk/lib/db.mjs";
import { upsertLead } from "../lead-desk/lib/leads.mjs";
import { classifyReply, answerFor, followUpFor, syncReplies, replySummary, replySyncDue, setBookingLink, replyRoutes } from "../lead-desk/lib/replies.mjs";
import { gmailClient, messageText, parseMessage, replyRaw, gmailFiles } from "../lead-desk/lib/gmail.mjs";

const cleanup = [];
afterEach(() => { for (const f of cleanup.splice(0)) f(); });
const DAY = 86400000;
const enc = (s) => Buffer.from(s, "utf8").toString("base64url");
const dec = (s) => Buffer.from(s, "base64url").toString("utf8");

function message({ id, threadId = `t-${id}`, from, subject = "Re: A website concept", text, at, labels = ["INBOX"], extra = [] }) {
  return { id, threadId, labelIds: labels, internalDate: String(at), payload: { mimeType: "text/plain", headers: [{ name: "From", value: from }, { name: "Subject", value: subject }, { name: "Message-ID", value: `<${id}@mail.example>` }, ...extra], body: { data: enc(text) } } };
}
function fakeGmail(messages) {
  const calls = { drafts: [], labels: [], searches: [] };
  return {
    calls,
    search: async (q) => { calls.searches.push(q); return messages.filter((m) => (q.includes("in:sent") ? m.labelIds.includes("SENT") && q.includes(m.to) : !m.labelIds.includes("SENT"))).map((m) => ({ id: m.id })); },
    message: async (id) => messages.find((m) => m.id === id),
    labels: async () => [],
    createLabel: async (name) => ({ id: `L-${name}` }),
    labelThread: async (threadId, ids) => calls.labels.push({ threadId, ids }),
    createDraft: async ({ threadId, raw }) => { calls.drafts.push({ threadId, raw: dec(raw) }); return { id: `d${calls.drafts.length}` }; },
  };
}
function setup() {
  const db = openDb(":memory:"); cleanup.push(() => db.close());
  const sentAt = new Date(Date.now() - 6 * DAY).toISOString();
  const add = (name, email) => {
    const id = upsertLead(db, { name, website: `https://${email.split("@")[1]}`, email }, { bucket: "qualified" });
    db.prepare("UPDATE leads SET status = 'sent' WHERE id = ?").run(id);
    db.prepare("INSERT INTO emails (lead_id, to_addr, subject, body, status, sent_at, updated_at) VALUES (?, ?, 'A website concept', 'Hi', 'sent', ?, ?)").run(id, email, sentAt, sentAt);
    return id;
  };
  return { db, sentAt, keen: add("Keen Roofing", "office@keen-roofing.example"), stop: add("Stop Dental", "info@stop-dental.example"), gone: add("Gone Air", "hello@gone-air.example"), quiet: add("Quiet Plumbing", "info@quiet-plumbing.example"), later: add("Later Salon", "hi@later-salon.example") };
}

describe("sorting replies", () => {
  it.each([
    [{ text: "Yes, I'm interested. How much would it cost?" }, "interested"],
    [{ text: "Please unsubscribe me." }, "opt_out"],
    [{ text: "Not interested, thanks." }, "opt_out"],
    [{ text: "We're all set, thank you." }, "opt_out"],
    [{ text: "Maybe later, we're too busy until next year." }, "not_now"],
    [{ text: "Who built this page?" }, "question"],
    [{ text: "Got it." }, "other"],
    [{ fromAddr: "mailer-daemon@googlemail.com", subject: "Delivery Status Notification (Failure)", text: "Address not found" }, "bounce"],
    [{ subject: "Automatic reply: A website concept", text: "I am out of the office until Monday." }, "auto"],
    [{ autoSubmitted: "auto-replied", text: "Thanks for your email, we will get back to you." }, "auto"],
  ])("%j is %s", (msg, category) => {
    expect(classifyReply(msg)).toBe(category);
  });

  it("writes complete answers with the booking link when there is one, and none for unsubscribes", () => {
    expect(answerFor("interested", { name: "Keen Roofing LLC", bookingLink: "https://cal.example/kriv" })).toContain("You can pick a time for a short call here: https://cal.example/kriv");
    expect(answerFor("question", { name: "Keen Roofing" })).toContain("What day and time would suit you for a short call this week?");
    expect(answerFor("not_now", { name: "Keen Roofing" })).toContain("I will leave it there for now");
    for (const c of ["opt_out", "bounce", "auto"]) expect(answerFor(c, { name: "Keen Roofing" })).toBeNull();
    for (const c of ["interested", "question", "not_now", "other"]) expect(answerFor(c, { name: "Keen Roofing" })).not.toMatch(/\[\[|\{\{|TODO/);
    expect(followUpFor({ name: "Quiet Plumbing" })).toMatch(/Just following up[\s\S]*Not interested\? Reply "unsubscribe"/);
  });

  it("only accepts an https booking link", () => {
    const db = openDb(":memory:"); cleanup.push(() => db.close());
    expect(setBookingLink(db, "https://cal.example/kriv")).toBe("https://cal.example/kriv");
    expect(() => setBookingLink(db, "http://cal.example/kriv")).toThrow(/https/);
    expect(() => setBookingLink(db, "my calendar")).toThrow();
    expect(setBookingLink(db, "")).toBe("");
  });
});

describe("one reply sync", () => {
  it("records each reply once, honours unsubscribes and bounces, drafts answers and one follow-up, and never sends", async () => {
    const f = setup();
    setBookingLink(f.db, "https://cal.example/kriv");
    const t = Date.now() - 2 * DAY;
    const mail = [
      message({ id: "m1", from: "Keen Roofing <office@keen-roofing.example>", text: "Sounds good, tell me more.\n\nOn Mon, Kriv wrote:\n> A website concept", at: t }),
      message({ id: "m2", from: "Dr Stop <dr@stop-dental.example>", text: "Please remove me from your list.", at: t }),
      message({ id: "m3", from: "Mail Delivery Subsystem <mailer-daemon@googlemail.com>", subject: "Delivery Status Notification (Failure)", text: "Your message to hello@gone-air.example couldn't be delivered.", at: t }),
      message({ id: "m4", from: "Later Salon <hi@later-salon.example>", text: "Not right now, maybe next year.", at: t }),
      message({ id: "m5", from: "Someone <someone@unrelated.example>", text: "Hello?", at: t }),
      message({ id: "m6", from: "Keen Roofing <office@keen-roofing.example>", text: "Old message before we emailed.", at: Date.now() - 20 * DAY }),
      { ...message({ id: "s1", from: "Kriv <hello@kriv.agency>", subject: "A website concept", text: "Hi Quiet Plumbing team", at: Date.now() - 6 * DAY, labels: ["SENT"] }), to: "info@quiet-plumbing.example" },
    ];
    const gmail = fakeGmail(mail);
    const out = await syncReplies({ db: f.db }, gmail);
    expect(out).toMatchObject({ new: 4, opted_out: 1, bounced: 1, drafts: 2, followups: 1 });

    const cat = (id) => f.db.prepare("SELECT category, handled FROM replies WHERE lead_id = ?").get(id);
    expect(cat(f.keen)).toEqual({ category: "interested", handled: "suggested answer in Gmail Drafts" });
    expect(f.db.prepare("SELECT status FROM leads WHERE id = ?").get(f.keen).status).toBe("replied");
    // Unsubscribe: both the address emailed and the one that replied, the domain, and the lead expired.
    const blocked = f.db.prepare("SELECT value FROM opt_outs").all().map((r) => r.value);
    expect(blocked).toEqual(expect.arrayContaining(["info@stop-dental.example", "dr@stop-dental.example", "stop-dental.example", "hello@gone-air.example"]));
    expect(blocked).not.toContain("gone-air.example");
    expect(f.db.prepare("SELECT status FROM leads WHERE id = ?").get(f.stop).status).toBe("expired");
    expect(gmail.calls.labels).toEqual([{ threadId: "t-m2", ids: ["L-KRIV Outreach/Opt-out"] }]);

    const [answer, notNow, follow] = gmail.calls.drafts;
    expect(answer.threadId).toBe("t-m1");
    expect(answer.raw).toMatch(/^To: Keen Roofing <office@keen-roofing\.example>\r\nSubject: Re: A website concept/);
    expect(answer.raw).toContain("In-Reply-To: <m1@mail.example>");
    expect(answer.raw).toContain("https://cal.example/kriv");
    expect(notNow.threadId).toBe("t-m4");
    expect(follow.threadId).toBe("t-s1");
    expect(follow.raw).toContain("To: info@quiet-plumbing.example");
    expect(follow.raw).toContain("Just following up");
    expect(f.db.prepare("SELECT reason FROM opt_outs WHERE value = 'hello@gone-air.example'").get().reason).toBe("bounced");

    // A second pass adds nothing: replies are recorded once and the follow-up is never repeated.
    const again = await syncReplies({ db: f.db }, gmail);
    expect(again).toMatchObject({ new: 0, drafts: 0, followups: 0 });
    expect(gmail.calls.drafts).toHaveLength(3);

    const s = replySummary(f.db);
    expect(s.last30Days).toMatchObject({ interested: 1, opt_out: 1, bounce: 1, not_now: 1 });
    expect(s.waiting.map((w) => w.name).sort()).toEqual(["Keen Roofing", "Later Salon"]);
    expect(JSON.stringify(s)).not.toMatch(/@/);
  });

  it("drafts no follow-up before four days or after a reply", async () => {
    const f = setup();
    const recent = new Date(Date.now() - 2 * DAY).toISOString();
    f.db.prepare("UPDATE emails SET sent_at = ?").run(recent);
    const gmail = fakeGmail([]);
    expect((await syncReplies({ db: f.db }, gmail)).followups).toBe(0);
    expect(gmail.calls.drafts).toHaveLength(0);
  });
});

describe("Gmail access", () => {
  it("refuses any send request and builds threaded plain-text replies", async () => {
    const dir = mkdtempSync(join(tmpdir(), "kriv-gmail-")); cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
    const files = gmailFiles(dir); mkdirSync(files.dir, { recursive: true });
    writeFileSync(files.client, JSON.stringify({ installed: { client_id: "id.example", client_secret: "not-a-real-secret" } }));
    writeFileSync(files.token, JSON.stringify({ refresh_token: "fictional" }));
    const urls = [];
    const fetchImpl = async (url) => { urls.push(String(url)); return { ok: true, json: async () => (String(url).includes("oauth2") ? { access_token: "a", expires_in: 3600 } : { id: "d1" }) }; };
    const g = gmailClient({ leadsDir: dir, fetchImpl });
    expect(Object.keys(g)).not.toContain("send");
    await g.createDraft({ threadId: "t1", raw: "x" });
    expect(urls.at(-1)).toBe("https://gmail.googleapis.com/gmail/v1/users/me/drafts");
    expect(urls.some((u) => /\/send\b/.test(u))).toBe(false);

    const raw = Buffer.from(replyRaw({ to: "a@b.example", subject: "Café concept", body: "Hi\nthere", inReplyTo: "<x@y>", references: "<w@y>" }), "base64url").toString("utf8");
    expect(raw).toContain("Subject: =?UTF-8?B?");
    expect(raw).toContain("References: <w@y> <x@y>");
    expect(raw).toContain("Hi\r\nthere");
  });

  it("reads the new text of a reply without the quoted history", () => {
    const m = message({ id: "q1", from: "A <a@b.example>", text: "Yes please.\r\n\r\nOn Tue, Nov 3, 2026 at 10:00 AM Kriv <hello@kriv.agency> wrote:\r\n> Hi team", at: Date.now() });
    expect(messageText(m)).toBe("Yes please.");
    expect(parseMessage(m)).toMatchObject({ fromAddr: "a@b.example", threadId: "t-q1", messageId: "<q1@mail.example>" });
  });

  it("is not due until Gmail is connected, then every 30 minutes", () => {
    const dir = mkdtempSync(join(tmpdir(), "kriv-gmail-")); cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
    const db = openDb(":memory:"); cleanup.push(() => db.close());
    expect(replySyncDue({ db, leadsDir: dir })).toBe(false);
    expect(replySyncDue({ db })).toBe(false);
    const files = gmailFiles(dir); mkdirSync(files.dir, { recursive: true });
    writeFileSync(files.client, "{}"); writeFileSync(files.token, "{}");
    expect(replySyncDue({ db, leadsDir: dir })).toBe(true);
    db.prepare("INSERT INTO settings (key, value) VALUES ('replies_last_sync', ?)").run(new Date().toISOString());
    expect(replySyncDue({ db, leadsDir: dir })).toBe(false);
    expect(replySyncDue({ db, leadsDir: dir }, Date.now() + 31 * 60000)).toBe(true);
    expect(existsSync(files.token) && readFileSync(files.token, "utf8")).toBe("{}");
  });

  it("explains how to connect Gmail when it is not set up", () => {
    const db = openDb(":memory:"); cleanup.push(() => db.close());
    const [, , get] = replyRoutes.find(([m, re]) => m === "GET" && re.test("/api/replies"));
    expect(get({ db, leadsDir: undefined })).toMatchObject({ connected: false, replies: [], followups: [] });
    const [, , sync] = replyRoutes.find(([m, re]) => m === "POST" && re.test("/api/replies/sync"));
    expect(sync({ db })).toMatchObject({ httpStatus: 409 });
  });
});
