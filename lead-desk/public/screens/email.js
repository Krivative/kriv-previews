// Email: fill-in-the-blanks templates, the footer added automatically, "Open in Gmail" opens a
// prefilled compose window. Nothing is ever sent from here: Kriv clicks Send in Gmail by hand.
import { api, esc, $, toast, pill, link, openLead, aiState } from "../ui.js";

export async function render(view, id) {
  const q = await api("email");
  view.innerHTML = `
    <div class="row" style="justify-content:space-between"><h1>Email</h1>
      <span class="small muted">Marked sent today: <b>${q.sentToday}</b> of ${q.dailyLimit}</span></div>
    <p class="small muted">Gmail opens a filled-in compose window from hello@kriv.agency. Read it there and click Send yourself, then come back and click <b>I sent it</b>. Nothing is sent from this desk.</p>
    <div class="grid" style="grid-template-columns:minmax(220px,1fr) 2.4fr;align-items:start">
      <nav class="panel" aria-label="Leads with emails" style="padding:6px;max-height:75vh;overflow:auto"><ul class="tasks">${q.rows.map((r) => `
        <li style="border-left-color:var(${r.email_status === "sent" ? "--ok" : r.status === "live" ? "--warn" : "--line"})"><a href="#email/${esc(r.id)}" ${r.id === id ? 'aria-current="true" style="font-weight:700"' : ""}>${esc(r.name)}</a>
        <div class="small">${pill(r.status)} ${r.email_status ? pill(`email ${r.email_status}`, r.email_status === "sent" ? "st-sent" : "st-draft") : ""} ${r.optedOut ? pill("opted out", "optout") : ""}</div></li>`).join("") || '<li class="muted">No leads with an email yet.</li>'}</ul></nav>
      <section id="editor" class="panel">${id ? "Loading…" : '<p class="muted">Pick a lead on the left.</p>'}</section>
    </div>`;
  if (id) await editor($("#editor", view), id);
}

async function editor(el, id) {
  const v = await api(`email/${encodeURIComponent(id)}`);
  const m = v.mail ?? { to_addr: v.lead.email ?? "", subject: "", body: "" };
  const sent = m.status === "sent";
  el.innerHTML = `
    <div class="row" style="justify-content:space-between"><h2 style="margin:0"><a href="#" data-open>${esc(v.lead.name)}</a></h2>${pill(v.lead.status)}</div>
    <div class="small muted">Address found on ${link(v.lead.email_found_at)} · website ${esc(v.lead.website_status ?? "none")}${v.lead.slug ? ` · page ${link(`https://kriv.agency/${v.lead.slug}`)}` : ""}</div>
    ${sent ? `<p class="panel banner ok small">Marked sent ${esc(new Date(m.sent_at).toLocaleString())}. It can't be edited any more.</p>` : `
    <div class="row"><label style="flex:1">Start from a template <select id="tpl"><option value="">Choose…</option>${v.templates.map((t) => `<option value="${esc(t.id)}">${esc(t.label)}</option>`).join("")}</select></label></div>`}
    <label>To <input id="to" value="${esc(m.to_addr)}" ${sent ? "disabled" : ""}></label>
    <label>Subject <input id="subject" value="${esc(m.subject)}" ${sent ? "disabled" : ""}></label>
    <label>Message (anything in [[double brackets]] still needs your words) <textarea id="body" rows="16" ${sent ? "disabled" : ""}>${esc(m.body)}</textarea></label>
    <details><summary>Footer added automatically</summary><pre>${esc((v.preview ?? "").split("\n--\n")[1] ? "--\n" + v.preview.split("\n--\n")[1] : "")}</pre></details>
    ${v.lead.flags?.length ? `<div class="small"><b>Checker flags:</b> ${v.lead.flags.map(esc).join(", ")} <span class="muted">(re-check the site on the Check screen before quoting them)</span></div>` : ""}
    ${v.lead.looks_dated?.length ? `<div class="small"><b>Visual review:</b> ${v.lead.looks_dated.map(esc).join("; ")}</div>` : ""}
    <div class="row" style="margin-top:10px">
      ${sent ? "" : `<button class="btn" id="save">Save draft</button><button class="btn" id="aiWord" hidden>AI: suggest wording (about US$0.001)</button>`}
      <button class="btn primary" id="gmail" ${v.gmailUrl ? "" : "disabled"}>Open in Gmail</button>
      ${sent ? `<button class="btn" id="replied">They replied</button>` : `<button class="btn ok" id="sent" ${v.mail && ["live", "sent", "replied"].includes(v.lead.status) ? "" : "disabled"}>I sent it</button>`}
    </div>
    ${v.blockers.length ? `<ul class="small" style="color:var(--warn)">${v.blockers.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
    <p class="small muted">Saved to ${esc(v.file)} as well (outside Git).</p>`;

  const dirty = () => ({ to: $("#to", el).value, subject: $("#subject", el).value, body: $("#body", el).value });
  let saved = JSON.stringify(dirty());
  const save = async () => { const r = await api(`email/${encodeURIComponent(id)}`, dirty()); saved = JSON.stringify(dirty()); return r; };
  $("[data-open]", el).onclick = (e) => { e.preventDefault(); openLead(id); };
  if ($("#tpl", el)) $("#tpl", el).onchange = async (e) => {
    if (!e.target.value) return;
    const before = dirty();
    const t = await api(`email/${encodeURIComponent(id)}/template`, { template: e.target.value });
    $("#to", el).value ||= t.to; $("#subject", el).value = t.subject; $("#body", el).value = t.body;
    toast("Template filled from the lead. Fill the [[blanks]], then Save.");
    if (before.body.trim()) {
      const undo = document.createElement("button");
      undo.className = "btn"; undo.textContent = "Undo template";
      undo.onclick = () => { $("#subject", el).value = before.subject; $("#body", el).value = before.body; undo.remove(); };
      e.target.closest(".row").append(undo);
    }
  };
  if ($("#aiWord", el)) {
    aiState().then((ai) => { if (ai.enabled) $("#aiWord", el).hidden = false; });
    $("#aiWord", el).onclick = async (e) => {
      const before = $("#body", el).value;
      e.target.disabled = true;
      try {
        const r = await api("ai/suggest", { leadId: id, kind: "email", draft: before });
        $("#body", el).value = r.text;
        toast(`Suggestion for US$${r.cost.toFixed(4)}: read it, fix anything not true, then Save.`);
        const undo = document.createElement("button");
        undo.className = "btn"; undo.textContent = "Undo suggestion";
        undo.onclick = () => { $("#body", el).value = before; undo.remove(); };
        e.target.after(undo);
      } catch (err) { toast(err.message); }
      e.target.disabled = false;
    };
  }
  if ($("#save", el)) $("#save", el).onclick = async () => { try { await save(); toast("Saved"); editor(el, id); } catch (e) { toast(e.message); } };
  $("#gmail", el).onclick = async () => {
    if (!sent && JSON.stringify(dirty()) !== saved) { toast("Save your changes first"); return; }
    window.open(v.gmailUrl, "_blank", "noopener");
  };
  if ($("#sent", el)) $("#sent", el).onclick = async () => {
    try { await api(`email/${encodeURIComponent(id)}/sent`, {}); toast("Recorded as sent"); location.hash = `#email/${id}`; render($("#view"), id); } catch (e) { toast(e.message); }
  };
  if ($("#replied", el)) $("#replied", el).onclick = async () => { await api(`leads/${encodeURIComponent(id)}/replied`, {}); toast("Marked replied"); render($("#view"), id); };
}
