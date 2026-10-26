// LinkedIn: who to contact, a connection note (200 characters max) and a follow-up, copy buttons
// and a status Kriv sets by hand. The desk never logs in to or automates LinkedIn.
import { api, esc, $, $$, toast, pill, link, copy, aiState } from "../ui.js";

export async function render(view, id) {
  const d = await api("linkedin");
  view.innerHTML = `
    <h1>LinkedIn</h1>
    <p class="small muted">Copy the note, open the profile in your own browser, and send the request yourself. Then set the status here. LinkedIn is extra: every lead still gets an email.</p>
    <div id="cards" style="display:grid;gap:12px">${d.rows.map((r) => card(r, d)).join("") || '<p class="muted">No leads to contact yet.</p>'}</div>`;
  if (id) $(`[data-id="${CSS.escape(id)}"]`, view)?.scrollIntoView({ block: "start" });
  aiState().then((ai) => { if (ai.enabled) $$("[data-ai]", view).forEach((b) => (b.hidden = false)); });

  const counter = (ta) => {
    const c = $(`.counter[data-for="${ta.id}"]`, view);
    if (!c) return;
    c.textContent = `${ta.value.length} / ${d.max}`;
    c.classList.toggle("over", ta.value.length > d.max);
  };
  $$("textarea[data-max]", view).forEach((ta) => { counter(ta); ta.addEventListener("input", () => counter(ta)); });
  view.onclick = async (e) => {
    const card = e.target.closest("[data-id]");
    if (!card) return;
    const lid = card.dataset.id;
    const val = (f) => $(`[data-f="${f}"]`, card)?.value ?? "";
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.copy) return copy(val(b.dataset.copy), b);
    if (b.dataset.ai) {
      b.disabled = true;
      try {
        const r = await api("ai/suggest", { leadId: lid, kind: "linkedin", draft: val("note") });
        const ta = $(`[data-f="note"]`, card);
        ta.value = r.text;
        ta.dispatchEvent(new Event("input"));
        toast(`Suggestion for US$${r.cost.toFixed(4)}: check it, then Save.`);
      } catch (err) { toast(err.message); }
      b.disabled = false;
      return;
    }
    if (b.dataset.fill) {
      const r = await api(`linkedin/${encodeURIComponent(lid)}/fill`, { template: $(`[data-tpl="${b.dataset.fill}"]`, card).value, owner_first_name: val("first") });
      const ta = $(`[data-f="${b.dataset.fill}"]`, card);
      ta.value = r.text;
      ta.dispatchEvent(new Event("input"));
      if (/\[\[/.test(r.text)) toast("Fill the [[blanks]] before copying");
    }
    if (b.dataset.save !== undefined) {
      try {
        await api(`linkedin/${encodeURIComponent(lid)}`, { who: val("who"), url: val("url") || null, confidence: val("confidence"), note: val("note"), followup: val("followup"), status: val("status") });
        toast("Saved");
        render(view, lid);
      } catch (err) { toast(err.message); }
    }
  };
}

function card(r, d) {
  const id = r.id.replace(/[^a-z0-9-]/gi, "");
  const tpl = (kind, list) => `<select data-tpl="${kind}" aria-label="Template">${list.map((t) => `<option value="${esc(t.id)}">${esc(t.label)}</option>`).join("")}</select>`;
  return `<article class="panel" data-id="${esc(r.id)}" style="display:grid;gap:8px">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(r.name)}</h2><span>${pill(r.status)} ${pill(r.li_status ?? "no contact yet", r.li_status === "to send" ? "st-draft" : r.li_status ? "st-sent" : "b-none")}</span></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
      <label>Owner or page <input data-f="who" value="${esc(r.who ?? "")}" placeholder="Name and role, or company page"></label>
      <label>First name (for the note) <input data-f="first" value="${esc((r.who ?? "").match(/^([A-Z][a-z]+)\s/)?.[1] ?? "")}"></label>
      <label>Profile link <input data-f="url" value="${esc(r.url ?? "")}" placeholder="https://www.linkedin.com/in/…"></label>
      <label>How sure <select data-f="confidence">${["", "confirmed", "likely", "check"].map((c) => `<option ${r.confidence === c ? "selected" : ""}>${c}</option>`).join("")}</select></label>
    </div>
    ${r.how ? `<div class="small muted">${esc(r.how)}</div>` : ""}
    ${r.url ? `<div class="small">Open in your browser: ${link(r.url, r.url)}</div>` : ""}
    <label>Connection note <span class="counter small" data-for="note-${id}"></span><textarea id="note-${id}" data-f="note" data-max="${d.max}" rows="3">${esc(r.note ?? "")}</textarea></label>
    <div class="row">${tpl("note", d.templates.note)}<button class="btn" data-fill="note">Fill from template</button><button class="btn" data-ai="note" hidden>AI: suggest (about US$0.001)</button><button class="btn" data-copy="note">Copy note</button></div>
    <label>Follow-up message (after they accept)<textarea id="fu-${id}" data-f="followup" rows="3">${esc(r.followup ?? "")}</textarea></label>
    <div class="row">${tpl("followup", d.templates.followup)}<button class="btn" data-fill="followup">Fill from template</button><button class="btn" data-copy="followup">Copy follow-up</button></div>
    <div class="row"><label class="row" style="display:flex">Status <select data-f="status">${d.statuses.map((s) => `<option ${(r.li_status ?? "to send") === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
      <button class="btn primary" data-save>Save</button>${r.sent_at ? `<span class="small muted">sent ${esc(new Date(r.sent_at).toLocaleDateString())}</span>` : ""}</div>
  </article>`;
}
