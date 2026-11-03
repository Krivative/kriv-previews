// Replies: what businesses answered, sorted, with suggested answers and follow-ups waiting in
// Gmail Drafts. Nothing is sent from here: Kriv reviews each draft in Gmail and presses Send.
import { api, esc, $, toast, pill, when, openLead, watchJob } from "../ui.js";

const thread = (id) => `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(id)}`;
const TONE = { interested: "st-live", question: "st-draft", not_now: "st-found", opt_out: "optout", bounce: "optout", auto: "st-found", other: "st-draft" };

export async function render(view) {
  const r = await api("replies");
  const s = r.summary;
  view.innerHTML = `
    <div class="row" style="justify-content:space-between"><h1>Replies</h1>
      <span class="small muted">${r.connected ? `Gmail connected · last check ${r.lastSync ? esc(when(r.lastSync)) : "not yet"}` : "Gmail not connected"}</span></div>
    ${r.connected ? "" : `<div class="panel"><p><b>Connect Gmail once</b> so the Desk can read replies to hello@kriv.agency and put suggested answers in your Drafts. It never sends anything.</p>
      <p class="small">Follow docs/REPLIES.md (about 10 minutes, free), then run <code>node scripts/gmail-setup.mjs</code> in kriv-previews.</p></div>`}
    ${r.lastError ? `<p class="sales-error">Last check failed: ${esc(r.lastError)}</p>` : ""}
    <p class="small muted">Every ${30} minutes: unsubscribes and bounces go on the do-not-contact list at once; interested, question and not-now replies get a suggested answer in Gmail Drafts; a business with no reply after ${r.followUpAfterDays} days gets one follow-up draft, never more. Review each draft in Gmail and press Send yourself.</p>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
      ${[["Sent, last 7 days", s.sentLast7Days], ["Interested", s.last30Days.interested], ["Questions", s.last30Days.question], ["Not now", s.last30Days.not_now], ["Unsubscribed", s.last30Days.opt_out], ["Bounced", s.last30Days.bounce], ["Follow-ups, 7 days", s.followUpsLast7Days]]
        .map(([k, v]) => `<div class="panel"><div class="small muted">${esc(k)}</div><div style="font-size:1.6em;font-weight:700">${esc(v)}</div></div>`).join("")}
    </div>
    <form id="booking" class="panel row" style="gap:8px;align-items:end"><label style="flex:1">Booking link for suggested answers (Calendly, Google Calendar booking page…)
      <input id="bookingLink" type="url" placeholder="https://calendly.com/your-name/15min" value="${esc(r.bookingLink)}"></label>
      <button type="submit">Save link</button>${r.connected ? '<button type="button" id="syncNow">Check replies now</button>' : ""}</form>
    <div id="job"></div>
    <section class="panel"><h2>Replies</h2>${r.replies.length ? `<table><thead><tr><th>Business</th><th>Reply</th><th>Received</th><th>What happened</th><th></th></tr></thead><tbody>${r.replies.map((x) => `
      <tr><td>${x.leadId ? `<a href="#" data-lead="${esc(x.leadId)}">${esc(x.name)}</a>` : "—"}</td><td>${pill(r.categories[x.category] ?? x.category, TONE[x.category])}</td>
        <td class="small">${esc(when(x.receivedAt))}</td><td class="small">${esc(x.handled)}</td><td><a href="${thread(x.threadId)}" target="_blank" rel="noopener noreferrer">Open in Gmail</a></td></tr>`).join("")}</tbody></table>` : '<p class="muted">No replies yet.</p>'}</section>
    <section class="panel"><h2>Follow-ups drafted</h2>${r.followups.length ? `<ul class="tasks">${r.followups.map((f) => `<li><a href="#" data-lead="${esc(f.leadId)}">${esc(f.name)}</a> <span class="small muted">${esc(when(f.draftedAt))}</span> · <a href="${thread(f.threadId)}" target="_blank" rel="noopener noreferrer">Open draft thread</a></li>`).join("")}</ul>` : '<p class="muted">None yet.</p>'}</section>`;
  view.querySelectorAll("[data-lead]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); openLead(a.dataset.lead); }));
  $("#booking", view).addEventListener("submit", async (e) => {
    e.preventDefault();
    try { await api("replies/settings", { bookingLink: $("#bookingLink", view).value }); toast("Booking link saved."); } catch (err) { toast(err.message); }
  });
  $("#syncNow", view)?.addEventListener("click", async () => {
    try { await api("replies/sync", {}); watchJob($("#job", view), () => render(view)); } catch (err) { toast(err.message); }
  });
}
