// Founder workflow: finished preview + email -> approve, decline or request a revision.
import { api, esc, $, $$, toast, fileUrl, watchJob } from "../ui.js";

let selected = "review";
const groups = { review: "Ready for review", preparing: "In preparation", outreach: "Email and replies" };
export async function render(view) {
  const data = await api("inbox");
  const a = data.automation;
  const belongs = (c, tab) => tab === "review" ? c.ready || c.status === "approved" : tab === "outreach" ? ["live", "sent", "replied"].includes(c.status) : ["found", "draft"].includes(c.status) && !c.ready;
  const cards = data.rows.filter((c) => belongs(c, selected));
  view.innerHTML = `<div><span class="eyebrow">KRIV Lead Desk</span><h1>Your review inbox</h1><p>Review the finished preview and email, then approve, decline or request a revision. Preparation checks run behind the scenes.</p></div>
    <div class="panel ${a.running ? "" : "banner"}"><b>${esc(a.reason)}</b><p class="small">Up to 10 initial offers per day while the app stays open. The system rotates niche templates and reusable wording, keeps source-matched facts, omits unsupported optional details, and creates screenshots and an email draft. Your approval is the final design and wording decision. Custom research and subjective weak-site grading can be handled during a Codex session.</p>
    <div class="row"><button class="btn" id="refresh">Refresh</button><button class="btn" id="prepare" ${a.running ? "" : "disabled"}>Prepare next item</button>${a.enabled ? '<button class="btn" id="pause">Pause automation</button>' : '<button class="btn primary" id="start">Start background preparation</button>'}</div>
    <details style="margin-top:12px"><summary>Search settings</summary>
      <p class="small">No AI key, AI subscription or AI spending is needed. This workflow never sends drafts or screenshots to an AI provider. It uses existing photo credits or the configured Unsplash photo picker. Email sending and replies stay with you in Gmail.</p>
      <form id="settings" class="inbox-settings">
        <label>Search towns (up to three; Texas, Florida or Utah)<input id="towns" value="${esc(a.search.towns.join(", "))}" placeholder="ocala-fl"></label>
        <button class="btn" type="submit">Save search settings</button>
      </form>
    </details></div>
    <div id="job"></div>
    <nav class="row" aria-label="Review lists">${Object.entries(groups).map(([key, label]) => `<button class="chip" data-tab="${key}" aria-pressed="${key === selected}">${label} (${data.rows.filter((c) => belongs(c, key)).length})</button>`).join("")}</nav>
    <section class="inbox-cards">${cards.map((c) => card(c, data.revisions)).join("") || `<p class="panel">${selected === "review" ? "No finished previews are ready yet. Start background preparation to turn qualified leads into offers. Existing drafts are under In preparation." : "Nothing in this list yet."}</p>`}</section>`;
  const search = () => ({ search: { source: "hotfrog", towns: $("#towns", view).value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) } });
  $("#settings", view).onsubmit = async (e) => { e.preventDefault(); try { await api("inbox/settings", search()); toast("Search settings saved."); await render(view); } catch (err) { toast(err.message); } };
  if ($("#start", view)) $("#start", view).onclick = async () => { try { await api("inbox/settings", { ...search(), enabled: true }); toast("Background preparation enabled. No paid AI."); await render(view); } catch (err) { toast(err.message); } };
  $("#refresh", view).onclick = () => render(view);
  $("#prepare", view).onclick = async () => { try { await api("inbox/prepare", {}); watchJob($("#job", view), () => render(view)); } catch (err) { toast(err.message); } };
  if ($("#pause", view)) $("#pause", view).onclick = async () => { await api("inbox/settings", { enabled: false }); toast("Background work paused. A current job may finish; use its Cancel button to stop it."); await render(view); };
  $$("[data-tab]", view).forEach((b) => b.onclick = () => { selected = b.dataset.tab; render(view); });
  view.onclick = async (e) => {
    const c = e.target.closest("[data-card]");
    if (!c) return;
    const id = c.dataset.card;
    const button = e.target.closest("button");
    if (!button) return;
    const act = button.dataset.act;
    if (!act) return;
    button.disabled = true;
    try {
      if (act === "approve") { await api(`leads/${encodeURIComponent(id)}/approve`, {}); toast("Approved. Publish the page when ready."); return render(view); }
      if (act === "decline") { await api(`leads/${encodeURIComponent(id)}/status`, { status: "declined" }); toast("Declined"); return render(view); }
      if (act === "email") {
        const d = await api(`email/${encodeURIComponent(id)}`);
        if (!d.gmailUrl) throw new Error(d.blockers.join(" "));
        const a = document.createElement("a"); a.href = d.gmailUrl; a.target = "_blank"; a.rel = "noopener noreferrer"; a.click();
        toast("Review the email in Gmail and click Send yourself. Then mark I sent it here.");
      }
      if (act === "sent") { await api(`email/${encodeURIComponent(id)}/sent`, {}); return render(view); }
      if (act === "replied") { await api(`leads/${encodeURIComponent(id)}/replied`, {}); return render(view); }
      if (act === "publish") {
        const p = await api(`leads/${encodeURIComponent(id)}/publish/plan`, {});
        $("[data-confirm]", c).innerHTML = `<div class="confirm"><b>Make this concept public at ${esc(p.url)}?</b><p>This publishes the approved page and updates the live preview website after the technical checks pass.</p><button class="btn primary" data-act="confirm-publish" data-slug="${esc(p.slug)}">Confirm: publish approved page</button> <button class="btn" data-act="cancel-publish">Cancel</button></div>`;
      }
      if (act === "confirm-publish") { await api(`leads/${encodeURIComponent(id)}/publish`, { confirm: button.dataset.slug }); $("[data-confirm]", c).innerHTML = ""; watchJob($("#job", view), () => render(view)); }
      if (act === "cancel-publish") $("[data-confirm]", c).innerHTML = "";
    } catch (err) { toast(err.message); }
    finally { if (button.isConnected) button.disabled = false; }
  };
  $$("[data-revision]", view).forEach((form) => form.onsubmit = async (e) => {
    e.preventDefault();
    const b = $("button", form); b.disabled = true;
    try { const r = await api(`inbox/${encodeURIComponent(form.dataset.revision)}/revision`, { request: $("select", form).value }); toast(r.paused ? "Revision saved. It will run when background preparation is enabled." : "Revision queued. The app will prepare and check a new version."); await render(view); }
    catch (err) { toast(err.message); b.disabled = false; }
  });
  watchJob($("#job", view), () => render(view));
  // Pick up background jobs and completed offers even when no job was running on arrival.
  // Preserve open forms and publishing confirmations until the user finishes with them.
  const marker = view.firstElementChild;
  const poll = async () => {
    if (!marker.isConnected) return;
    try {
      const next = await api("inbox");
      if (JSON.stringify(next) !== JSON.stringify(data) && !view.querySelector("[data-confirm] .confirm") && !view.contains(document.activeElement?.closest("form"))) return render(view);
    } catch { /* Keep the last view on a temporary connection failure. */ }
    if (marker.isConnected) setTimeout(poll, 15000);
  };
  setTimeout(poll, 15000);
}

