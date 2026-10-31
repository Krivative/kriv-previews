// Compact working queue. Decisions belong to the single-lead review workspace.
import { api, esc, $, fileUrl, toast, NICHES } from "../ui.js";

const stages = [
  ["attention", "Needs my attention", "◉"], ["review", "Ready for review", "▣"], ["revisions", "Revisions", "↺"],
  ["qa", "Remaining checks", "✓"], ["publishing", "Ready for publishing", "↗"], ["outreach", "Outreach", "✉"],
  ["followups", "Follow-ups", "◷"], ["completed", "Completed / declined", "□"], ["preparing", "In preparation", "⋯"], ["all", "All leads", "≡"],
];
const filters = { stage: "attention", q: "", niche: "", location: "", sort: "priority" };
try { Object.assign(filters, JSON.parse(localStorage.getItem("deskInbox") ?? "{}")); } catch { /* use defaults */ }
const text = (v) => String(v ?? "");
const belongs = (r, stage) => stage === "all" || (stage === "attention" ? r.attention : r.stage === stage);
const href = (r) => `#focus/${encodeURIComponent(r.id)}/${r.step ?? r.action}`;
const actionLabel = (r) => ({ design: "Review preview", checks: "Verify details", build: "Prepare preview", email: "Review email", publish: "Review readiness", "verify-live": "Check publication", followup: "Open follow-up", history: "View history", revision: "View feedback", takedown: "Review removal" })[r.action] ?? "Open lead";
const relative = (date) => {
  const days = Math.floor((Date.now() - Date.parse(date)) / 864e5);
  return !Number.isFinite(days) ? "—" : days < 1 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
};

