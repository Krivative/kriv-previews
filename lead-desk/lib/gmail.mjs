// Gmail access for reply handling (Kriv chose it, 2026-11-02): read replies to hello@kriv.agency,
// label opt-outs and create DRAFTS. There is no send function here, and any request to a Gmail
// send endpoint is refused, so nothing ever leaves the mailbox without Kriv pressing Send.
//
// Sign-in lives in kriv-leads\secrets\ (never in Git, never served by the Desk):
//   gmail-client.json  the OAuth "Desktop app" client Kriv downloads from Google Cloud
//   gmail-token.json   the refresh token scripts/gmail-setup.mjs saves after Kriv signs in
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// gmail.modify: read, label and draft. Google has no draft-only scope; this code never sends.
export const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];
const API = "https://gmail.googleapis.com/gmail/v1/users/me";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export const gmailFiles = (leadsDir) => {
  const dir = join(leadsDir, "secrets");
  return { dir, client: join(dir, "gmail-client.json"), token: join(dir, "gmail-token.json") };
};
export const gmailConfigured = (leadsDir) => { const f = gmailFiles(leadsDir); return existsSync(f.client) && existsSync(f.token); };

export function clientInfo(path) {
  const j = JSON.parse(readFileSync(path, "utf8"));
  const c = j.installed ?? j.web ?? j;
  if (!c.client_id || !c.client_secret) throw new Error("gmail-client.json is not a Google OAuth client file (download the Desktop app client).");
  return { client_id: c.client_id, client_secret: c.client_secret };
}

export function authUrl(client, redirectUri, state) {
  const q = new URLSearchParams({ client_id: client.client_id, redirect_uri: redirectUri, response_type: "code", scope: SCOPES.join(" "), access_type: "offline", prompt: "consent", state });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

export async function exchangeCode({ client, code, redirectUri, fetchImpl = fetch }) {
  const r = await fetchImpl(TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...client, code, redirect_uri: redirectUri, grant_type: "authorization_code" }) });
  const j = await r.json();
  if (!r.ok || !j.refresh_token) throw new Error(`Google sign-in did not return a refresh token (${j.error ?? r.status}).`);
  return { refresh_token: j.refresh_token, scope: j.scope, saved_at: new Date().toISOString() };
}
export function saveToken(leadsDir, token) {
  const f = gmailFiles(leadsDir); mkdirSync(f.dir, { recursive: true });
  writeFileSync(f.token, JSON.stringify(token, null, 2));
}

/** A Gmail client for the signed-in mailbox. `fetchImpl` is injectable for tests. */
export function gmailClient({ leadsDir, fetchImpl = fetch }) {
  let access = null, expires = 0;
  async function token() {
    if (access && Date.now() < expires - 60000) return access;
    const f = gmailFiles(leadsDir), client = clientInfo(f.client), saved = JSON.parse(readFileSync(f.token, "utf8"));
    const r = await fetchImpl(TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ ...client, refresh_token: saved.refresh_token, grant_type: "refresh_token" }) });
    const j = await r.json();
    if (!r.ok || !j.access_token) throw new Error(`Google sign-in failed (${j.error ?? r.status}). Run node scripts/gmail-setup.mjs again.`);
    access = j.access_token; expires = Date.now() + (j.expires_in ?? 3600) * 1000;
    return access;
  }
  async function call(path, { method = "GET", body } = {}) {
    if (/\/send\b/i.test(path)) throw new Error("KRIV never sends email automatically.");
    const r = await fetchImpl(API + path, { method, headers: { authorization: `Bearer ${await token()}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Gmail ${r.status}: ${j.error?.message ?? "request failed"}`);
    return j;
  }
  return {
    profile: () => call("/profile"),
    search: async (q, max = 50) => (await call(`/messages?q=${encodeURIComponent(q)}&maxResults=${max}`)).messages ?? [],
    message: (id) => call(`/messages/${encodeURIComponent(id)}?format=full`),
    labels: async () => (await call("/labels")).labels ?? [],
    createLabel: (name) => call("/labels", { method: "POST", body: { name, labelListVisibility: "labelShow", messageListVisibility: "show" } }),
    labelThread: (threadId, addLabelIds) => call(`/threads/${encodeURIComponent(threadId)}/modify`, { method: "POST", body: { addLabelIds } }),
    createDraft: ({ threadId, raw }) => call("/drafts", { method: "POST", body: { message: { threadId, raw } } }),
  };
}

// ---- Messages --------------------------------------------------------------------------------

const b64url = (s) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s) => Buffer.from(String(s ?? "").replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
const header = (m, name) => m.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

/** The plain text of a message (text/plain part, else stripped HTML), with quoted history removed. */
export function messageText(m) {
  const parts = [];
  const walk = (p) => { if (!p) return; if (p.parts) p.parts.forEach(walk); else if (p.body?.data) parts.push({ type: p.mimeType, text: fromB64url(p.body.data) }); };
  walk(m.payload);
  const plain = parts.find((p) => p.type === "text/plain")?.text
    ?? (parts.find((p) => p.type === "text/html")?.text ?? "").replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/(p|div)>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  const lines = [];
  for (const line of String(plain ?? m.snippet ?? "").split(/\r?\n/)) {
    if (/^\s*>/.test(line)) continue;
    if (/^\s*On .{5,200}wrote:\s*$/i.test(line) || /^-{2,}\s*Original Message\s*-{2,}/i.test(line) || /^\s*From:\s.+@/i.test(line)) break;
    lines.push(line);
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function parseMessage(m) {
  const from = header(m, "From");
  return {
    id: m.id, threadId: m.threadId, from, fromAddr: (from.match(/<([^>]+)>/)?.[1] ?? from).trim().toLowerCase(),
    to: header(m, "To"), subject: header(m, "Subject"), messageId: header(m, "Message-ID") || header(m, "Message-Id"),
    references: header(m, "References"), autoSubmitted: header(m, "Auto-Submitted"),
    receivedAt: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : new Date().toISOString(),
    text: messageText(m).slice(0, 6000), labelIds: m.labelIds ?? [],
  };
}

const encodeSubject = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`);
/** An RFC 2822 reply in the same thread, base64url-encoded for drafts.create. */
export function replyRaw({ to, subject, body, inReplyTo = "", references = "" }) {
  const subj = /^re:/i.test(subject) ? subject : `Re: ${subject}`;
  const lines = [`To: ${to}`, `Subject: ${encodeSubject(subj)}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: 8bit"];
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`, `References: ${[references, inReplyTo].filter(Boolean).join(" ")}`);
  return b64url(`${lines.join("\r\n")}\r\n\r\n${body.replace(/\r?\n/g, "\r\n")}`);
}