function card(c, revisions) {
  const draft = ["found", "draft"].includes(c.status);
  return `<article class="panel inbox-card" data-card="${esc(c.id)}"><div class="row" style="justify-content:space-between"><div><h2>${esc(c.name)}</h2><span class="small muted">${esc([c.town, c.state].filter(Boolean).join(", "))}</span></div><span class="pill">${esc(c.ready ? "Ready for your decision" : c.status === "approved" ? "Approved, waiting to publish" : draft ? c.preparation === "held" ? "Held for investigation" : "In preparation" : c.status)}</span></div>
    ${c.summary ? `<p>${esc(c.summary)}</p>` : draft ? `<p class="small">${esc(c.reason)}</p>` : ""}
    ${c.screenshots.length ? `<div class="shots">${c.screenshots.map((s) => `<a href="${fileUrl(s.file)}" target="_blank" rel="noopener noreferrer"><img src="${fileUrl(s.file)}" alt="${esc(s.label)} preview" loading="lazy"></a>`).join("")}</div>` : ""}
    ${c.email ? `<details ${c.ready ? "open" : ""}><summary>Email draft: ${esc(c.email.subject)}</summary><pre class="inbox-email">${esc(c.email.body)}</pre></details>` : ""}
    ${c.sources?.length ? `<details><summary>Sources checked</summary><ul class="small">${c.sources.filter((u) => /^https?:\/\//.test(u)).map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u)}</a></li>`).join("")}</ul></details>` : ""}
    <div class="row">${draft ? `<button class="btn primary" data-act="approve" ${c.ready ? "" : "disabled"}>Approve preview</button><button class="btn bad" data-act="decline" ${c.preparation === "preparing" ? "disabled" : ""}>Decline</button>` : c.status === "approved" ? '<button class="btn primary" data-act="publish">Publish approved preview…</button>' : c.status === "live" ? '<button class="btn primary" data-act="email">Open email in Gmail</button><button class="btn" data-act="sent">I sent it</button>' : c.status === "sent" ? '<button class="btn" data-act="replied">They replied</button>' : ""}</div>
    ${draft ? `<details><summary>Request revision</summary><form data-revision="${esc(c.id)}"><label>What should change?<select>${revisions.map((r) => `<option ${c.revision === r ? "selected" : ""}>${esc(r)}</option>`).join("")}</select></label><p class="small muted">Preset revisions run without AI. Specific custom changes can be handled in a Codex session.</p><button class="btn" type="submit" ${c.preparation === "preparing" ? "disabled" : ""}>Request revision</button></form></details>` : ""}
    ${c.blockers.length ? `<details><summary>Preparation details</summary><ul class="small">${c.blockers.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></details>` : ""}<div data-confirm></div></article>`;
}
