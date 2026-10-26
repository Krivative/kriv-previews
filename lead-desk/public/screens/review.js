// Review: qualified leads (ready for a preview), sites waiting for the visual review, near misses
// and not checked. The weak-website and business-mailbox rules are unchanged (scripts/finder/rules.mjs).
import { api, esc, $, $$, toast, pill, link, fileUrl, openLead, watchJob, NICHES } from "../ui.js";

const TABS = { qualified: "Qualified", toReview: "Visual review", near: "Near misses", notChecked: "Not checked" };
const ui = { tab: "qualified", state: "", niche: "" };
try { Object.assign(ui, JSON.parse(localStorage.getItem("deskReview") ?? "{}")); } catch {}

export async function render(view) {
  const d = await api(`review?tab=${ui.tab}&state=${ui.state}&niche=${ui.niche}`);
  const save = () => { try { localStorage.setItem("deskReview", JSON.stringify(ui)); } catch {} };
  view.innerHTML = `
    <h1>Review</h1>
    <div class="row">${Object.entries(TABS).map(([k, v]) => `<button class="chip" data-tab="${k}" aria-pressed="${ui.tab === k}">${v} <b>${d.counts[k] ?? 0}</b></button>`).join("")}
      <select id="state" aria-label="State"><option value="">Any state</option>${["TX", "FL", "UT"].map((s) => `<option ${ui.state === s ? "selected" : ""}>${s}</option>`).join("")}</select>
      <select id="niche" aria-label="Niche"><option value="">Any niche</option>${Object.entries(NICHES).map(([k, v]) => `<option value="${k}" ${ui.niche === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
    <p class="small muted">${{
      qualified: "Weak or no website, a business mailbox that receives mail, and independent. Build a preview for each one you want to contact.",
      toReview: "These sites pass the technical check and show a business email. Tick what fails; 2 or more failed items make the site count as weak, and it moves to Qualified. A site that already looks professional and only needs tweaks is not a lead: leave it unticked and click Not dated.",
      near: "Weak or no website, but no deliverable business email, or the business has a good site elsewhere.",
      notChecked: "Blocked from this network (bot wall, geo-block or timeout). Never treated as weak.",
    }[ui.tab]}</p>
    <div id="job"></div>
    ${ui.tab === "toReview" ? `<div class="row"><button class="btn" id="shoot">Take missing screenshots (${d.rows.filter((r) => !r.shots.desktop).length})</button></div>` : ""}
    <div id="rows" style="display:grid;gap:12px">${d.rows.map((r) => row(r, d)).join("") || '<p class="muted">Nothing here.</p>'}</div>`;

  $$("[data-tab]", view).forEach((b) => (b.onclick = () => { ui.tab = b.dataset.tab; save(); render(view); }));
  $("#state", view).onchange = (e) => { ui.state = e.target.value; save(); render(view); };
  $("#niche", view).onchange = (e) => { ui.niche = e.target.value; save(); render(view); };
  if ($("#shoot", view)) $("#shoot", view).onclick = async () => {
    try { await api("review/shots", { keys: d.rows.filter((r) => !r.shots.desktop).slice(0, 40).map((r) => r.key) }); watchJob($("#job", view), () => render(view)); } catch (e) { toast(e.message); }
  };
  view.onclick = async (e) => {
    const card = e.target.closest("[data-key]");
    if (!card) return;
    if (e.target.closest("[data-open]")) { e.preventDefault(); return openLead(card.dataset.id); }
    const grade = e.target.closest("[data-grade]");
    if (!grade) return;
    const failed = grade.dataset.grade === "none" ? [] : $$("[data-item]", card).filter((c) => c.checked).map((c) => {
      const words = $(`[data-words="${c.dataset.item}"]`, card).value.trim();
      return words || d.checklist[Number(c.dataset.item)];
    });
    const r = await api(`visual/${encodeURIComponent(card.dataset.key)}`, { failed });
    toast(r.bucket === "qualified" ? `${card.dataset.name}: qualified (${failed.length} failed)` : `${card.dataset.name}: ${failed.length} failed, ${r.bucket === "toReview" ? "not dated" : r.bucket}`);
    card.remove();
  };
  watchJob($("#job", view), () => render(view));
}

function row(r, d) {
  const img = (p, w) => (p ? `<a href="${fileUrl(p)}" target="_blank"><img loading="lazy" src="${fileUrl(p)}" alt="" style="width:${w};border:1px solid var(--line);border-radius:6px"></a>` : "");
  const shots = r.shots.desktop || r.shots.phone ? `<div class="shots">${img(r.shots.desktop, "100%")}${img(r.shots.phone, "100%")}</div>` : "";
  const head = `<div class="row" style="justify-content:space-between"><div><span class="eyebrow">${esc(NICHES[r.niche] ?? r.niche ?? "")} · ${esc([r.town, r.state].filter(Boolean).join(", "))}</span>
      <h2 style="margin:0"><a href="#" data-open>${esc(r.name || r.website)}</a></h2></div><span>${pill(r.status)} ${r.optedOut ? pill("opted out", "optout") : ""}</span></div>
    <div class="small">${r.website ? link(r.website) : "no website"} · <span class="flag">${esc(r.website_status ?? "")}</span>${r.email ? ` · <span class="mono">${esc(r.email)}</span> ${r.email_found_at ? `(found on ${link(r.email_found_at)})` : ""}` : ""}</div>
    ${r.why ? `<div class="small muted">${esc(r.why)}</div>` : ""}
    ${r.looks_dated.length ? `<div class="small"><b>Looks dated:</b> ${r.looks_dated.map(esc).join("; ")}</div>` : ""}`;
  if (ui.tab === "toReview") return `<article class="panel" data-key="${esc(r.key)}" data-id="${esc(r.id)}" data-name="${esc(r.name)}" style="display:grid;gap:8px">${head}${shots || '<p class="small muted">No screenshot yet.</p>'}
    <fieldset style="border:1px solid var(--line);border-radius:8px;display:grid;gap:6px"><legend class="small">What fails? Add specific, polite words if you like (the email quotes them)</legend>
      ${d.checklist.map((c, i) => `<div class="row"><label class="row" style="display:flex;flex:1"><input type="checkbox" data-item="${i}"> ${esc(c)}</label><input data-words="${i}" placeholder="e.g. the homepage has no photos of your work" style="flex:1;min-width:220px" aria-label="Specific words for: ${esc(c)}"></div>`).join("")}
    </fieldset>
    <div class="row"><button class="btn primary" data-grade="save">Save grade</button><button class="btn" data-grade="none">Not dated (looks professional)</button></div></article>`;
  return `<article class="panel" data-key="${esc(r.key)}" data-id="${esc(r.id)}" style="display:grid;gap:8px">${head}
    ${ui.tab === "qualified" ? `<div class="row">${r.status === "found" ? `<a class="btn primary" href="#build/${esc(r.id)}">Build preview</a>` : r.slug ? `<a class="btn" href="#build/${esc(r.id)}">Edit preview</a>` : ""}<a class="btn" href="#" data-open>Details</a></div>` : ""}
    ${ui.tab !== "qualified" && shots ? `<details><summary class="small">Screenshots</summary>${shots}</details>` : ""}</article>`;
}
