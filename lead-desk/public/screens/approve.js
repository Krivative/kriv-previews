// Approve: only Kriv marks a page approved. Publish: a second, explicit confirm click commits the
// one lead file to main and pushes, so kriv.agency/<slug> goes live.
import { api, esc, $, toast, pill, link, fileUrl, openLead, watchJob, NICHES } from "../ui.js";

export async function render(view) {
  const d = await api("approve");
  const shots = (c) => (c.screenshots.length ? `<div class="shots">${c.screenshots.map((s) => `<a href="${fileUrl(s.file)}" target="_blank"><img loading="lazy" src="${fileUrl(s.file)}" alt="${esc(s.label)}" style="max-height:420px;object-fit:cover;object-position:top"></a>`).join("")}</div>` : '<p class="small muted">No screenshots yet: run "Screenshots and QA" on the Build screen.</p>');
  const head = (c) => `<div class="row" style="justify-content:space-between"><div><span class="eyebrow">${esc(NICHES[c.niche] ?? c.niche ?? "")} · ${esc([c.town, c.state].filter(Boolean).join(", "))} · ${esc(c.template ?? "")}</span>
    <h2 style="margin:0"><a href="#" data-open="${esc(c.id)}">${esc(c.name)}</a></h2><span class="small mono">kriv.agency/${esc(c.slug)}</span></div>${pill(c.status)}</div>`;
  view.innerHTML = `
    <h1>Approve and publish</h1>
    <p class="small muted">Approving needs every QA item ticked and an email draft. Publishing then commits only <span class="mono">leads/&lt;slug&gt;.json</span> to main from a clean copy (${esc(d.worktree)}), runs lint, typecheck, tests, build and smoke checks, pushes, and waits until kriv.agency shows the page. Nothing happens without your click.</p>
    <div id="job"></div>
    <section style="display:grid;gap:12px"><h2>Waiting for your approval (${d.drafts.length})</h2>
      ${d.drafts.map((c) => `<article class="panel" style="display:grid;gap:8px">${head(c)}${shots(c)}
        <div class="small">QA ${c.qaDone}/${c.qaTotal} · email ${c.email ? `${esc(c.email.status)}: "${esc(c.email.subject)}"` : "not written"}</div>
        <details><summary class="small">Facts and sources (${c.facts.length})</summary><table><tbody>${c.facts.map((f) => `<tr><td>${esc(f.label)}</td><td>${esc(f.value)}</td><td>${link(f.source)}</td></tr>`).join("")}</tbody></table></details>
        ${c.blockers.length ? `<ul class="small" style="color:var(--warn)">${c.blockers.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
        <div class="row"><button class="btn ok" data-approve="${esc(c.id)}" ${c.blockers.length ? "disabled" : ""}>Approve this page</button>
          <button class="btn bad" data-decline="${esc(c.id)}">Decline</button><a class="btn" href="#build/${esc(c.id)}">Edit</a><a class="btn" href="#email/${esc(c.id)}">Email draft</a></div></article>`).join("") || '<p class="muted">Nothing waiting.</p>'}
    </section>
    <section style="display:grid;gap:12px"><h2>Approved, not live yet (${d.approved.length})</h2>
      ${d.approved.map((c) => `<article class="panel" style="display:grid;gap:8px" data-card="${esc(c.id)}">${head(c)}
        <div class="row"><button class="btn primary" data-plan="${esc(c.id)}">Publish…</button></div><div data-confirm></div></article>`).join("") || '<p class="muted">Nothing to publish.</p>'}
    </section>
    ${d.takedowns.length ? `<section style="display:grid;gap:12px"><h2>Opted out: take the page down (${d.takedowns.length})</h2>
      ${d.takedowns.map((c) => `<article class="panel" style="display:grid;gap:8px" data-card="${esc(c.id)}">${head(c)}<div class="row"><button class="btn bad" data-plan="${esc(c.id)}">Take down…</button></div><div data-confirm></div></article>`).join("")}</section>` : ""}`;

  view.onclick = async (e) => {
    const o = e.target.closest("[data-open]");
    if (o) { e.preventDefault(); return openLead(o.dataset.open); }
    const a = e.target.closest("[data-approve]");
    if (a) { try { await api(`leads/${encodeURIComponent(a.dataset.approve)}/approve`, {}); toast("Approved. Publish it when you're ready."); render(view); } catch (err) { toast(err.message); } return; }
    const dcl = e.target.closest("[data-decline]");
    if (dcl) { await api(`leads/${encodeURIComponent(dcl.dataset.decline)}/status`, { status: "declined" }); toast("Declined"); return render(view); }
    const p = e.target.closest("[data-plan]");
    if (p) {
      const box = $("[data-confirm]", p.closest("[data-card]"));
      box.innerHTML = '<p class="small muted">Comparing with main…</p>';
      try {
        const plan = await api(`leads/${encodeURIComponent(p.dataset.plan)}/publish/plan`, {});
        box.innerHTML = `<div class="confirm">
          <b>${plan.status === "expired" ? "Take down" : "Publish"} ${esc(plan.url)}?</b>
          <div class="small">This commits <span class="mono">leads/${esc(plan.slug)}.json</span> (${plan.before ? "changed" : "new file"}) to <b>main</b> and pushes, which redeploys production.</div>
          <details><summary class="small">Commit message</summary><pre>${esc(plan.message)}</pre></details>
          <details><summary class="small">The file as it will be on main${plan.before ? " (and before)" : ""}</summary><pre style="max-height:300px;overflow:auto">${esc(plan.after)}</pre>${plan.before ? `<pre style="max-height:200px;overflow:auto;opacity:.7">${esc(plan.before)}</pre>` : ""}</details>
          <div class="small">Checks first: ${plan.checks.map(esc).join(", ")}. If one fails, nothing is pushed.</div>
          <div class="row"><button class="btn ${plan.status === "expired" ? "bad" : "primary"}" data-go="${esc(p.dataset.plan)}" data-slug="${esc(plan.slug)}">Confirm: ${plan.status === "expired" ? "take it down" : "publish it"}</button>
            <button class="btn" data-go="${esc(p.dataset.plan)}" data-slug="${esc(plan.slug)}" data-dry="1">Dry run (checks only, no commit)</button>
            <button class="btn" data-cancel-plan>Cancel</button></div></div>`;
      } catch (err) { box.innerHTML = ""; toast(err.message); }
      return;
    }
    if (e.target.closest("[data-cancel-plan]")) { e.target.closest("[data-confirm]").innerHTML = ""; return; }
    const go = e.target.closest("[data-go]");
    if (go) {
      try {
        await api(`leads/${encodeURIComponent(go.dataset.go)}/publish`, { confirm: go.dataset.slug, dryRun: !!go.dataset.dry });
        go.closest("[data-confirm]").innerHTML = "";
        watchJob($("#job", view), () => render(view));
        $("#job", view).scrollIntoView({ block: "start" });
      } catch (err) { toast(err.message); }
    }
  };
  watchJob($("#job", view), () => render(view));
}
