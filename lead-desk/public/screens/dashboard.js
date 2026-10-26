// Dashboard: counts, Needs Kriv, every lead with filters, opt-outs, setup tasks.
import { api, esc, $, $$, toast, openLead, pill, bucketPill, NICHES, BUCKETS, when, aiState } from "../ui.js";

const STATUSES = ["found", "draft", "approved", "live", "sent", "replied", "declined", "expired"];
const ui = { status: "", bucket: "", state: "", niche: "", q: "", linkedin: "" };
try { Object.assign(ui, JSON.parse(localStorage.getItem("deskFilters") ?? "{}")); } catch {}
const saveUi = () => { try { localStorage.setItem("deskFilters", JSON.stringify(ui)); } catch {} };

export async function render(view) {
  const s = await api("summary");
  const tile = (label, n, filter) => `<div class="panel stat"><button data-filter='${esc(JSON.stringify(filter ?? {}))}'><span class="eyebrow">${label}</span><b>${n ?? 0}</b></button></div>`;
  const live = (s.byStatus.live ?? 0) + (s.byStatus.sent ?? 0) + (s.byStatus.replied ?? 0);
  view.innerHTML = `
    <div class="row" style="justify-content:space-between"><h1>Dashboard</h1>
      <span class="small muted">${s.total} businesses · imported ${esc(when(s.importedAt))}</span></div>
    <section class="grid">
      ${tile("Qualified", s.byBucket.qualified, { bucket: "qualified" })}
      ${tile("To visual review", s.byBucket.toReview, { bucket: "toReview", status: "found" })}
      ${tile("Near misses", s.byBucket.near, { bucket: "near" })}
      ${tile("Not checked", s.byBucket.notChecked, { bucket: "notChecked" })}
      ${tile("Awaiting approval", s.byStatus.draft, { status: "draft" })}
      ${tile("Pages live", live, { status: "live,sent,replied" })}
      ${tile("Emails sent", s.emailsSent, { status: "sent,replied" })}
      ${tile("LinkedIn sent", s.linkedinSent, { linkedin: "1" })}
      ${tile("Replied", s.byStatus.replied, { status: "replied" })}
      ${tile("Declined", s.byStatus.declined, { status: "declined" })}
    </section>
    <section><h2>Needs Kriv (${s.needs.length})</h2>
      ${s.needs.length ? `<ul class="tasks">${s.needs.map((n) => `<li>${n.id ? `<a href="#" data-open="${esc(n.id)}">${esc(n.title)}</a>` : esc(n.title)} <a class="go small" href="#${esc(n.screen)}${n.id ? `/${esc(n.id)}` : ""}">open ${esc(n.screen)} →</a></li>`).join("")}</ul>` : `<p class="muted">Nothing waiting for you.</p>`}
    </section>
    <section class="panel">
      <div class="row" style="justify-content:space-between"><h2 style="margin:0">Leads</h2><span id="shown" class="small muted"></span></div>
      <div class="row" style="margin:10px 0">
        <input id="q" type="search" placeholder="Search name, town, website, email" value="${esc(ui.q)}" aria-label="Search leads" style="flex:1;min-width:200px">
        <select id="fStatus" aria-label="Status"><option value="">Any status</option>${STATUSES.map((x) => `<option ${ui.status === x ? "selected" : ""}>${x}</option>`).join("")}${ui.status.includes(",") ? `<option selected value="${esc(ui.status)}">${esc(ui.status)}</option>` : ""}</select>
        <select id="fBucket" aria-label="List"><option value="">Any list</option>${Object.entries(BUCKETS).map(([k, v]) => `<option value="${k}" ${ui.bucket === k ? "selected" : ""}>${v}</option>`).join("")}</select>
        <select id="fState" aria-label="State"><option value="">Any state</option>${Object.keys(s.byState).filter(Boolean).sort().map((x) => `<option ${ui.state === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>
        <select id="fNiche" aria-label="Niche"><option value="">Any niche</option>${Object.keys(s.byNiche).filter(Boolean).sort().map((x) => `<option value="${esc(x)}" ${ui.niche === x ? "selected" : ""}>${esc(NICHES[x] ?? x)}</option>`).join("")}</select>
        <label class="row" style="display:flex"><input type="checkbox" id="fLi" ${ui.linkedin ? "checked" : ""}> Has LinkedIn</label>
        <button class="btn" id="clear">Clear</button>
      </div>
      <div style="overflow-x:auto"><table><thead><tr><th>Business</th><th>Where</th><th class="hide-sm">Niche</th><th>Status</th><th class="hide-sm">Website</th><th class="hide-sm">Email</th></tr></thead><tbody id="rows"></tbody></table></div>
    </section>
    <section class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
      <div class="panel"><h2>Do-not-contact list (${s.optOuts.length})</h2>
        <p class="small muted">Someone replied "unsubscribe" or similar? Add the address: its domain is added too (except Gmail and other free-mail domains), and their lead is set to expired. Entries are never removed.</p>
        <form id="optForm" class="row"><input id="optValue" placeholder="name@business.com or business.com" aria-label="Email or domain" style="flex:1"><input id="optReason" placeholder="reason (optional)" aria-label="Reason"><button class="btn bad">Add</button></form>
        <ul class="small">${s.optOuts.map((o) => `<li><span class="mono">${esc(o.value)}</span> <span class="muted">${esc(o.kind)} · ${esc(when(o.at))}${o.reason ? ` · ${esc(o.reason)}` : ""}</span></li>`).join("") || '<li class="muted">Empty.</li>'}</ul>
      </div>
      <div class="panel"><h2>Your setup tasks</h2>
        <ul class="tasks">${s.setup.map((t) => `<li class="${t.done ? "done" : ""}"><label class="row" style="display:flex"><input type="checkbox" data-task="${t.id}" ${t.done ? "checked" : ""}> <b>${esc(t.title)}</b></label><div class="small muted">${esc(t.when_text)}</div><div class="small">${esc(t.what)} ${t.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(" ")}</div></li>`).join("")}</ul>
      </div>
    </section>
    <section class="panel"><h2>Data</h2>
      <div class="row"><button class="btn" id="reimport">Re-import old files</button><button class="btn" id="rerules">Re-run the lead rules</button><span class="small muted">Both are safe to repeat: they never undo your decisions.</span></div>
      <div id="ai" style="margin-top:10px"></div>
      <details style="margin-top:10px"><summary>Recent activity</summary><ul class="small" id="activity"></ul></details>
    </section>`;
  const ai = await aiState();
  $("#ai", view).innerHTML = ai.available
    ? `<label class="row" style="display:flex"><input type="checkbox" id="aiOn" ${ai.enabled ? "checked" : ""}> <b>AI help</b> (${esc(ai.model)}): prefill the preview form and suggest wording. About US$0.003 per lead; spent so far US$${ai.spent.toFixed(4)}.</label>`
    : `<span class="small muted">AI help is off: no ANTHROPIC_API_KEY in .env.local (optional; see docs/LEAD-DESK.md).</span>`;
  if ($("#aiOn", view)) $("#aiOn", view).onchange = async (e) => { await api("ai", { enabled: e.target.checked }); toast(`AI help ${e.target.checked ? "on" : "off"}`); };

  const load = async () => {
    const qs = new URLSearchParams(Object.entries(ui).filter(([, v]) => v)).toString();
    const rows = await api(`leads?${qs}`);
    $("#shown", view).textContent = `${rows.length} shown`;
    $("#rows", view).innerHTML = rows.map((r) => `<tr data-open="${esc(r.id)}">
      <td><b>${esc(r.name || r.website || r.id)}</b>${r.note ? ' <span title="has a note">✎</span>' : ""}</td>
      <td>${esc([r.town, r.state].filter(Boolean).join(", "))}</td>
      <td class="hide-sm">${esc(NICHES[r.niche] ?? r.niche ?? "")}</td>
      <td>${pill(r.status)} ${bucketPill(r.bucket)} ${r.optedOut ? pill("opted out", "optout") : ""}</td>
      <td class="hide-sm small">${esc(r.website_status ?? "")}</td>
      <td class="hide-sm small mono">${esc(r.email ?? "")}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">No leads match these filters.</td></tr>`;
  };
  await load();

  const set = (k, v) => { ui[k] = v; saveUi(); load(); };
  $("#q", view).addEventListener("input", (e) => set("q", e.target.value.trim()));
  $("#fStatus", view).onchange = (e) => set("status", e.target.value);
  $("#fBucket", view).onchange = (e) => set("bucket", e.target.value);
  $("#fState", view).onchange = (e) => set("state", e.target.value);
  $("#fNiche", view).onchange = (e) => set("niche", e.target.value);
  $("#fLi", view).onchange = (e) => set("linkedin", e.target.checked ? "1" : "");
  $("#clear", view).onclick = () => { Object.keys(ui).forEach((k) => (ui[k] = "")); saveUi(); render(view); };
  $$("[data-filter]", view).forEach((b) => (b.onclick = () => { Object.keys(ui).forEach((k) => (ui[k] = "")); Object.assign(ui, JSON.parse(b.dataset.filter)); saveUi(); render(view).then(() => $("#rows", view).scrollIntoView({ block: "start" })); }));
  view.onclick = (e) => {
    const o = e.target.closest("[data-open]");
    if (o) { e.preventDefault(); openLead(o.dataset.open); }
  };
  $("#optForm", view).onsubmit = async (e) => {
    e.preventDefault();
    try {
      const r = await api("optouts", { value: $("#optValue", view).value, reason: $("#optReason", view).value || null });
      toast(`Added ${r.added.join(", ")}; ${r.expired.length} lead(s) set to expired`);
      render(view);
    } catch (err) { toast(err.message); }
  };
  $$("[data-task]", view).forEach((c) => (c.onchange = async () => { await api(`setup/${c.dataset.task}`, { done: c.checked }); render(view); }));
  $("#reimport", view).onclick = async (e) => { e.target.disabled = true; const r = await api("import", {}); toast(`Imported: ${Object.entries(r).map(([k, v]) => `${k} ${v}`).join(", ")}`); render(view); };
  $("#rerules", view).onclick = async (e) => { e.target.disabled = true; e.target.textContent = "Running (checks mail records)…"; const r = await api("rules", {}); toast(`Rules: ${r.qualified} qualified, ${r.toReview} to review, ${r.near} near misses, ${r.added} new, ${r.updated} updated`); render(view); };
  $("#activity", view).innerHTML = (await api("history")).map((h) => `<li>${esc(when(h.at))}: <b>${esc(h.action)}</b> ${esc(h.name ?? "")} <span class="muted">${esc(String(h.detail ?? "").slice(0, 160))}</span></li>`).join("");
}
