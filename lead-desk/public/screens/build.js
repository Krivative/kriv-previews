// Build preview: a form prefilled from their website and listing; every fact needs the URL it
// came from. Saves leads/<slug>.json as "draft", then screenshots and the docs/LEAD-QA.md checklist.
import { api, esc, $, $$, toast, pill, link, fileUrl, watchJob, NICHES, aiState } from "../ui.js";

let state = null; // { id, view, form, pages }

export async function render(view, id) {
  if (!id) return pickLead(view);
  const v = await api(`build/${encodeURIComponent(id)}`);
  state = { id, v, form: v.form, pages: [] };
  if (!state.form && v.editable) {
    view.innerHTML = `<h1>Build preview</h1><p class="panel banner">Reading ${esc(v.lead.name)}'s website and listing for the facts (a few seconds per page)…</p>`;
    const p = await api(`build/${encodeURIComponent(id)}/prefill`, {});
    state.form = p.form;
    state.pages = p.pages;
    toast("Prefilled from their pages. Check every fact against its source before saving.");
  }
  draw(view);
}

async function pickLead(view) {
  const r = await api("review?tab=qualified");
  view.innerHTML = `<h1>Build preview</h1><p class="small muted">Qualified leads. Pick one to build or edit its preview.</p>
    <ul class="tasks">${r.rows.map((x) => `<li><a href="#build/${esc(x.id)}">${esc(x.name)}</a> <span class="small muted">${esc([x.town, x.state].filter(Boolean).join(", "))} · ${esc(NICHES[x.niche] ?? x.niche ?? "")}</span> ${pill(x.status)}</li>`).join("")}</ul>`;
}

function field(f, val = {}) {
  const v = val.v ?? "";
  const input = f.long ? `<textarea data-f="${f.key}" rows="4">${esc(v)}</textarea>` : `<input data-f="${f.key}" value="${esc(v)}">`;
  return `<div class="panel" style="padding:8px;display:grid;gap:4px">
    <label>${esc(f.label)}${f.required ? " *" : ""} ${f.max ? `<span class="counter small muted" data-count="${f.key}" data-max="${f.max}"></span>` : ""}${input}</label>
    ${f.src ? `<label class="small">Source URL <input data-s="${f.key}" list="srcs" value="${esc(val.s ?? "")}" placeholder="https://… (the page this fact is on)"></label>` : ""}</div>`;
}

function listRows(s, items = []) {
  return `<div data-listwrap="${s.list}" style="display:grid;gap:6px">${items.map((it, i) => `<div class="row" data-list="${s.list}" data-i="${i}">
      ${s.item.map((c) => `<input data-c="${c.key}" value="${esc(it[c.key] ?? "")}" placeholder="${esc(c.label)}" ${c.max ? `maxlength="${c.max}"` : ""} style="flex:${c.key === "blurb" || c.key === "time" ? 2 : 1};min-width:140px">`).join("")}
      <input data-c="s" list="srcs" value="${esc(it.s ?? "")}" placeholder="Source URL" style="flex:1.4;min-width:180px">
      <button class="btn" data-del aria-label="Remove">✕</button></div>`).join("")}
    ${items.length < s.max ? `<div><button class="btn" data-add="${s.list}">+ Add</button></div>` : ""}</div>`;
}

