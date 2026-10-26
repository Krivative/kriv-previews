// Check sites: check-site.mjs in batches of 20 (one at a time), results in plain English with
// the phone screenshot. Bot walls and geo-blocks show as "not checked", never as weak.
import { api, esc, $, $$, toast, pill, bucketPill, link, fileUrl, openLead, watchJob, NICHES } from "../ui.js";

let since = null;
export async function render(view) {
  const job = await api("job");
  since ??= job.kind === "check" ? job.startedAt : null;
  view.innerHTML = `
    <h1>Check sites</h1>
    <p class="small muted">Each website is opened the way a phone shows it (home page and one contact page), 20 at a time, one batch after the other. A blocked or bot-walled site is listed as "not checked", never as weak.</p>
    <div id="job"></div>
    <section class="panel" style="display:grid;gap:10px">
      <h2 style="margin:0">Websites not checked yet</h2>
      <div class="row">
        <select id="state" aria-label="State"><option value="">Any state</option><option>TX</option><option>FL</option><option>UT</option></select>
        <select id="niche" aria-label="Niche"><option value="">Any niche</option>${Object.entries(NICHES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
        <span id="qcount" class="small muted"></span>
      </div>
      <div id="queue" style="max-height:260px;overflow:auto"></div>
      <label>Or paste websites, one per line <textarea id="paste" rows="3" placeholder="https://example-dental.com"></textarea></label>
      <div class="row"><button class="btn primary" id="go">Check selected</button><span class="small muted">A batch of 20 takes about 5 to 10 minutes.</span></div>
    </section>
    <section class="panel"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Results</h2><span class="small muted" id="rcount"></span></div><div id="results"></div></section>`;

  const loadQueue = async () => {
    const q = await api(`check/queue?state=${$("#state", view).value}&niche=${$("#niche", view).value}`);
    $("#qcount", view).textContent = `${q.rows.length} waiting`;
    $("#queue", view).innerHTML = q.rows.length ? `<table><thead><tr><th><input type="checkbox" id="all" checked aria-label="Select the first 20"></th><th>Business</th><th>Where</th><th>Website</th></tr></thead><tbody>${q.rows.map((r, i) => `
      <tr><td><input type="checkbox" data-url="${esc(r.website)}" ${i < q.batch ? "checked" : ""} aria-label="Check ${esc(r.name ?? r.website)}"></td><td>${esc(r.name ?? "")}</td><td>${esc([r.town, r.state].filter(Boolean).join(", "))} · ${esc(NICHES[r.niche] ?? r.niche ?? "")}</td><td class="small">${link(r.website)}</td></tr>`).join("")}</tbody></table>` : '<p class="muted small">Nothing waiting. Find leads first, or paste websites below.</p>';
    const all = $("#all", view);
    if (all) all.onchange = () => $$("[data-url]", view).forEach((c, i) => (c.checked = all.checked && i < q.batch));
  };
  const loadResults = async () => {
    const rows = await api(`check/results${since ? `?since=${encodeURIComponent(since)}` : ""}`);
    $("#rcount", view).textContent = `${rows.length} checked ${since ? "since the last run started" : "in the last 24 hours"}`;
    $("#results", view).innerHTML = rows.length ? `<table><thead><tr><th>Phone view</th><th>Business and website</th><th>Verdict</th><th>Problems</th></tr></thead><tbody>${rows.map((r) => `
      <tr ${r.leadId ? `data-open="${esc(r.leadId)}"` : ""}>
        <td style="width:110px">${r.shot ? `<a href="${fileUrl(r.shot)}" target="_blank"><img loading="lazy" src="${fileUrl(r.shot)}" alt="" style="width:100px;border:1px solid var(--line);border-radius:4px"></a>` : ""}</td>
        <td><b>${esc(r.name ?? r.host)}</b><br><span class="small">${link(r.url)}</span></td>
        <td>${r.notChecked ? pill("not checked", "b-notChecked") : r.weak ? pill("weak", "st-draft") : pill("modern", "b-none")}<br>${bucketPill(r.bucket)}</td>
        <td class="small">${r.notChecked ? esc(r.why ?? "blocked") : r.problems.length ? `<ul style="margin:0;padding-left:18px">${r.problems.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : '<span class="muted">none found</span>'}</td></tr>`).join("")}</tbody></table>` : '<p class="muted small">No results yet.</p>';
  };
  $("#state", view).onchange = loadQueue;
  $("#niche", view).onchange = loadQueue;
  $("#go", view).onclick = async () => {
    const urls = [...$$("[data-url]:checked", view).map((c) => c.dataset.url), ...$("#paste", view).value.split(/\s+/).filter((u) => /\./.test(u))];
    try { const j = await api("check", { urls }); since = j.startedAt; toast(j.label); render(view); } catch (e) { toast(e.message); }
  };
  view.onclick = (e) => { const o = e.target.closest("tr[data-open]"); if (o && !e.target.closest("a,input")) openLead(o.dataset.open); };
  await Promise.all([loadQueue(), loadResults()]);
  watchJob($("#job", view), (j) => { if (j.kind === "check") { loadQueue(); loadResults(); } });
}
