// One business, one visual decision, one next action. All writes remain user initiated.
import { api, esc, $, $$, fileUrl, NICHES, when, toast, watchJob } from "../ui.js";

const encode = encodeURIComponent;
const steps = ["Preview ready", "Design accepted", "Checks complete", "Email reviewed", "Publication approved", "Live verified", "Outreach sent"];
const tabFor = (step) => ["email", "history", "details", "followup"].includes(step) ? step : "workflow";
const safeLink = (url, label) => /^https?:\/\//.test(url ?? "") ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label ?? url)} ↗</a>` : "";

export async function render(view, id, requestedStep) {
  if (!id) { location.hash = "#inbox"; return; }
  let data = await api(`workflow/${encode(id)}`);
  let tab = tabFor(requestedStep ?? data.state.action);
  let device = "desktop", mode = "", message = "", error = "", disposed = false, busy = false, timer;
  let feedback = data.draft.feedback, section = data.draft.section, note = data.lead.note ?? "";
  let draftSaved = JSON.stringify([feedback, section]), noteSaved = note;
  let mail = { to: data.state.email?.to_addr ?? data.lead.email ?? "", subject: data.state.email?.subject ?? "", body: data.state.email?.body ?? "" };
  let mailSaved = JSON.stringify(mail), saving = Promise.resolve(), saveError = "";
  let followup = { due: data.state.workflow?.followup_due ?? "", note: data.state.workflow?.followup_note ?? "" };
  let followupSaved = JSON.stringify(followup), manualOpen = false;
  let requestId = null, publicationPlan = null, savedVersion = null;
  const path = `workflow/${encode(id)}`;
  const dirty = () => draftSaved !== JSON.stringify([feedback, section]) || note !== noteSaved || mailSaved !== JSON.stringify(mail) || followupSaved !== JSON.stringify(followup);
  const saveLabel = (label) => { const el = $("#saveState", view); if (el) el.textContent = label; };
  const flush = () => {
    clearTimeout(timer);
    saving = saving.catch(() => {}).then(async () => {
      if (!dirty()) return;
      saveLabel("Saving…");
      try {
        const values = JSON.stringify([feedback, section]);
        if (draftSaved !== values) {
          const r = await api(`${path}/draft`, { feedback, section, expectedRevision: data.draft.revision });
          data.draft.revision = r.revision; draftSaved = values;
        }
        if (note !== noteSaved) { const next = note; const r = await api(`leads/${encode(id)}/note`, { note: next, expectedNote: noteSaved }); noteSaved = r.note ?? ""; if (note === next) note = noteSaved; }
        if (mailSaved !== JSON.stringify(mail)) { const next = { ...mail }; const r = await api(`email/${encode(id)}`, { ...next, expectedVersion: data.state.emailVersion }); data.state.emailVersion = r.version; mailSaved = JSON.stringify(next); }
        if (followupSaved !== JSON.stringify(followup)) { const next = { ...followup }; const r = await api(`${path}/followup`, { expectedRevision: data.state.revision, ...next }); data.state = r.state; followupSaved = JSON.stringify(next); }
        saveError = ""; saveLabel(dirty() ? "Changes pending…" : "All changes saved");
      } catch (e) { saveError = e.message; saveLabel("Couldn't save — retry"); const el = $("#saveError", view); if (el) el.textContent = e.message; throw e; }
    });
    return saving;
  };
  const changed = () => { saveLabel("Changes pending…"); clearTimeout(timer); timer = setTimeout(() => flush().catch(() => {}), 650); };
  const unload = (e) => { if (dirty()) { e.preventDefault(); e.returnValue = ""; } };
  addEventListener("beforeunload", unload);
  const resume = () => api(`${path}/resume`, { step: tab === "workflow" ? data.state.action : tab }).catch(() => {});
  const update = async (result) => {
    await flush();
    data = result?.state ? result : await api(path);
    feedback = data.draft.feedback; section = data.draft.section; note = data.lead.note ?? "";
    draftSaved = JSON.stringify([feedback, section]); noteSaved = note;
    mail = { to: data.state.email?.to_addr ?? data.lead.email ?? "", subject: data.state.email?.subject ?? "", body: data.state.email?.body ?? "" }; mailSaved = JSON.stringify(mail);
    followup = { due: data.state.workflow?.followup_due ?? "", note: data.state.workflow?.followup_note ?? "" }; followupSaved = JSON.stringify(followup);
    publicationPlan = null; requestId = null;
    if (!disposed) { paint(); resume(); }
  };
  const nextLink = () => data.nextLead ? `<a class="btn" href="#focus/${encode(data.nextLead)}/design">Review next lead →</a>` : '<a class="btn" href="#inbox">Return to inbox →</a>';
  const paint = () => {
    if ($(".manual-checks", view)) manualOpen = $(".manual-checks", view).open;
    const l = data.lead, s = data.state, w = s.workflow;
    const screenshots = savedVersion?.screenshots ?? s.screenshots;
    const shot = screenshots.find((p) => device === "mobile" ? /phone|mobile/i.test(p.label) : /desktop/i.test(p.label)) ?? screenshots[device === "mobile" ? 1 : 0];
    const decisionDisabled = !s.canDecide || !!savedVersion;
    view.innerHTML = `<div class="focus-workspace">
      <div class="focus-breadcrumb"><a href="#inbox">← Back to inbox</a><span id="saveState" role="status">${dirty() ? "Changes pending…" : "All changes saved"}</span><button class="text-button" data-act="refresh">Refresh lead</button></div>
      <header class="focus-heading"><div><span class="eyebrow">${esc([NICHES[l.niche] ?? l.niche, [l.town, l.state].filter(Boolean).join(", ")].filter(Boolean).join(" · "))}</span><h1>${esc(l.name)}</h1></div><span class="stage-label stage-${s.stage}">${esc(s.label)}</span></header>
      ${s.contactBlocked ? '<div class="essential-warning" role="alert"><b>Do not contact this business.</b> Publication and outreach are blocked. Review any required page removal in Publication tools.</div>' : l.status === "expired" ? '<div class="essential-warning"><b>This preview is expired.</b> It cannot enter publication or outreach.</div>' : ""}
      <div class="save-error" id="saveError" role="alert">${esc(saveError)}</div>
      ${message ? `<div class="decision-result" role="status"><b>${esc(message)}</b><span>Next: ${esc(s.next)}.</span><div class="row"><button class="btn primary" data-act="next">${esc(s.next)} →</button>${nextLink()}</div></div>` : ""}
      <div class="focus-grid"><section class="preview-panel" aria-label="Website preview"><div class="preview-toolbar"><div class="device-switch" role="group" aria-label="Preview device"><button data-device="desktop" aria-pressed="${device === "desktop"}">Desktop</button><button data-device="mobile" aria-pressed="${device === "mobile"}">Mobile</button></div><div class="row">${shot ? `<a href="${fileUrl(shot.file)}" target="_blank" rel="noopener noreferrer" class="text-button">Open full screenshot ↗</a>` : ""}${!savedVersion && s.record ? `<a href="http://localhost:3100/for/${encode(l.slug)}" target="_blank" rel="noopener noreferrer" class="text-button">Interactive preview ↗</a>` : ""}</div></div>
      ${savedVersion ? `<div class="archived-notice">Saved ${esc(savedVersion.decision)} version · ${esc(when(savedVersion.at))}<button class="text-button" data-act="current-version">Return to current preview</button></div>` : ""}
      <div class="preview-stage device-${device}">${shot ? `<div class="preview-canvas"><img src="${fileUrl(shot.file)}" alt="${device === "mobile" ? "Mobile" : "Desktop"} concept preview for ${esc(l.name)}"></div>` : '<div class="desk-empty"><span aria-hidden="true">▣</span><h3>Your preview will appear here</h3><p>Capture the desktop and mobile versions before a visual decision.</p></div>'}</div><p class="preview-caption">${savedVersion ? "Preserved review version. Decisions apply to the current preview only." : "Concept preview · business actions stay disabled. The interactive view needs the local preview app running."}</p></section>
      <aside class="decision-panel"><span class="eyebrow">Your design decision</span><h2>How does it feel?</h2><p>Review the desktop and mobile preview. Accept the design, ask for changes, or pass on this concept.</p><div class="decision-buttons ${s.canDecide && !s.designApproved && !mode && !savedVersion ? "mobile-decisions" : ""}"><button class="decision-approve" data-act="approve" ${decisionDisabled || s.designApproved ? "disabled" : ""}>${s.designApproved ? "✓ APPROVED" : "✓ APPROVE"}</button><button data-act="revise" ${decisionDisabled ? "disabled" : ""}>↺ REVISE</button><button data-act="decline" class="decision-decline" ${decisionDisabled ? "disabled" : ""}>× DECLINE</button></div><p class="decision-note">Design approval is separate from publication. Nothing is published or sent here.</p>
      ${!s.canDecide && s.screenshots.length !== 2 && !s.contactBlocked && !["live", "sent", "replied", "expired"].includes(l.status) && w?.decision !== "declined" && l.status !== "declined" ? '<p class="small muted">Both preview captures are needed before deciding.</p>' : ""}
      ${mode === "revise" ? `<form id="revisionForm" class="decision-form"><label>What would you like changed?<textarea id="feedback" rows="5" maxlength="6000" required placeholder="For example: improve the hero, simplify the mobile gallery…">${esc(feedback)}</textarea></label><label>Section (optional)<select id="revisionSection"><option value="">Whole website</option>${["Hero", "Services", "About", "Gallery", "Mobile", "Navigation", "Motion", "Other"].map((x) => `<option ${section === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><p class="small muted">This saves your feedback. Changes are handled separately.</p><button class="btn primary" type="submit">Save revision request</button><button class="btn" type="button" data-act="cancel-decision">Cancel</button></form>` : mode === "decline" ? `<form id="declineForm" class="decision-form"><label>Reason (optional)<select id="declineReason"><option value="">No reason selected</option>${data.declineReasons.map((r) => `<option>${esc(r)}</option>`).join("")}</select></label><label>What are you declining?<select id="declineScope"><option value="concept">This concept design</option><option value="business">This business as a prospect</option></select></label><p class="small muted">The preview and decision history are preserved.</p><button class="btn bad" type="submit">Confirm decline</button><button class="btn" type="button" data-act="cancel-decision">Cancel</button></form>` : ""}
      <div class="next-step-card"><span class="eyebrow">Your next step</span><h3>${esc(s.next)}</h3><p>${esc(s.stage === "revisions" ? "Your feedback is saved. You can keep reviewing while changes are handled." : s.designApproved ? "Your design decision is saved. Continue with the remaining requirements." : "Open the workflow below for details and any remaining requirements.")}</p><button class="btn" data-act="next">${s.action === "design" ? "Review this preview" : "Continue"} →</button></div>
      <div class="focus-progress"><div><b>${s.completedSteps} of ${s.totalSteps}</b><span>steps complete</span></div><div class="step-progress">${s.progress.map((done) => `<span class="${done ? "done" : ""}"></span>`).join("")}</div></div></aside></div>
      <section class="review-detail"><nav class="review-tabs" aria-label="Lead details">${[["workflow", "Workflow"], ["details", "Business details"], ["email", "Email"], ["followup", "Follow-up"], ["history", "History"]].map(([key, label]) => `<button data-tab="${key}" aria-pressed="${tab === key}">${label}</button>`).join("")}</nav><div id="detailContent">${detail()}</div></section>
    </div>`;
    bind();
  };
  const detail = () => {
    const l = data.lead, s = data.state, w = s.workflow;
    if (tab === "details") return `<div class="detail-grid"><section><span class="eyebrow">Business information</span><h2>Check the details that matter.</h2><dl class="business-facts"><dt>Business</dt><dd>${esc(l.name)}</dd><dt>Location</dt><dd>${esc([l.town, l.state].filter(Boolean).join(", ") || "Not verified")}</dd><dt>Website</dt><dd>${safeLink(l.website, l.website) || "None recorded"}</dd><dt>Business mailbox</dt><dd>${esc(l.email ?? "None recorded")}</dd></dl><label>Notes<textarea id="leadNotes" rows="4" maxlength="6000" placeholder="Anything to remember about this business">${esc(note)}</textarea></label><button class="btn" data-act="save">Save notes</button></section><section><span class="eyebrow">Evidence</span><h2>Facts and sources</h2>${data.facts.length ? `<ul class="fact-list">${data.facts.map((f) => `<li><b>${esc(f.label)}</b><span>${esc(f.value)}</span>${safeLink(f.source, "Source")}</li>`).join("")}</ul>` : ""}<ul class="source-list">${data.sources.map((p) => `<li>${safeLink(p.url, p.field)}</li>`).join("")}</ul><a href="#build/${encode(id)}" class="btn">Open detailed editor ↗</a></section></div>`;
    if (tab === "email") {
      const sent = s.email?.status === "sent";
      return `<div class="detail-grid"><section><span class="eyebrow">Personal outreach</span><h2>${sent ? "Your recorded email" : "Review the email in your own words."}</h2><p class="muted">Sending stays with you in Gmail. Opening a draft does not send it.</p><form id="emailForm"><label>To<input id="emailTo" type="email" value="${esc(mail.to)}" ${sent ? "disabled" : ""}></label><label>Subject<input id="emailSubject" value="${esc(mail.subject)}" ${sent ? "disabled" : ""}></label><label>Message<textarea id="emailBody" rows="10" ${sent ? "disabled" : ""}>${esc(mail.body)}</textarea></label>${sent ? "" : '<button class="btn" type="submit">Save email draft</button>'}</form><a href="#email/${encode(id)}" class="text-button">Email templates & advanced editor ↗</a><details><summary>Full saved email with standard footer</summary><pre>${esc(data.emailBody ?? "Save a draft to see the full email.")}</pre></details></section><section class="email-actions"><span class="eyebrow">Next action</span><h2>${sent ? "Keep the conversation moving." : s.emailReviewed ? "Email reviewed." : "Give this draft a final read."}</h2>${!sent ? `<button class="btn primary" data-act="email-reviewed" ${!s.emailReady || s.contactBlocked ? "disabled" : ""}>${s.emailReviewed ? "Confirm email review" : "I've reviewed this email"}</button>` : ""}${l.status === "live" && !sent ? '<button class="btn" data-act="gmail">Open Gmail compose ↗</button><button class="btn" data-act="sent">I sent this email</button><p class="small muted">Mark sent only after you click Send yourself in Gmail.</p>' : sent ? `<p class="small">Marked sent ${esc(when(s.email.sent_at))}. Duplicate sending is blocked.</p><button class="btn" data-act="replied">They replied</button><button class="btn" data-act="followup-tab">Set next follow-up →</button>` : '<p class="small muted">Gmail becomes available after publication is verified.</p>'}<div id="emailBlockers" role="status"></div></section></div>`;
    }
    if (tab === "history") return `<div class="detail-grid"><section><span class="eyebrow">Preserved versions</span><h2>Every decision stays attached.</h2><ul class="version-list">${data.versions.map((v) => `<li><div><b>${esc(v.decision === "approved" ? "Design approved" : v.decision === "revision" ? "Revision requested" : v.decision === "declined" ? "Declined" : "Reconsidered")}</b><small>${esc(when(v.at))}</small>${v.feedback ? `<p>${esc(v.feedback)}</p>` : ""}${v.reason ? `<p>${esc(v.reason)}</p>` : ""}</div><button class="btn" data-version="${v.id}">View version</button></li>`).join("") || '<li class="muted">New review decisions will appear here. Existing activity is preserved alongside them.</li>'}</ul>${w?.decision === "declined" || l.status === "declined" ? '<button class="btn" data-act="reopen">Reconsider this lead</button>' : ""}</section><section><span class="eyebrow">Activity</span><ol class="activity-list">${data.history.map((h) => `<li><span>${esc(when(h.at))}</span><b>${esc(h.action)}</b>${h.detail ? `<p>${esc(typeof h.detail === "string" ? h.detail : [h.detail.feedback, h.detail.reason, h.detail.note].filter(Boolean).join(" · "))}</p>` : ""}</li>`).join("") || '<li class="muted">No recorded activity yet.</li>'}</ol></section></div>`;
    if (tab === "followup") return `<section class="followup-editor"><span class="eyebrow">Manual follow-up</span><h2>A clear place to pick up the conversation.</h2>${["sent", "replied"].includes(l.status) && !s.contactBlocked ? `<form id="followupForm"><label>Next follow-up date<input type="date" id="followupDue" value="${esc(w?.followup_due ?? "")}"></label><label>What needs to happen?<textarea id="followupNote" rows="4" maxlength="6000">${esc(w?.followup_note ?? "")}</textarea></label><div class="row"><button class="btn primary" type="submit">Save follow-up</button><button class="btn" type="button" data-act="complete">Mark completed</button></div><p class="small muted">This schedules a reminder in your Desk. It does not send a message.</p></form>` : '<p class="muted">Follow-up tracking starts after you mark the first email sent.</p>'}</section>`;
    const pending = s.qa.filter((q) => !q.pass && !q.auto);
    return `<div class="detail-grid"><section><span class="eyebrow">Progress at a glance</span><h2>${esc(s.next)}</h2><ol class="workflow-checklist">${steps.map((label, i) => `<li class="${s.progress[i] ? "complete" : ""}"><span aria-hidden="true">${s.progress[i] ? "✓" : i + 1}</span><b>${label}</b></li>`).join("")}</ol>${w?.decision === "revision" ? `<div class="saved-feedback"><b>Requested changes${w.section ? ` · ${esc(w.section)}` : ""}</b><p>${esc(w.feedback)}</p><p class="small muted">The original version is in History. Open the editor only when you are ready to work on the changes.</p><button class="btn" data-act="edit-revision">Open revision editor ?</button></div>` : ""}${w?.decision === "declined" || l.status === "declined" ? `<p>This ${w?.decline_scope === "business" ? "prospect" : "concept"} was declined. Publication and outreach are blocked.</p><button class="btn" data-act="history-tab">View decision history</button>` : ""}</section>
    <section><span class="eyebrow">Keep moving</span>${s.action === "build" ? `<h2>Prepare a concept first.</h2><p>Use the detailed editor to verify the business and create the draft.</p><a href="#build/${encode(id)}" class="btn primary">Open preview builder →</a>` : ["checks", "design"].includes(s.action) || s.stage === "qa" ? `<h2>Business and preview checks</h2><p>${esc(s.checksReason)}</p>${s.record && !s.contactBlocked ? '<button class="btn primary" data-act="checks">Run verification checks</button><p class="small muted">Refreshes business sources and captures desktop/mobile previews. It does not generate or replace the design.</p>' : ""}${!s.checksReady && pending.length ? `<details class="manual-checks"><summary>Verify remaining information (${pending.length})</summary><p>Read the sources and check each item yourself. Technical checks cannot approve business claims.</p>${pending.map((q) => `<label class="qa-choice"><input type="checkbox" data-qa="${esc(q.item)}"><span>${esc(q.item)}</span></label>`).join("")}</details>` : ""}<details><summary>Verification details</summary><ul class="qa-detail-list">${s.qa.map((q) => `<li><b>${q.pass ? "✓" : "○"}</b><span>${esc(q.item)}${q.why ? `<small>${esc(q.why)}</small>` : ""}</span></li>`).join("")}</ul></details>${s.action === "email" ? '<button class="btn" data-act="email-tab">Review the email draft →</button>' : ""}` : s.action === "publish" ? `<h2>Publication readiness</h2><p>Design, required checks, and the email draft must be ready. Publication is your separate decision.</p>${l.status !== "approved" || !s.publicationCurrent ? `<button class="btn primary" data-act="publication-approval">Approve for publication</button>` : '<p class="saved-feedback">Publication approved. Confirm when you are ready to make this concept public.</p><button class="btn primary" data-act="publish-plan">Publish preview…</button>'}<div id="publishConfirm"></div>` : s.action === "verify-live" ? '<h2>Check publication</h2><p>The page was pushed but live verification has not finished. Check it before any outreach.</p><button class="btn primary" data-act="verify-live">Check published page</button>' : s.action === "takedown" ? '<h2>Page removal needs review</h2><p>This business opted out. Use the existing confirmation flow to remove its preview.</p><a class="btn bad" href="#approve">Review page removal →</a>' : s.action === "email" ? '<h2>Your email is next.</h2><p>Review your draft, then open Gmail once the page is verified live.</p><button class="btn primary" data-act="email-tab">Review email →</button>' : `<h2>${s.stage === "revisions" ? "Review another business." : "Your decision is saved."}</h2>${nextLink()}`}
    <div id="reviewJob"></div></section></div>`;
  };
  const decide = async (decision, extra = {}) => {
    await flush();
    requestId ??= crypto.randomUUID();
    const result = await api(`${path}/decision`, { decision, requestId, expectedRevision: data.state.revision, previewVersion: data.state.previewVersion, ...extra });
    mode = "";
    message = decision === "approved" ? "Design approved." : decision === "revision" ? "Revision request saved. Your original preview is preserved." : decision === "declined" ? "Decision saved. This concept is out of publication and outreach." : "Lead reopened for review.";
    // The decision clears the saved feedback draft; do not resave the submitted text.
    draftSaved = JSON.stringify([feedback, section]);
    await update(result);
  };
  const run = async (fn) => {
    if (busy) return;
    busy = true; error = "";
    $$(".decision-buttons button, .decision-form button, .email-actions button, #detailContent button", view).forEach((b) => b.disabled = true);
    try { await fn(); }
    catch (e) { error = e.message; toast(e.message); const el = $("#saveError", view); if (el) el.textContent = e.message; }
    finally { busy = false; if (!disposed) { paint(); if (error) $("#saveError", view).textContent = error; } }
  };
  const switchTab = async (next) => { await flush(); tab = next; paint(); resume(); $(".review-detail", view)?.scrollIntoView({ block: "start", behavior: "instant" }); };
  const bind = () => {
    view.onclick = (e) => {
      const dt = e.target.closest("[data-tab]"); if (dt) return run(() => switchTab(dt.dataset.tab));
      const dv = e.target.closest("[data-device]"); if (dv) { device = dv.dataset.device; paint(); return; }
      const version = e.target.closest("[data-version]"); if (version) return run(async () => { savedVersion = await api(`${path}/versions/${version.dataset.version}`); paint(); $(".preview-panel", view).scrollIntoView({ block: "start" }); });
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (!act) return;
      if (act === "revise" || act === "decline") { mode = act; requestId = null; paint(); $(act === "revise" ? "#feedback" : "#declineReason", view)?.focus(); return; }
      if (act === "cancel-decision") { mode = ""; paint(); return; }
      if (act === "current-version") { savedVersion = null; paint(); return; }
      if (act.endsWith("-tab")) return run(() => switchTab(act.replace("-tab", "")));
      return run(async () => {
        if (act === "approve") return decide("approved");
        if (act === "reopen") return decide("reopen");
        if (act === "edit-revision") { const r = await api(`${path}/edit-revision`, { expectedRevision: data.state.revision, previewVersion: data.state.previewVersion }); location.hash = r.editor; return; }
        if (act === "save") { await flush(); toast("Changes saved."); return; }
        if (act === "refresh") return update();
        if (act === "next") { await switchTab(tabFor(data.state.action)); if (data.state.action === "design") $(".preview-panel", view).scrollIntoView({ block: "start" }); return; }
        if (act === "email-reviewed") { await flush(); await update(await api(`${path}/email-review`, { expectedRevision: data.state.revision, emailVersion: data.state.emailVersion })); message = "Email review saved."; return; }
        if (act === "publication-approval") { await flush(); await api(`leads/${encode(id)}/approve`, { publicationVersion: data.state.publicationVersion, expectedRevision: data.state.revision }); message = "Publication approved. Confirm publication when you're ready."; return update(); }
        if (act === "publish-plan") { await flush(); publicationPlan = await api(`leads/${encode(id)}/publish/plan`, { publicationVersion: data.state.publicationVersion }); return; }
        if (act === "confirm-publish") { await api(`leads/${encode(id)}/publish`, { confirm: publicationPlan.slug, publicationVersion: data.state.publicationVersion }); publicationPlan = null; message = "Publishing started. Wait for live verification before outreach."; return update(); }
        if (act === "cancel-publish") { publicationPlan = null; return; }
        if (act === "checks") { await flush(); await api(`${path}/checks`, {}); message = "Verification started. You can continue reviewing other leads."; return; }
        if (act === "verify-live") { await api(`leads/${encode(id)}/verify-live`, {}); message = "Checking the published page. No new publication was started."; return; }
        if (act === "gmail") { await flush(); const r = await api(`email/${encode(id)}`); if (!r.gmailUrl) throw new Error(r.blockers.join(" ")); const a = document.createElement("a"); a.href = r.gmailUrl; a.target = "_blank"; a.rel = "noopener noreferrer"; a.click(); message = "Gmail opened. Review and send it yourself, then mark sent here."; return; }
        if (act === "sent") { await flush(); await api(`email/${encode(id)}/sent`, {}); message = "Email marked sent. Next: set a follow-up."; tab = "followup"; return update(); }
        if (act === "replied") { await api(`leads/${encode(id)}/replied`, {}); message = "Reply recorded. Add the next action."; tab = "followup"; return update(); }
        if (act === "complete") { await flush(); await api(`${path}/followup`, { expectedRevision: data.state.revision, ...followup, done: true }); message = "Follow-up completed. This lead is in Completed."; return update(); }
      });
    };
    if (publicationPlan && $("#publishConfirm", view)) $("#publishConfirm", view).innerHTML = `<div class="publication-confirm"><h3>Make this concept public?</h3><p>${esc(publicationPlan.url)}</p><p>This publishes the approved preview after the required checks. Email remains a separate manual action.</p><button class="btn primary" data-act="confirm-publish">Confirm: publish preview</button><button class="btn" data-act="cancel-publish">Cancel</button></div>`;
    const revisionForm = $("#revisionForm", view);
    if (revisionForm) {
      $("#feedback", view).oninput = (e) => { feedback = e.target.value; changed(); };
      $("#revisionSection", view).onchange = (e) => { section = e.target.value; changed(); };
      revisionForm.onsubmit = (e) => { e.preventDefault(); return run(() => decide("revision", { feedback, section })); };
    }
    if ($("#declineForm", view)) $("#declineForm", view).onsubmit = (e) => { e.preventDefault(); const extra = { reason: $("#declineReason", view).value, scope: $("#declineScope", view).value }; return run(() => decide("declined", extra)); };
    if ($("#leadNotes", view)) $("#leadNotes", view).oninput = (e) => { note = e.target.value; changed(); };
    for (const [input, key] of [["emailTo", "to"], ["emailSubject", "subject"], ["emailBody", "body"]]) if ($("#" + input, view)) $("#" + input, view).oninput = (e) => { mail[key] = e.target.value; changed(); };
    if ($("#emailForm", view)) $("#emailForm", view).onsubmit = (e) => { e.preventDefault(); return run(async () => { await flush(); await update(); message = "Email draft saved. Review it before continuing."; }); };
    if ($("#followupForm", view)) {
      $("#followupDue", view).value = followup.due; $("#followupNote", view).value = followup.note;
      $("#followupDue", view).oninput = (e) => { followup.due = e.target.value; changed(); };
      $("#followupNote", view).oninput = (e) => { followup.note = e.target.value; changed(); };
      $("#followupForm", view).onsubmit = (e) => { e.preventDefault(); return run(async () => { await flush(); message = "Follow-up saved. It will appear when it's due."; await update(); }); };
    }
    if ($(".manual-checks", view)) $(".manual-checks", view).open = manualOpen;
    $$("[data-qa]", view).forEach((box) => box.onchange = () => run(async () => { await api(`build/${encode(id)}/qa`, { item: box.dataset.qa, pass: box.checked }); await update(); }));
    if ($("#reviewJob", view)) watchJob($("#reviewJob", view), () => { if (!disposed && !dirty() && !mode) update().catch((e) => toast(e.message)); });
  };
  paint(); resume();
  return { beforeLeave: flush, dispose: () => { disposed = true; clearTimeout(timer); view.onclick = null; removeEventListener("beforeunload", unload); } };
}