function draw(view) {
  const { v, form } = state;
  const l = v.lead;
  const srcs = [...new Set([...(state.pages ?? []).map((p) => p.url), ...v.pages.map((p) => p.url), ...Object.values(form?.f ?? {}).map((x) => x.s), l.website].filter(Boolean))];
  if (!v.editable) {
    view.innerHTML = `<h1>${esc(l.name)}</h1><p class="panel banner">This page is <b>${esc(v.pageStatus)}</b>. Only drafts are edited here; approved and live pages change through a new draft and your approval.</p>${shotsHtml(v)}${qaHtml(v)}`;
    return;
  }
  view.innerHTML = `
    <div class="row" style="justify-content:space-between"><div><span class="eyebrow">${esc(NICHES[l.niche] ?? l.niche ?? "")} · ${esc([l.town, l.state].filter(Boolean).join(", "))}</span><h1>${esc(l.name)}</h1></div>
      <span>${pill(l.status)}</span></div>
    <p class="small muted">Facts only from their own pages and listing. Every fact needs the URL of the page it's on; leave a field empty when no source says it (the section then stays hidden). No reviews, prices, awards, years in business or "best". Saving writes <span class="mono">leads/${esc(form.slug)}.json</span> as a <b>draft</b>: nothing goes live from here.</p>
    <datalist id="srcs">${srcs.map((u) => `<option value="${esc(u)}">`).join("")}</datalist>
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(260px,1fr);align-items:start">
      <div style="display:grid;gap:14px" id="form">
        <section class="panel" style="display:grid;gap:8px"><h2 style="margin:0">Address and template</h2>
          <label>Page address: kriv.agency/<input id="slug" value="${esc(form.slug)}" style="width:240px"></label>
          <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">${v.templates.map((t) => `<label class="panel" style="padding:8px;cursor:pointer;${t.recommended ? "" : "opacity:.75"}">
            <span class="row" style="display:flex"><input type="radio" name="tpl" value="${esc(t.id)}" ${form.template === t.id ? "checked" : ""}> <b>${esc(t.name)}</b></span>
            <span class="small muted">${esc(t.id)} · ${esc(t.look)}${t.recommended ? " · for this niche" : ""}</span>
            <span style="display:block;height:6px;border-radius:3px;background:${esc(t.accent ?? "#888")};margin-top:4px"></span></label>`).join("")}</div>
        </section>
        ${v.spec.map((s) => `<section class="panel" style="display:grid;gap:8px"><h2 style="margin:0">${esc(s.section)}</h2>
          ${(s.fields ?? []).map((f) => field(f, form.f[f.key])).join("")}
          ${s.list ? listRows(s, form.lists[s.list] ?? []) : ""}</section>`).join("")}
        <section class="panel" style="display:grid;gap:8px"><h2 style="margin:0">Photos</h2>
          <p class="small muted" style="margin:0">Their own photos first, when they clearly show this business (team, vans, premises, finished work); never their licensed stock or another business's images. Otherwise generic Unsplash scenes of the niche: no faces if possible, no signs, logos, branded vans or before/after.</p>
          <div id="chosen" class="grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))"></div>
          <div class="row"><input id="uq" placeholder="Search Unsplash, e.g. outdoor air conditioner unit" style="flex:1" value="${esc(NICHES[l.niche] ? { hvac: "air conditioner unit", dental: "dental clinic chair", chiro: "chiropractic treatment table", medspa: "skincare treatment room", plumbing: "plumbing pipes tools", auto: "auto repair garage tools" }[l.niche] ?? "" : "")}">
            <button class="btn" id="usearch" ${v.unsplash.hasKey ? "" : "disabled"}>Search Unsplash</button><span class="small muted" id="uleft">${v.unsplash.hasKey ? (v.unsplash.remaining != null ? `${v.unsplash.remaining} requests left this hour` : "") : "No Unsplash key in .env.local"}</span></div>
          <div id="uresults" class="grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))"></div>
          <div class="row"><button class="btn" id="ownphotos" ${l.website ? "" : "disabled"}>Find photos on their own site</button></div>
          <div id="own" class="grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))"></div>
        </section>
        <div id="problems"></div>
        <div class="row" style="position:sticky;bottom:0;background:var(--bg);padding:10px 0;border-top:1px solid var(--line)">
          <button class="btn primary" id="save">Save draft</button>
          <button class="btn" id="check" ${l.slug ? "" : "disabled"}>Screenshots and QA</button>
          <button class="btn" id="reread">Read their pages again</button>
          <button class="btn" id="aiFill" hidden title="Claude Haiku reads their pages and fills the form; every value keeps its source URL, and you check each one">AI: fill from their pages (about US$0.002)</button>
          <span class="small muted" id="savedNote"></span></div>
        <div id="job"></div>
        <div id="shots">${shotsHtml(v)}</div>
        <div id="qa">${qaHtml(v)}</div>
      </div>
      <aside class="panel" style="position:sticky;top:60px;max-height:calc(100vh - 80px);overflow:auto;display:grid;gap:8px;min-width:0">
        <h2 style="margin:0">Their pages</h2>
        <p class="small muted" style="margin:0">Read the facts here; copy the page's URL into the source box.</p>
        <select id="pageSel">${srcs.map((u) => `<option>${esc(u)}</option>`).join("")}</select>
        <div class="row"><button class="btn" id="copyUrl">Copy this URL</button>${l.website ? link(l.website, "open their site") : ""}</div>
        <pre id="pageText" style="max-height:60vh;overflow:auto;overflow-wrap:anywhere" class="small"></pre>
      </aside>
    </div>`;
  drawPhotos(view);
  counters(view);
  wire(view);
  showPage(view, $("#pageSel", view).value);
}

const shotsHtml = (v) => (v.screenshots.length ? `<section class="panel"><h2>Screenshots</h2><div class="shots">${v.screenshots.map((s) => `<a href="${fileUrl(s.file)}" target="_blank"><img src="${fileUrl(s.file)}?t=${Date.now()}" alt="${esc(s.label)}"></a>`).join("")}</div></section>` : "");
function qaHtml(v) {
  if (!v.lead.slug) return "";
  const sections = [...new Set(v.qa.map((q) => q.section))];
  const done = v.qa.filter((q) => q.pass).length;
  return `<section class="panel"><h2>QA checklist (docs/LEAD-QA.md) · ${done}/${v.qa.length}</h2>
    <p class="small muted">Ticked automatically: what a script can verify (after "Screenshots and QA"). The rest are yours, after looking at the screenshots and sources. Approval needs every item ticked.</p>
    ${sections.map((s) => `<h3 style="margin-top:10px">${esc(s)}</h3><ul class="qa">${v.qa.filter((q) => q.section === s).map((q) => `<li class="${q.pass ? "ok" : "bad"}" style="margin:4px 0">
      ${q.auto ? `${q.pass ? "✓" : "✗"} <span class="pill">auto</span>` : `<input type="checkbox" data-qa="${esc(q.item)}" ${q.pass ? "checked" : ""} aria-label="Done">`} ${esc(q.item)}${q.why ? ` <span class="muted">(${esc(q.why)})</span>` : ""}</li>`).join("")}</ul>`).join("")}</section>`;
}

function drawPhotos(view) {
  const photos = state.form.photos ?? [];
  $("#chosen", view).innerHTML = photos.length ? photos.map((p, i) => `<figure class="panel" style="margin:0;padding:6px"><img src="${esc(p.thumb ?? p.url)}" alt="" style="width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:4px">
    <figcaption class="small">${i + 1}. ${p.credit.provider === "Unsplash" ? `${esc(p.credit.photographer)} on Unsplash` : "their own photo"}<br>
    <button class="btn" data-up="${i}" ${i ? "" : "disabled"}>↑</button> <button class="btn" data-remove="${i}">Remove</button></figcaption></figure>`).join("") : '<p class="small muted">No photos chosen: the template shows neutral placeholders.</p>';
}

function counters(view) {
  $$("[data-count]", view).forEach((c) => {
    const el = $(`[data-f="${c.dataset.count}"]`, view);
    const upd = () => { c.textContent = `${el.value.length}/${c.dataset.max}`; c.classList.toggle("over", el.value.length > Number(c.dataset.max)); };
    el.addEventListener("input", upd); upd();
  });
}

/** Reads the form back from the page. */
function collect(view) {
  const form = { ...state.form, slug: $("#slug", view).value.trim(), template: $("[name=tpl]:checked", view)?.value ?? state.form.template, f: {}, lists: {} };
  $$("[data-f]", view).forEach((el) => { form.f[el.dataset.f] = { v: el.value, s: $(`[data-s="${el.dataset.f}"]`, view)?.value.trim() ?? "" }; });
  for (const s of state.v.spec.filter((x) => x.list)) {
    form.lists[s.list] = $$(`[data-list="${s.list}"]`, view).map((row) => Object.fromEntries([...s.item.map((c) => c.key), "s"].map((k) => [k, $(`[data-c="${k}"]`, row).value.trim()])));
  }
  return form;
}

async function showPage(view, url) {
  const pre = $("#pageText", view);
  const known = (state.pages ?? []).find((p) => p.url === url);
  if (known) { pre.textContent = known.status === 200 ? known.text : `Could not read this page (${known.status}): blocked or gone. Open it in your browser.`; return; }
  try { const p = await api(`page?url=${encodeURIComponent(url)}`); pre.textContent = p.status === 200 ? p.text : `Could not read this page (${p.status}).`; }
  catch { pre.textContent = "Not read yet. Click \"Read their pages again\"."; }
}

function wire(view) {
  const id = state.id;
  $("#pageSel", view).onchange = (e) => showPage(view, e.target.value);
  $("#copyUrl", view).onclick = (e) => navigator.clipboard.writeText($("#pageSel", view).value).then(() => { e.target.textContent = "Copied"; setTimeout(() => (e.target.textContent = "Copy this URL"), 1200); });
  view.onclick = async (e) => {
    const add = e.target.closest("[data-add]");
    if (add) { state.form = collect(view); (state.form.lists[add.dataset.add] ??= []).push({}); return draw(view); }
    if (e.target.closest("[data-del]")) { e.target.closest("[data-list]").remove(); state.form = collect(view); return draw(view); }
    const rm = e.target.closest("[data-remove]");
    if (rm) { state.form = collect(view); state.form.photos.splice(Number(rm.dataset.remove), 1); return draw(view); }
    const up = e.target.closest("[data-up]");
    if (up) { state.form = collect(view); const i = Number(up.dataset.up); const p = state.form.photos; [p[i - 1], p[i]] = [p[i], p[i - 1]]; return draw(view); }
    const use = e.target.closest("[data-use]");
    if (use) {
      use.disabled = true;
      try {
        const p = await api("unsplash/use", { id: use.dataset.use });
        state.form = collect(view);
        (state.form.photos ??= []).push(p);
        toast(`Added: ${p.credit.photographer} on Unsplash (download recorded with Unsplash)`);
        drawPhotos(view);
      } catch (err) { toast(err.message); use.disabled = false; }
      return;
    }
    const own = e.target.closest("[data-own]");
    if (own) {
      state.form = collect(view);
      if (own.dataset.kind === "logo") { $(`[data-f="logo"]`, view).value = own.dataset.own; $(`[data-s="logo"]`, view).value = own.dataset.page; toast("Logo set"); return; }
      (state.form.photos ??= []).push({ url: own.dataset.own, thumb: own.dataset.own, credit: { provider: "Business", source: own.dataset.page } });
      drawPhotos(view);
    }
  };
  view.onchange = async (e) => {
    const q = e.target.closest("[data-qa]");
    if (q) { await api(`build/${encodeURIComponent(id)}/qa`, { item: q.dataset.qa, pass: q.checked }); state.v = await api(`build/${encodeURIComponent(id)}`); $("#qa", view).innerHTML = qaHtml(state.v); }
  };
  $("#usearch", view).onclick = async () => {
    try {
      const r = await api(`unsplash?q=${encodeURIComponent($("#uq", view).value)}`);
      $("#uleft", view).textContent = `${r.remaining} requests left this hour`;
      $("#uresults", view).innerHTML = r.results.map((p) => `<figure class="panel" style="margin:0;padding:6px"><img src="${esc(p.thumb)}" alt="${esc(p.desc)}" style="width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:4px">
        <figcaption class="small">${esc(p.desc).slice(0, 90)} · ${esc(p.by)}${p.warn ? `<br><b style="color:var(--warn)">look closely: ${esc(p.warn)}</b>` : ""}<br><button class="btn" data-use="${esc(p.id)}">Use</button></figcaption></figure>`).join("") || '<p class="muted small">No results.</p>';
    } catch (err) { toast(err.message); }
  };
  $("#ownphotos", view).onclick = async () => {
    const f = collect(view);
    const pages = [state.v.lead.website, ...(state.pages ?? []).filter((p) => p.status === 200 && p.url.startsWith(new URL(state.v.lead.website).origin)).map((p) => p.url)].slice(0, 4);
    try {
      await api(`build/${encodeURIComponent(id)}/site-photos`, { slug: f.slug, pages });
      watchJob($("#job", view), async () => {
        const r = await api(`site-photos/${f.slug}`);
        $("#own", view).innerHTML = [r.logo ? { ...r.logo, kind: "logo" } : null, ...r.photos].filter(Boolean).map((p) => `<figure class="panel" style="margin:0;padding:6px"><img src="${esc(p.src)}" alt="" style="width:100%;aspect-ratio:3/2;object-fit:${p.kind === "logo" ? "contain" : "cover"};border-radius:4px">
          <figcaption class="small">${p.kind === "logo" ? "logo" : `${p.w}×${p.h}`} · ${link(p.page, "page")}<br><button class="btn" data-own="${esc(p.src)}" data-page="${esc(p.page)}" data-kind="${p.kind ?? "photo"}">${p.kind === "logo" ? "Use as logo" : "Use"}</button></figcaption></figure>`).join("") || '<p class="muted small">No large photos found.</p>';
      });
    } catch (err) { toast(err.message); }
  };
  aiState().then((ai) => { if (ai.enabled && $("#aiFill", view)) $("#aiFill", view).hidden = false; });
  $("#aiFill", view).onclick = async (e) => {
    e.target.disabled = true; e.target.textContent = "Reading with AI…";
    try {
      const r = await api(`build/${encodeURIComponent(id)}/ai-prefill`, {});
      state.form = collect(view);
      Object.assign(state.form.f, r.patch.f);
      for (const [k, v] of Object.entries(r.patch.lists)) if (v.length) state.form.lists[k] = v;
      draw(view);
      toast(`AI filled ${Object.keys(r.patch.f).length} fields for US$${r.cost.toFixed(4)}. Check every value against its source before saving.`);
    } catch (err) { toast(err.message); e.target.disabled = false; e.target.textContent = "AI: fill from their pages"; }
  };
  $("#reread", view).onclick = async (e) => {
    e.target.disabled = true; e.target.textContent = "Reading…";
    const p = await api(`build/${encodeURIComponent(id)}/prefill`, {});
    state.pages = p.pages;
    state.form = collect(view);
    toast(`Read ${p.pages.length} pages. Your form is unchanged; pick a page on the right to read it.`);
    draw(view);
  };
  $("#save", view).onclick = async () => {
    state.form = collect(view);
    const r = await api(`build/${encodeURIComponent(id)}/save`, { form: state.form });
    if (!r.saved) {
      $("#problems", view).innerHTML = `<div class="panel banner"><b>Not saved yet:</b><ul class="small">${r.problems.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>`;
      $("#problems", view).scrollIntoView({ block: "center" });
      return;
    }
    toast(`Saved leads/${r.slug}.json as a draft`);
    state.v = await api(`build/${encodeURIComponent(id)}`);
    state.form = state.v.form;
    draw(view);
    $("#savedNote", view).textContent = "Saved. Now take screenshots and run QA.";
  };
  $("#check", view).onclick = async () => {
    try { await api(`build/${encodeURIComponent(id)}/preview`, {}); watchJob($("#job", view), async () => { state.v = await api(`build/${encodeURIComponent(id)}`); $("#shots", view).innerHTML = shotsHtml(state.v); $("#qa", view).innerHTML = qaHtml(state.v); }); }
    catch (err) { toast(err.message); }
  };
  watchJob($("#job", view));
}
