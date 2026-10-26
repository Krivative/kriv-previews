// Find leads: public directory listings for a state, towns and niches, collected slowly (several
// seconds between requests). Chains, specialists and the do-not-contact list are skipped.
import { api, esc, $, $$, toast, watchJob, NICHES, when } from "../ui.js";

export async function render(view) {
  const o = await api("find/options");
  view.innerHTML = `
    <h1>Find leads</h1>
    <p class="small muted">Sources that work from your network: <b>Hotfrog</b> town pages and <b>ChamberMaster</b> member directories. Yellowpages, Yelp and BBB block the Philippines, so they aren't offered. One request at a time with a 4 to 9 second pause; a blocked page is skipped, never worked around.</p>
    <div id="job"></div>
    <section class="panel" style="display:grid;gap:12px">
      <div class="row"><label>Source <select id="source"><option value="hotfrog">Hotfrog towns</option><option value="chamber">Chamber directory</option></select></label>
        <label id="stateWrap">State <select id="state">${Object.keys(o.towns).map((s) => `<option>${s}</option>`).join("")}</select></label></div>
      <fieldset id="towns" style="border:1px solid var(--line);border-radius:8px"><legend class="small">Towns</legend><div class="row" id="townBoxes"></div>
        <label style="margin-top:8px">Other towns (Hotfrog style, e.g. <span class="mono">gainesville-fl</span>), comma-separated <input id="extra"></label></fieldset>
      <label id="listsWrap" hidden>Chamber directory addresses, one per line (ending in <span class="mono">/list/</span>) <textarea id="lists" rows="3" placeholder="https://business.example-chamber.org/list/"></textarea></label>
      <fieldset style="border:1px solid var(--line);border-radius:8px"><legend class="small">Niches</legend><div class="row">${o.niches.map((n) => `<label class="row" style="display:flex"><input type="checkbox" data-niche="${n}" checked> ${esc(NICHES[n] ?? n)}</label>`).join("")}</div></fieldset>
      <div class="row"><button class="btn primary" id="go">Find</button><span class="small muted" id="estimate"></span></div>
      <p class="small muted" style="margin:0">Then check the new websites on the Check screen. Businesses without a website are judged right away.</p>
    </section>
    <section class="panel"><h2>Earlier searches</h2><ul class="small">${o.recent.map((r) => `<li>${esc(when(r.at))}: ${esc(r.label)}: ${r.listings} listings, ${r.new} new, ${r.known} known, ${r.chains} chains or specialists, ${r.doNotContact} do-not-contact, ${r.toCheck} to check${r.blocked ? `, <b>${r.blocked} blocked</b>` : ""}</li>`).join("") || '<li class="muted">None from the desk yet.</li>'}</ul></section>`;

  const towns = () => {
    const st = $("#state", view).value;
    $("#townBoxes", view).innerHTML = o.towns[st].map((t) => `<label class="row" style="display:flex"><input type="checkbox" data-town="${t}-${st.toLowerCase()}"> ${esc(t.replace(/-/g, " "))}</label>`).join("");
  };
  const extra = () => $("#extra", view).value.split(",").map((s) => s.trim().toLowerCase().replace(/[^a-z-]/g, "")).filter(Boolean);
  const estimate = () => {
    const n = $$("[data-town]:checked", view).length + extra().length;
    const cats = $$("[data-niche]:checked", view).length * 2.3;
    $("#estimate", view).textContent = $("#source", view).value === "hotfrog" && n ? `About ${Math.max(1, Math.round((n * cats * 7) / 60))} minutes for the search pages, plus about 7 seconds per listing found.` : "";
  };
  towns();
  $("#state", view).onchange = () => { towns(); estimate(); };
  $("#source", view).onchange = () => {
    const chamber = $("#source", view).value === "chamber";
    $("#towns", view).hidden = chamber; $("#stateWrap", view).hidden = chamber; $("#listsWrap", view).hidden = !chamber; estimate();
  };
  view.addEventListener("change", estimate);
  $("#extra", view).addEventListener("input", estimate);
  $("#go", view).onclick = async () => {
    const body = {
      source: $("#source", view).value,
      towns: [...$$("[data-town]:checked", view).map((c) => c.dataset.town), ...extra()],
      niches: $$("[data-niche]:checked", view).map((c) => c.dataset.niche),
      lists: $("#lists", view).value.split(/\s+/).filter(Boolean),
    };
    try { const j = await api("find", body); toast(j.label); watchJob($("#job", view), () => render(view)); } catch (e) { toast(e.message); }
  };
  watchJob($("#job", view), () => render(view));
}
