import { api, esc, $, $$, toast, copy, link, when } from "../ui.js";

export async function render(view, selected) {
  const [catalog, settings] = await Promise.all([api("sales"), api("sales/settings")]);
  let current = selected ? await api(`sales/${encodeURIComponent(selected)}`) : null;
  let researchDirty = false, draftDirty = false, busy = false;
  const options = (map, value) => Object.entries(map).map(([k, v]) => `<option value="${esc(k)}" ${k === value ? "selected" : ""}>${esc(v)}</option>`).join("");
  const endpoint = suffix => `sales/${encodeURIComponent(current.business.id)}/${suffix}`;
  const status = text => { $("[data-save-state]", view).textContent = text; };
  const dirty = () => researchDirty || draftDirty;

  view.innerHTML = `<div class="sales-title"><div><span class="eyebrow">KRIV / SALES WORKSPACE</span><h1>A reason to start a conversation.</h1><p class="muted">Bring the research, the right offer and the first draft together. Each business stays connected to its existing KRIV work.</p></div><a class="btn" href="#inbox">Preview workspace</a></div>
    <div class="sales-layout"><aside class="sales-list"><label for="sales-search">Businesses</label><input id="sales-search" placeholder="Search this list" type="search"><small class="muted">Up to 200 recent businesses</small><nav aria-label="Sales businesses">${catalog.businesses.map(b => `<a class="sales-business" href="#sales/${encodeURIComponent(b.id)}" aria-current="${b.id === selected}"><strong>${esc(b.name)}</strong><small>${esc(catalog.offers[b.offer] ?? "Research needed")}${b.hasDraft ? " · Draft saved" : ""}</small></a>`).join("") || '<p class="muted">Add your first business below.</p>'}</nav>
    <details><summary>Add businesses</summary><form id="sales-add"><label>Business name<input name="name" required maxlength="200"></label><label>Website<input name="website" type="url" required placeholder="https://business.example"></label><label>Source URL<input name="sourceUrl" type="url" required placeholder="Where you found it"></label><button class="btn" type="submit">Add business</button></form><hr><label>Import a Harvey CSV<input id="sales-import" type="file" accept=".csv,text/csv"></label><p class="small muted">Up to 100 rows with website URLs. Contact claims remain unverified.</p></details></aside>
    <section class="sales-detail"><div id="sales-error" class="sales-error" role="alert" hidden></div><div class="sales-save-state" data-save-state role="status">Saved</div><div id="sales-record"></div>
    <details class="sales-card"><summary>Drafting settings</summary><p>Assisted drafting uses your Claude subscription and Harvey’s sales guidance. Each click prepares one draft; the daily limit is 20 attempts.</p><label class="sales-check"><input id="sales-enable" type="checkbox" ${settings.enabled ? "checked" : ""}>Enable Claude drafting</label><button class="btn" id="sales-probe">Check Claude installation</button><p id="sales-provider" role="status" class="small muted">No model call runs until you request an assisted draft.</p></details></section></div>`;

  function showError(error) { const el = $("#sales-error", view); el.hidden = false; el.textContent = error.message; status("Not saved — your edits are still here"); }
  async function action(fn) {
    if (busy) return;
    busy = true; $("#sales-error", view).hidden = true;
    view.setAttribute("aria-busy", "true");
    $("#sales-record", view).inert = true;
    try { await fn(); } catch (e) { if (e.name !== "AbortError") showError(e); }
    finally { busy = false; view.removeAttribute("aria-busy"); $("#sales-record", view).inert = false; }
  }

  function evidenceMarkup(e) {
    return `<article class="sales-evidence" data-evidence="${esc(e.id)}"><div class="sales-pair"><label>Observation type<select data-field="type">${options(catalog.evidenceTypes, e.type)}</select></label><label>Observed on<input type="date" data-field="date" value="${esc(e.observedAt.slice(0, 10))}" required></label></div><label for="claim-${esc(e.id)}">What the source shows</label><textarea id="claim-${esc(e.id)}" data-field="claim" maxlength="1200" required>${esc(e.claim)}</textarea><label>Source URL<input type="url" data-field="url" value="${esc(e.url)}" required></label><div class="sales-actions">${e.url ? link(e.url, "Open source") : ""}<button class="btn" type="button" data-remove="${esc(e.id)}">Remove observation</button></div><label class="sales-check"><input type="checkbox" data-field="confirmed" ${e.confirmed ? "checked" : ""}>I checked this observation against its source</label></article>`;
  }

  function paint() {
    const box = $("#sales-record", view);
    if (!current) { box.innerHTML = '<div class="sales-card sales-empty"><h2>Start with a business.</h2><p class="muted">Select an existing business, add one, or import a Harvey prospect export. Review the evidence before choosing an offer.</p></div>'; return; }
    const { business: b, recommendation, draft } = current;
    box.innerHTML = `<div class="sales-detail"><section class="sales-card"><span class="eyebrow">BUSINESS / ${esc(b.status)}</span><h2>${esc(b.name)}</h2>${link(b.website)}${current.hold ? `<p class="sales-error">${esc(current.hold)}</p>` : ""}<p class="sales-callout"><strong>Suggested: ${esc(catalog.offers[recommendation.offer])}</strong><br>${esc(recommendation.why)}</p>
      <form id="sales-research"><label>Offer to explore<select id="sales-offer">${options(catalog.offers, current.offer)}</select></label><h3>Evidence behind the offer</h3><p class="small muted">Keep each observation specific. Reviewed evidence is usable for 30 days. Checking a source does not qualify a website or approve publication.</p><div id="sales-evidence">${current.evidence.map(evidenceMarkup).join("")}</div><div class="sales-actions"><button class="btn" id="sales-observation" type="button">Add observation</button><button class="btn" id="sales-sources" type="button">Use saved source text</button><button class="btn primary" type="submit">Save research</button><button class="btn" id="sales-discard" type="button">Reload saved version</button></div></form>
      ${current.contacts.length ? `<details><summary>Imported contact claims (${current.contacts.length})</summary><p class="small muted">These addresses are not approved recipients. Use the existing mailbox checks before outreach.</p>${current.contacts.map(c => `<p>${esc(c.email)} <span class="muted">— export says ${esc(c.claimedStatus)}</span></p>`).join("")}</details>` : ""}</section>
      <section class="sales-card"><span class="eyebrow">FIRST CONVERSATION</span><h2>Prepare the opening.</h2><p class="small muted">Keep it useful and specific. Drafts here stay separate from your existing outgoing email.</p>${current.staleDraft ? '<p class="sales-error">The research changed or its evidence is older than 30 days. Review the evidence and prepare a new draft.</p>' : ""}<div class="sales-actions"><button class="btn" id="sales-starter" ${current.hold ? "disabled" : ""}>Start with a template</button><button class="btn primary" id="sales-generate" ${current.hold ? "disabled" : ""}>Draft with Claude</button></div>
      ${draft ? `<form id="sales-draft"><p class="small muted">${draft.provider === "claude-harvey" ? "Prepared with Claude and Harvey guidance" : draft.provider === "template" ? "Neutral template — personalise it before use" : "Edited by you"} · ${esc(when(draft.createdAt))}</p><label for="sales-subject">Subject</label><input id="sales-subject" value="${esc(draft.subject)}" maxlength="160" required><label for="sales-body">Email draft</label><textarea class="sales-draft-body" id="sales-body" maxlength="4000" required>${esc(draft.body)}</textarea><div class="sales-actions"><button class="btn primary" type="submit">Save draft</button><button class="btn" type="button" id="sales-copy" ${current.staleDraft || current.hold ? "disabled" : ""}>Copy saved draft</button></div></form>` : '<p class="muted">Review and save at least one observation to prepare a draft.</p>'}</section>
      <section class="sales-card"><h2>Continue in KRIV</h2><p class="muted">Offer selection guides the conversation. Your existing review and publication checks still decide what is ready.</p><div class="sales-actions">${b.slug ? `<a class="btn" href="#focus/${encodeURIComponent(b.id)}/design">Review existing preview</a>` : b.bucket === "qualified" ? `<a class="btn" href="#build/${encodeURIComponent(b.id)}">Build website concept</a>` : '<a class="btn" href="#check">Check website eligibility</a>'}<a class="btn" href="#email/${encodeURIComponent(b.id)}">Existing email workspace</a></div>${current.offer === "build" ? '<p class="small">Use the fictional KRIV Build demo during a discovery call. Its client-facing deployment is still separate.</p>' : ""}</section>
      <details class="sales-card"><summary>Sales activity</summary><ol class="sales-history">${current.history.map(h => `<li>${esc(when(h.at))} — ${esc(h.action.replace(/^sales-/, "").replaceAll("-", " "))}</li>`).join("") || "<li>No sales activity yet.</li>"}</ol></details></div>`;
    $("#sales-research", view).oninput = e => { researchDirty = true; if (e.target.dataset.field && e.target.dataset.field !== "confirmed") $("[data-field=confirmed]", e.target.closest("[data-evidence]")).checked = false; status("Research has unsaved changes"); };
    $("#sales-research", view).onsubmit = e => { e.preventDefault(); action(async () => { if (draftDirty) throw new Error("Save your draft before changing its research, or reload the saved version."); await saveResearch(); paint(); }); };
    $("#sales-observation", view).onclick = () => { if ($$("[data-evidence]", view).length >= 30) return toast("Keep at most 30 observations."); $("#sales-evidence", view).insertAdjacentHTML("beforeend", evidenceMarkup({ id: crypto.randomUUID(), type: "observation", claim: "", url: b.website ?? "", observedAt: new Date().toISOString(), confirmed: false })); researchDirty = true; status("Research has unsaved changes"); $$("[data-evidence] textarea", view).at(-1)?.focus(); };
    $("#sales-evidence", view).onclick = e => { const button = e.target.closest("[data-remove]"); if (button) { button.closest("[data-evidence]").remove(); researchDirty = true; status("Research has unsaved changes"); } };
    $("#sales-sources", view).onclick = () => action(async () => { await saveAll(); current = await api(endpoint("saved-research"), { expectedRevision: current.revision }); paint(); status("Saved source text added for review"); });
    $("#sales-discard", view).onclick = () => action(async () => { current = await api(`sales/${encodeURIComponent(b.id)}`); researchDirty = draftDirty = false; paint(); status("Saved version loaded"); });
    $("#sales-starter", view).onclick = () => action(async () => { await saveAll(); current = await api(endpoint("starter"), { expectedRevision: current.revision }); paint(); status("Template saved"); });
    $("#sales-generate", view).onclick = () => action(async () => { await saveAll(); status("Claude is preparing one draft…"); current = await api(endpoint("generate"), { expectedRevision: current.revision }); paint(); status("Assisted draft saved for review"); });
    if (draft) {
      $("#sales-draft", view).oninput = () => { draftDirty = true; status("Draft has unsaved changes"); };
      $("#sales-draft", view).onsubmit = e => { e.preventDefault(); action(async () => { await saveAll(); paint(); }); };
      $("#sales-copy", view).onclick = e => action(async () => { if (dirty()) throw new Error("Save your changes before copying the draft."); const latest = await api(`sales/${encodeURIComponent(b.id)}`); if (latest.revision !== current.revision || latest.staleDraft || latest.hold) throw new Error("The saved record changed or is held. Reload it before copying."); await copy(`Subject: ${latest.draft.subject}\n\n${latest.draft.body}`, e.target); });
    }
  }

  function researchInput() {
    return { expectedRevision: current.revision, offer: $("#sales-offer", view).value, evidence: $$("[data-evidence]", view).map(el => ({ id: el.dataset.evidence,
      type: $("[data-field=type]", el).value, claim: $("[data-field=claim]", el).value, url: $("[data-field=url]", el).value,
      observedAt: `${$("[data-field=date]", el).value}T00:00:00.000Z`, confirmed: $("[data-field=confirmed]", el).checked })) };
  }
  async function saveResearch() { current = await api(endpoint("research"), researchInput()); researchDirty = false; status("Research saved"); }
  async function saveAll() {
    // Save the edit against the evidence it was written from, then invalidate it
    // if the newly saved research differs. Neither editor's text is discarded.
    if (draftDirty) { current = await api(endpoint("draft"), { expectedRevision: current.revision, subject: $("#sales-subject", view).value, body: $("#sales-body", view).value, evidenceIds: current.draft.evidenceIds }); draftDirty = false; status("Draft saved"); }
    if (researchDirty) await saveResearch();
  }
  $("#sales-search", view).oninput = e => { const q = e.target.value.toLowerCase(); $$(".sales-business", view).forEach(el => { el.hidden = !el.textContent.toLowerCase().includes(q); }); };
  $("#sales-add", view).onsubmit = e => { e.preventDefault(); action(async () => { if (dirty()) throw new Error("Save your current changes first."); const data = Object.fromEntries(new FormData(e.target)); const result = await api("sales/import", { businesses: [data] }); if (!result.ids.length) throw new Error(result.skipped[0]?.reason ?? "Business could not be added."); location.hash = `sales/${encodeURIComponent(result.ids[0])}`; }); };
  $("#sales-import", view).onchange = e => action(async () => { if (dirty()) throw new Error("Save your current changes first."); const file = e.target.files?.[0]; if (!file) return; if (file.size > 500000) throw new Error("Choose a CSV under 500 KB."); const result = await api("sales/import", { csv: await file.text() }); toast(`${result.added} added; ${result.skipped.length} held`); if (result.ids.length) location.hash = `sales/${encodeURIComponent(result.ids[0])}`; else throw new Error(result.skipped[0]?.reason ?? "No businesses imported."); });
  $("#sales-enable", view).onchange = e => action(async () => { const checkbox = e.target; try { const result = await api("sales/settings", { enabled: checkbox.checked }); checkbox.checked = result.enabled; toast(result.enabled ? "Claude drafting enabled" : "Claude drafting disabled"); } catch (err) { checkbox.checked = !checkbox.checked; throw err; } });
  $("#sales-probe", view).onclick = () => action(async () => { $("#sales-provider", view).textContent = "Checking the installation…"; const result = await api("sales/check-provider", {}); $("#sales-provider", view).textContent = result.reason; });
  paint();
  const unload = e => { if (dirty() || busy) { e.preventDefault(); e.returnValue = ""; } };
  addEventListener("beforeunload", unload);
  return { beforeLeave() { if (busy) throw new Error("Wait for the current action to finish."); if (dirty()) throw new Error("Save your changes or reload the saved version before leaving."); }, dispose() { removeEventListener("beforeunload", unload); } };
}
