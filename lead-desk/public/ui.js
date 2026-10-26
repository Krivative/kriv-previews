// Shared helpers for every screen: API calls, escaping, toast, the lead detail dialog.
const TOKEN = document.querySelector('meta[name="desk-token"]').content;

export async function api(path, body, method = body === undefined ? "GET" : "POST") {
  const res = await fetch(`/api/${path}`, {
    method,
    headers: method === "GET" ? {} : { "Content-Type": "application/json", "X-Desk-Token": TOKEN },
    body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const link = (u, t) => (u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t ?? String(u).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").slice(0, 60))}</a>` : "");
export const fileUrl = (p) => `/file?path=${encodeURIComponent(p)}`;
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const NICHES = { dental: "Dental", hvac: "HVAC", chiro: "Chiropractic", medspa: "Med spa", plumbing: "Plumbing", auto: "Auto repair" };
export const BUCKETS = { qualified: "qualified", toReview: "to visual review", near: "near miss", notChecked: "not checked", none: "not a lead", manual: "added by hand" };
export const pill = (s, cls = `st-${s}`) => (s ? `<span class="pill ${esc(cls)}">${esc(s)}</span>` : "");
export const bucketPill = (b) => (b ? `<span class="pill b-${esc(b)}">${esc(BUCKETS[b] ?? b)}</span>` : "");
export const when = (iso) => (iso ? new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "");

let toastTimer;
export function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 3500);
}

/** Copies text; falls back to selecting it so Kriv can press Ctrl+C. */
export async function copy(text, btn) {
  const label = btn?.textContent;
  try { await navigator.clipboard.writeText(text); if (btn) btn.textContent = "Copied"; }
  catch { toast("Copy blocked by the browser: select the text and press Ctrl+C"); }
  if (btn) setTimeout(() => (btn.textContent = label), 1500);
}

// Screens re-render after a change in the dialog.
let onChange = () => {};
export const setOnChange = (fn) => (onChange = fn);

export async function openLead(id) {
  const dlg = $("#leadDialog");
  const l = await api(`leads/${encodeURIComponent(id)}`);
  const fact = (label, value) => (value ? `<div><span class="muted">${label}:</span> ${value}</div>` : "");
  const d = l.draft;
  $("#leadBody").innerHTML = `
    <div class="dlg-head">
      <div><span class="eyebrow">${esc(NICHES[l.niche] ?? l.niche ?? "")}${d?.template ? ` · ${esc(d.template)}` : ""} · id ${esc(l.id)}</span>
        <h2 id="leadDialogTitle" style="margin:0">${esc(l.name || l.website || l.id)}</h2>
        <div class="row">${pill(l.status)} ${bucketPill(l.bucket)} ${l.optedOut ? pill("opted out", "optout") : ""}</div></div>
      <button class="btn" data-close>Close</button>
    </div>
    <div class="dlg-body">
      <div class="row">
        ${l.status === "draft" ? `<button class="btn ok" data-status="approved">Approve this page</button>` : ""}
        ${l.status !== "declined" ? `<button class="btn bad" data-status="declined">Decline</button>` : `<button class="btn" data-status="found">Undo decline</button>`}
        ${l.status === "approved" ? `<a class="btn" href="#approve">Publish…</a>` : ""}
        ${["found", "draft"].includes(l.status) && l.bucket === "qualified" ? `<a class="btn" href="#build/${esc(l.id)}">Build preview</a>` : ""}
        ${l.email ? `<a class="btn" href="#email/${esc(l.id)}">Email</a>` : ""}
        <a class="btn" href="#linkedin/${esc(l.id)}">LinkedIn</a>
      </div>
      <div class="meta">
        ${fact("Where", esc([l.town, l.state].filter(Boolean).join(", ")) + (l.address ? `<br>${esc(l.address)}` : ""))}
        ${fact("Phone", esc(l.phone))}
        ${fact("Website", (l.website ? link(l.website) : "none") + (l.website_status ? `<br><span class="flag">${esc(l.website_status)}</span>` : ""))}
        ${fact("Email", l.email ? `<span class="mono">${esc(l.email)}</span>${l.email_found_at ? `<br><span class="small muted">found on ${link(l.email_found_at)}</span>` : ""}` : "none found")}
        ${l.slug ? fact("Page", link(`https://kriv.agency/${l.slug}`) + (l.status === "live" || l.status === "sent" ? "" : ' <span class="small muted">(not live)</span>')) : ""}
        ${fact("Found via", esc(l.via))}
      </div>
      ${l.looks_dated?.length ? `<div class="small"><b>Looks dated or amateur:</b> ${l.looks_dated.map(esc).join("; ")}</div>` : ""}
      ${l.why ? `<div class="small"><b>Why:</b> ${esc(l.why)}</div>` : ""}
      <label>Note <textarea id="leadNote" placeholder="Anything to remember about this lead">${esc(l.note ?? "")}</textarea></label>
      <div><button class="btn" data-save-note>Save note</button></div>
      ${l.check?.shot ? `<details open><summary>Phone screenshot of their site</summary><div class="shot"><img loading="lazy" src="${fileUrl(l.check.shot)}" alt="Their homepage on a phone"></div></details>` : ""}
      ${d ? `
        <details><summary>Preview screenshots</summary><div class="shots">${d.screenshots.map((s) => `<a href="${fileUrl(s.file)}" target="_blank"><img loading="lazy" src="${fileUrl(s.file)}" alt="${esc(s.label)}"></a>`).join("")}</div></details>
        <details><summary>Facts and sources (${d.facts.length})</summary><table><thead><tr><th>Fact</th><th>Value</th><th>Source</th></tr></thead><tbody>${d.facts.map((f) => `<tr><td>${esc(f.label)}</td><td>${esc(f.value)}</td><td>${link(f.source)}</td></tr>`).join("")}</tbody></table></details>
        <details><summary>QA (${d.qa.filter((q) => q.pass).length}/${d.qa.length})</summary><ul class="qa">${d.qa.map((q) => `<li class="${q.pass ? "ok" : "bad"}">${q.pass ? "✓" : "✗"} ${esc(q.item)}</li>`).join("")}</ul></details>` : ""}
      ${l.outreach ? `<details><summary>Email ${pill(l.outreach.status)}</summary><div class="small"><b>To:</b> ${esc(l.outreach.to_addr)} · <b>Subject:</b> ${esc(l.outreach.subject)}</div><pre>${esc(l.outreach.body)}</pre></details>` : ""}
      ${l.linkedin ? `<details><summary>LinkedIn ${pill(l.linkedin.status)}</summary><div class="small">${link(l.linkedin.url, l.linkedin.who)} · ${esc(l.linkedin.confidence)}</div><pre>${esc(l.linkedin.note)}</pre></details>` : ""}
      <details><summary>Sources (${l.sources.length})</summary><table><tbody>${l.sources.map((s) => `<tr><td>${esc(s.field)}</td><td>${link(s.url, s.url)}</td></tr>`).join("")}</tbody></table></details>
      <details><summary>History (${l.history.length})</summary><ul class="small">${l.history.map((h) => `<li>${esc(when(h.at))}: <b>${esc(h.action)}</b> ${esc(typeof h.detail === "string" ? h.detail : JSON.stringify(h.detail ?? ""))}</li>`).join("")}</ul></details>
    </div>`;
  dlg.onclick = async (e) => {
    if (e.target === dlg || e.target.closest("[data-close]") || e.target.closest("a[href^='#']")) return dlg.close();
    const s = e.target.closest("[data-status]");
    if (s) {
      try { await api(`leads/${encodeURIComponent(l.id)}/status`, { status: s.dataset.status }); toast(`${l.name}: ${s.dataset.status}`); onChange(); openLead(l.id); }
      catch (err) { toast(err.message); }
    }
    if (e.target.closest("[data-save-note]")) {
      await api(`leads/${encodeURIComponent(l.id)}/note`, { note: $("#leadNote").value });
      toast("Note saved");
      onChange();
    }
  };
  if (!dlg.open) dlg.showModal();
}

/** Shows the running job (progress, log, Cancel) in `el`; calls onDone(job) once when it ends. */
export function watchJob(el, onDone) {
  let ended = false;
  const tick = async () => {
    if (!el.isConnected) return;
    const j = await api("job").catch(() => ({}));
    if (!j.id) { el.innerHTML = ""; return; }
    const running = j.status === "running";
    const pct = j.total ? Math.round((100 * j.done) / j.total) : null;
    el.innerHTML = `<div class="panel ${running ? "banner" : "banner ok"}" style="display:grid;gap:6px">
      <div class="row" style="justify-content:space-between"><b>${esc(j.label)}</b><span>${pill(j.status, running ? "st-draft" : j.status === "done" ? "st-sent" : "st-declined")}
        ${running ? '<button class="btn bad" data-cancel>Cancel</button>' : ""}</span></div>
      ${pct != null ? `<progress max="100" value="${pct}" style="width:100%"></progress><span class="small muted">${j.done} of ${j.total}</span>` : ""}
      <details ${running ? "open" : ""}><summary class="small">Log</summary><pre style="max-height:220px;overflow:auto">${esc(j.log.join("\n"))}</pre></details>
      ${j.error ? `<div class="small" style="color:var(--bad)">${esc(j.error)}</div>` : ""}</div>`;
    const c = el.querySelector("[data-cancel]");
    if (c) c.onclick = async () => { c.disabled = true; await api("job/cancel", {}); };
    // onDone only for a job seen running here, so a finished job doesn't re-trigger on every visit.
    if (running) { sawRunning = true; setTimeout(tick, 1500); }
    else if (sawRunning && !ended) { ended = true; onDone?.(j); }
  };
  let sawRunning = false;
  tick();
}

/** The optional AI help: { available, enabled, model, price, spent }. Buttons show only when enabled. */
export const aiState = () => api("ai").catch(() => ({ available: false, enabled: false }));