export async function render(view) {
  let data = await api("workflow");
  if (!stages.some(([key]) => key === filters.stage)) filters.stage = "attention";
  let disposed = false; let timer;
  view.innerHTML = `<div class="desk-workspace">
    <aside class="desk-sidebar"><div class="sidebar-caption">Your workspace</div><nav aria-label="Lead queues" id="queues"></nav>
      <div class="sidebar-bottom"><span class="local-dot"></span>Private on this computer<p>Decisions stay saved when you leave.</p><a href="#dashboard">All records & contact controls ↗</a></div>
    </aside>
    <div class="desk-main"><header class="desk-title"><div><span class="eyebrow">A little clarity for your day</span><h1>Your lead inbox<span>.</span></h1><p>One clear next step for every business.</p></div><button class="btn" id="refresh">↻ Refresh</button></header>
      <div id="continue"></div><div id="overview" class="desk-overview"></div>
      <section class="queue-panel"><div class="queue-title"><div><h2 id="queueTitle"></h2><p id="queueHint"></p></div><span id="shown" class="count-label" aria-live="polite"></span></div>
        <div class="desk-filters"><label class="desk-search"><span class="sr-only">Search leads</span><span aria-hidden="true">⌕</span><input type="search" id="search" placeholder="Search business, location or website" value="${esc(filters.q)}"></label>
        <label><span class="sr-only">Industry</span><select id="industry"><option value="">All industries</option></select></label>
        <label><span class="sr-only">Location</span><select id="location"><option value="">All locations</option></select></label>
        <label><span class="sr-only">Sort leads</span><select id="sort"><option value="priority">Priority first</option><option value="oldest">Waiting longest</option><option value="recent">Recent activity</option><option value="name">Business name</option></select></label></div>
        <div id="queueRows"></div>
      </section>
      <details class="preparation-settings" id="preparation"><summary><span id="preparationSummary"></span><span class="muted">Automatic building settings</span></summary><div class="preparation-content"><p>While the Desk is open it searches Hotfrog in these towns and two chamber-of-commerce member directories a day (16 in Texas, Florida and Utah, in rotation), checks the businesses' websites and builds a preview page plus an email draft for every qualified lead (up to 10 new previews a day). Your part is to review, publish and send. Sites that look fine technically are skipped, and pages you built by hand are never replaced. Review feedback never starts a revision automatically.</p><div id="settingsError" role="alert"></div><form id="settings"><label>Search towns (one to three in Texas, Florida or Utah)<input id="towns" maxlength="160"></label><div class="row"><button class="btn" type="submit">Save towns</button><button class="btn" id="automation" type="button"></button><button class="btn" id="prepare" type="button">Build next one now</button></div></form><p class="small muted">No paid AI. It runs only while this Desk window is open.</p></div></details>
    </div></div>`;
  const save = () => { try { localStorage.setItem("deskInbox", JSON.stringify(filters)); } catch { /* filters are optional */ } };
  const paint = () => {
    const rows = data.rows;
    $("#queues", view).innerHTML = stages.map(([key, label, icon]) => `<button class="queue-link" data-stage="${key}" aria-pressed="${key === filters.stage}"><span class="queue-icon" aria-hidden="true">${icon}</span><span>${label}</span><b>${rows.filter((r) => belongs(r, key)).length}</b></button>`).join("");
    $("#continue", view).innerHTML = data.resume ? `<section class="continue-card"><div class="continue-symbol" aria-hidden="true">↗</div><div><span class="eyebrow">Continue where I left off</span><h2>${esc(data.resume.name)}</h2><p>${esc(data.resume.next)}</p></div><a class="btn primary" href="${href(data.resume)}">Continue <span aria-hidden="true">→</span></a></section>` : `<section class="continue-card"><div><span class="eyebrow">You're all caught up</span><h2>A clear desk. A fresh start.</h2><p>New previews and email drafts are built automatically while the Desk is open. They appear here when they're ready for you.</p></div><a class="btn" href="#review">Review qualified leads →</a></section>`;
    $("#overview", view).innerHTML = [["review", "Ready to review", "Your design decisions"], ["qa", "Checks remaining", "Accepted designs to verify"], ["outreach", "Outreach ready", "Published pages, email next"]].map(([key, title, hint]) => `<button data-stage="${key}" class="overview-stat"><span>${title}</span><strong>${rows.filter((r) => r.stage === key).length}</strong><small>${hint} <span aria-hidden="true">↗</span></small></button>`).join("");
    const matches = rows.filter((r) => belongs(r, filters.stage) && (!filters.niche || r.niche === filters.niche) && (!filters.location || r.state === filters.location) && (!filters.q || [r.name, r.town, r.state, r.website, NICHES[r.niche] ?? r.niche].join(" ").toLowerCase().includes(filters.q.toLowerCase())));
    matches.sort((a, b) => filters.sort === "name" ? text(a.name).localeCompare(text(b.name)) : filters.sort === "recent" ? text(b.updatedAt).localeCompare(text(a.updatedAt)) : filters.sort === "oldest" ? text(a.updatedAt).localeCompare(text(b.updatedAt)) : a.priority - b.priority || text(a.updatedAt).localeCompare(text(b.updatedAt)));
    $("#queueTitle", view).textContent = stages.find(([key]) => key === filters.stage)?.[1] ?? "Leads";
    $("#queueHint", view).textContent = filters.stage === "attention" ? "The decisions and next steps that need you." : filters.stage === "revisions" ? "Your feedback is saved. Changes are handled separately." : filters.stage === "publishing" ? "Review readiness and confirm before anything becomes public." : "Open a business to pick up the next step.";
    $("#shown", view).textContent = `${matches.length} ${matches.length === 1 ? "business" : "businesses"}`;
    $("#queueRows", view).innerHTML = matches.length ? `<div class="inbox-column-head" aria-hidden="true"><span>Business</span><span>Current progress</span><span>Last activity</span><span>Next action</span></div><ul class="inbox-list">${matches.map((r) => `<li class="inbox-row"><div class="business-cell">${r.thumbnail ? `<img src="${fileUrl(r.thumbnail)}" alt="" loading="lazy">` : `<span class="business-monogram" aria-hidden="true">${esc(r.name.slice(0, 1))}</span>`}<div><a class="business-name" href="${href(r)}">${esc(r.name)}</a><p>${esc([NICHES[r.niche] ?? r.niche, [r.town, r.state].filter(Boolean).join(", ")].filter(Boolean).join(" · "))}</p></div></div><div class="progress-cell"><span class="stage-label stage-${r.stage}">${esc(r.label)}</span><div class="step-progress" aria-label="${r.completedSteps} of ${r.totalSteps} workflow steps complete">${r.progress.map((done) => `<span class="${done ? "done" : ""}"></span>`).join("")}</div></div><span class="activity-cell" title="${esc(new Date(r.updatedAt).toLocaleString())}">${relative(r.updatedAt)}</span><div class="next-cell"><p>${esc(r.next)}</p><a class="btn queue-action" href="${href(r)}">${actionLabel(r)} <span aria-hidden="true">→</span></a></div></li>`).join("")}</ul>` : `<div class="desk-empty"><span aria-hidden="true">✓</span><h3>${filters.q || filters.niche || filters.location ? "No matching businesses" : "Nothing waiting here"}</h3><p>${filters.q || filters.niche || filters.location ? "Try another search or clear your filters." : "Choose another queue, or come back as work moves forward."}</p><button class="btn" id="clear">${filters.q || filters.niche || filters.location ? "Clear filters" : "Show all leads"}</button></div>`;
    const a = data.automation;
    $("#preparationSummary", view).textContent = a.enabled ? "● Automatic building on" : "○ Automatic building paused";
    $("#towns", view).value = a.search.towns.join(", ");
    $("#automation", view).textContent = a.enabled ? "Pause automatic building" : "Turn automatic building back on";
    $("#prepare", view).disabled = !a.enabled;
    $("#industry", view).innerHTML = '<option value="">All industries</option>' + [...new Set(rows.map((r) => r.niche).filter(Boolean))].sort().map((n) => `<option value="${esc(n)}">${esc(NICHES[n] ?? n)}</option>`).join(""); $("#industry", view).value = filters.niche;
    $("#location", view).innerHTML = '<option value="">All locations</option>' + [...new Set(rows.map((r) => r.state).filter(Boolean))].sort().map((n) => `<option>${esc(n)}</option>`).join(""); $("#location", view).value = filters.location;
    $("#sort", view).value = filters.sort;
  };
  paint();
  view.onclick = (e) => {
    const stage = e.target.closest("[data-stage]");
    if (stage) { filters.stage = stage.dataset.stage; save(); paint(); }
    if (e.target.closest("#clear")) { filters.q = ""; filters.niche = ""; filters.location = ""; filters.stage = "all"; $("#search", view).value = ""; save(); paint(); }
  };
  $("#search", view).oninput = (e) => { filters.q = e.target.value; save(); paint(); };
  for (const [id, key] of [["industry", "niche"], ["location", "location"], ["sort", "sort"]]) $("#" + id, view).onchange = (e) => { filters[key] = e.target.value; save(); paint(); };
  const refresh = async () => { data = await api("workflow"); if (!disposed && view.isConnected) paint(); };
  $("#refresh", view).onclick = async (e) => { e.target.disabled = true; try { await refresh(); } catch (err) { toast(err.message); } finally { e.target.disabled = false; } };
  const settings = async (body) => {
    $("#settingsError", view).textContent = "";
    try { await api("inbox/settings", body); await refresh(); toast("Preparation settings saved."); } catch (e) { $("#settingsError", view).textContent = e.message; }
  };
  $("#settings", view).onsubmit = async (e) => { e.preventDefault(); await settings({ search: { source: "hotfrog", towns: $("#towns", view).value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) } }); };
  $("#automation", view).onclick = () => settings({ enabled: !data.automation.enabled });
  $("#prepare", view).onclick = async (e) => { e.target.disabled = true; try { await api("inbox/prepare", {}); toast("Preparation check requested. You can keep reviewing."); } catch (err) { toast(err.message); } finally { e.target.disabled = !data.automation.enabled; } };
  const poll = async () => {
    if (disposed) return;
    if (!view.contains(document.activeElement) && !$("#preparation", view).open) { try { await refresh(); } catch { /* manual refresh remains available */ } }
    if (!disposed) timer = setTimeout(poll, 20000);
  };
  timer = setTimeout(poll, 20000);
  return { dispose: () => { disposed = true; clearTimeout(timer); view.onclick = null; } };
}
