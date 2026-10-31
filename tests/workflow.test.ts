import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { reviewFixture } from "./fixtures/workflow.mjs";
import { openDb, now, json, log } from "../lead-desk/lib/db.mjs";
import { nextPreparation, automationTick } from "../lead-desk/lib/automation.mjs";
import { prepareLead } from "../lead-desk/lib/preparation.mjs";
import { approveBlockers } from "../lead-desk/lib/approve-api.mjs";
import { emailBlockers } from "../lead-desk/lib/outreach-api.mjs";
import { assertReviewedPublish, verifyPublished } from "../lead-desk/lib/publish.mjs";
import { publicationVersion } from "../lead-desk/lib/workflow-state.mjs";
import { verifyReview } from "../lead-desk/lib/review-checks.mjs";
import { autoChecks } from "../lead-desk/lib/preview.mjs";

const fixtures: ReturnType<typeof reviewFixture>[] = [];
const fixture = (...args: Parameters<typeof reviewFixture>) => { const f = reviewFixture(...args); fixtures.push(f); return f; };
afterEach(() => { for (const f of fixtures.splice(0)) { try { f.db.close(); } catch { /* restart test already closed it */ } } vi.restoreAllMocks(); });

describe("founder workflow", () => {
  it("requires technical checks to run instead of allowing fresh automatic items to be ticked by hand", () => {
    const f = fixture(); const id = f.add();
    const automatic = f.view(id).state.qa.find((q: { auto: boolean }) => q.auto);
    expect(f.call("POST", `/api/build/${id}/qa`, { item: automatic.item, pass: true })).toMatchObject({ httpStatus: 400 });
    expect(f.view(id).state.checksReady).toBe(false);
  });

  it("opens a separate revision editor for an unpublished approval while retaining the original version", () => {
    const f = fixture(); const id = f.add("Revision Example", { status: "approved", qa: true });
    f.decide(id, "revision", { feedback: "Change the service layout." });
    const s = f.view(id).state;
    expect(f.row(id).status).toBe("draft");
    expect(f.call("POST", `/api/workflow/${id}/edit-revision`, { expectedRevision: s.revision, previewVersion: s.previewVersion })).toMatchObject({ ok: true });
    expect(f.row(id).status).toBe("draft");
    const archived = JSON.parse(f.db.prepare("SELECT snapshot FROM review_decisions WHERE lead_id = ?").get(id).snapshot);
    expect(archived.record.status).toBe("approved"); expect(archived.screenshots).toHaveLength(2);
  });

  it("records visual approval before QA without editing the preview or publication status", () => {
    const f = fixture(); const id = f.add(); const file = join(f.repo, "leads", `${f.row(id).slug}.json`);
    const before = readFileSync(file, "utf8");
    expect(f.decide(id, "approved")).toMatchObject({ ok: true, state: { stage: "qa", designApproved: true, action: "checks" } });
    expect(f.row(id).status).toBe("draft"); expect(readFileSync(file, "utf8")).toBe(before);
    expect(approveBlockers(f.ctx, f.row(id)).join(" ")).toMatch(/QA/);
    const saved = f.db.prepare("SELECT snapshot FROM review_decisions WHERE lead_id = ?").get(id);
    expect(JSON.parse(saved.snapshot).screenshots.every((s: { file: string }) => existsSync(s.file))).toBe(true);
  });

  it("saves freeform revisions without changing files or triggering even an enabled worker", async () => {
    const f = fixture(); const id = f.add(); const before = readFileSync(join(f.repo, "leads", `${f.row(id).slug}.json`), "utf8");
    f.db.prepare("INSERT INTO settings VALUES ('automation_enabled', '1')").run();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(f.decide(id, "revision", { feedback: "Improve the mobile gallery.", section: "Gallery" })).toMatchObject({ ok: true, state: { stage: "revisions" } });
    expect(f.workflow(id).feedback).toBe("Improve the mobile gallery.");
    expect(nextPreparation(f.ctx)).toBeUndefined();
    // Do not fall through to finder work: stop the day's search and provide no other work.
    f.db.prepare("INSERT INTO settings VALUES ('automation_find_day', ?)").run(now().slice(0, 10));
    f.db.prepare("INSERT INTO settings VALUES ('automation_chamber_runs', ?)").run(`${now().slice(0, 10)}:2`);
    automationTick(f.ctx);
    await expect(prepareLead(f.ctx, id)).rejects.toThrow(/separate, authorized/);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(readFileSync(join(f.repo, "leads", `${f.row(id).slug}.json`), "utf8")).toBe(before);
    expect(approveBlockers(f.ctx, f.row(id)).join(" ")).toMatch(/awaiting revision/);
  });

  it("distinguishes a declined concept from a declined prospect and blocks old approval routes", () => {
    const f = fixture(); const a = f.add("Example Dental", { qa: true }); const b = f.add("Example Plumbing");
    expect(f.decide(a, "declined", { reason: "Poor design direction" }).state.label).toBe("Concept declined");
    expect(f.row(a).status).toBe("draft");
    expect(f.call("POST", `/api/leads/${a}/status`, { status: "approved" })).toMatchObject({ httpStatus: 409 });
    expect(f.decide(b, "declined", { scope: "business", reason: "Not a suitable prospect" }).state.label).toBe("Prospect declined");
    expect(f.row(b).status).toBe("declined");
    expect(f.decide(a, "reopen")).toMatchObject({ ok: true, state: { decision: "pending" } });
    expect(f.decide(b, "reopen").ok).toBe(true); expect(f.row(b).status).toBe("draft");
    expect(f.db.prepare("SELECT COUNT(*) n FROM review_decisions").get().n).toBe(4);
  });

  it("requires a current visual version, catches template edits and preserves prior screenshots", () => {
    const f = fixture(); const id = f.add(); const version = f.view(id).state.previewVersion;
    f.decide(id, "approved");
    const old = JSON.parse(f.db.prepare("SELECT snapshot FROM review_decisions WHERE lead_id = ?").get(id).snapshot);
    writeFileSync(f.snapshot(id)!.screenshots[0].file, "a new screenshot");
    expect(f.view(id).state.designApproved).toBe(false);
    expect(readFileSync(old.screenshots[0].file, "utf8")).toBe("synthetic desktop fixture");
    expect(f.decide(id, "approved", { previewVersion: version })).toMatchObject({ httpStatus: 409 });
    f.decide(id, "approved");
    writeFileSync(join(f.repo, "src/sections/Sections.tsx"), "synthetic presentation changed with more content");
    expect(f.view(id).state.designApproved).toBe(false);
  });

  it.each(["CollectionSite.tsx", "CollectionParts.tsx", "CollectionHomes.tsx", "collection.module.css"])("requires a fresh visual review after %s changes", (file) => {
    const f = fixture(); const id = f.add();
    f.decide(id, "approved");
    expect(f.view(id).state.designApproved).toBe(true);
    writeFileSync(join(f.repo, "src/sections", file), "synthetic changed collection presentation");
    expect(f.view(id).state.designApproved).toBe(false);
    expect(f.db.prepare("SELECT COUNT(*) n FROM review_decisions WHERE lead_id = ?").get(id).n).toBe(1);
  });

  it("rejects stale tabs, empty feedback and repeated decisions without duplicate history", () => {
    const f = fixture(); const id = f.add();
    expect(f.decide(id, "revision", { feedback: " " })).toMatchObject({ httpStatus: 400 });
    const body = { decision: "approved", expectedRevision: 0, previewVersion: f.view(id).state.previewVersion, requestId: "same-request-id" };
    expect(f.call("POST", `/api/workflow/${id}/decision`, body).ok).toBe(true);
    expect(f.call("POST", `/api/workflow/${id}/decision`, body).duplicate).toBe(true);
    expect(f.decide(id, "approved").duplicate).toBe(true);
    expect(f.decide(id, "declined", { expectedRevision: 0 })).toMatchObject({ httpStatus: 409 });
    expect(f.db.prepare("SELECT COUNT(*) n FROM review_decisions").get().n).toBe(1);
  });

  it("binds email review and publication approval and rejects edits through advanced routes", () => {
    const f = fixture(); const id = f.add("Example Auto", { qa: true });
    f.decide(id, "approved"); expect(f.view(id).state.action).toBe("email");
    f.emailReview(id); expect(f.view(id).state.action).toBe("publish");
    expect(f.approvePublication(id)).toMatchObject({ status: "approved" });
    const p = { status: "approved", after: JSON.stringify({ ...f.snapshot(id)!.record, status: "approved" }, null, 2) + "\n" };
    expect(() => assertReviewedPublish(f.ctx, f.row(id), p)).not.toThrow();
    const oldMailVersion = f.mailVersion(id);
    f.db.prepare("UPDATE emails SET body = body || ' An edit.' WHERE lead_id = ?").run(id);
    expect(f.call("POST", `/api/workflow/${id}/email-review`, { expectedRevision: f.workflow(id).revision, emailVersion: oldMailVersion })).toMatchObject({ httpStatus: 409 });
    expect(() => assertReviewedPublish(f.ctx, f.row(id), p)).toThrow(/changed/);
    expect(f.call("POST", `/api/leads/${id}/publish`, { confirm: f.row(id).slug, publicationVersion: publicationVersion(f.ctx, f.row(id)) })).toMatchObject({ httpStatus: 400 });
  });

  it("keeps legacy approvals and existing records intact when new tables are added on restart", () => {
    const f = fixture(":temp:"); const legacy = f.add("Legacy Example", { status: "approved", qa: true }); const id = f.add();
    log(f.db, legacy, "existing history", "Preserve this");
    f.decide(id, "revision", { feedback: "Keep the original and revise the hero." });
    f.call("POST", `/api/workflow/${id}/draft`, { expectedRevision: 0, feedback: "Unfinished feedback", section: "Hero" });
    f.call("POST", `/api/workflow/${id}/resume`, { step: "revision" });
    f.db.close();
    const reopened = openDb(join(f.repo, "data", "synthetic.db"));
    expect(reopened.prepare("SELECT status FROM leads WHERE id = ?").get(legacy).status).toBe("approved");
    expect(reopened.prepare("SELECT feedback FROM lead_workflow WHERE lead_id = ?").get(id).feedback).toContain("revise the hero");
    expect(reopened.prepare("SELECT feedback FROM review_drafts WHERE lead_id = ?").get(id).feedback).toBe("Unfinished feedback");
    expect(reopened.prepare("SELECT value FROM settings WHERE key = 'review_resume'").get().value).toContain(id);
    expect(reopened.prepare("SELECT COUNT(*) n FROM history WHERE lead_id = ?").get(legacy).n).toBe(1);
    reopened.close();
  });

  it("preserves unsent draft concurrency and prevents repeated sent/replied timestamps", () => {
    const f = fixture(); const id = f.add("Example Outreach", { status: "live" });
    const version = f.mailVersion(id);
    f.db.prepare("UPDATE emails SET subject = 'Another window' WHERE lead_id = ?").run(id);
    expect(f.call("POST", `/api/email/${id}`, { to: "office@example.example", subject: "Stale", body: "Don't overwrite", expectedVersion: version })).toMatchObject({ httpStatus: 409 });
    f.call("POST", `/api/email/${id}/sent`);
    const sent = f.db.prepare("SELECT sent_at FROM emails WHERE lead_id = ?").get(id).sent_at;
    f.call("POST", `/api/email/${id}/sent`); f.call("POST", `/api/leads/${id}/replied`); f.call("POST", `/api/leads/${id}/replied`);
    expect(f.db.prepare("SELECT sent_at FROM emails WHERE lead_id = ?").get(id).sent_at).toBe(sent);
    expect(f.db.prepare("SELECT COUNT(*) n FROM history WHERE lead_id = ? AND action = 'replied (marked by Kriv)'").get(id).n).toBe(1);
  });

  it("blocks do-not-contact at decisions, publication, Gmail and follow-up", () => {
    const f = fixture(); const id = f.add("Blocked Example", { qa: true });
    f.decide(id, "approved"); f.emailReview(id); f.approvePublication(id);
    f.db.prepare("INSERT INTO opt_outs VALUES ('blocked-example.example', 'domain', 'stop', ?)").run(now());
    expect(f.decide(id, "approved")).toMatchObject({ httpStatus: 400 });
    expect(f.view(id).state.contactBlocked).toBe(true);
    const mail = f.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(id);
    expect(emailBlockers(f.db, f.row(id), mail).join(" ")).toMatch(/do-not-contact/);
    f.db.prepare("UPDATE leads SET status = 'sent' WHERE id = ?").run(id);
    expect(f.call("POST", `/api/workflow/${id}/followup`, { expectedRevision: f.workflow(id).revision, due: "2026-10-31" })).toMatchObject({ httpStatus: 400 });
  });

  it("tracks due follow-ups and completion without sending or scheduling an external task", () => {
    const f = fixture(); const id = f.add("Example Followup", { status: "sent" }); const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(f.call("POST", `/api/workflow/${id}/followup`, { expectedRevision: 0, due: "2026-02-31" })).toMatchObject({ httpStatus: 400 });
    expect(f.call("POST", `/api/workflow/${id}/followup`, { expectedRevision: 0, due: "2000-01-01", note: "Read the reply manually" }).state.attention).toBe(true);
    expect(f.call("POST", `/api/workflow/${id}/followup`, { expectedRevision: 1, done: true }).state.stage).toBe("completed");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("retries live verification without republishing and rechecks decisions after the response", async () => {
    const f = fixture(); const id = f.add("Example Published", { qa: true }); f.decide(id, "approved"); f.emailReview(id); f.approvePublication(id);
    log(f.db, id, "published", { sha: "synthetic", version: publicationVersion(f.ctx, f.row(id)) });
    expect(f.view(id).state.action).toBe("verify-live");
    expect(f.call("POST", `/api/leads/${id}/publish`, { confirm: f.row(id).slug })).toMatchObject({ httpStatus: 400 });
    await expect(verifyPublished(f.ctx, f.row(id), async () => false)).rejects.toThrow(/Nothing was republished/);
    await expect(verifyPublished(f.ctx, f.row(id), async () => true)).resolves.toEqual({ verified: true });
    expect(f.row(id).status).toBe("live");
    expect(f.db.prepare("SELECT COUNT(*) n FROM history WHERE action = 'published'").get().n).toBe(1);
  });

  it("checks a revised record without generating it and holds unverified facts", async () => {
    const f = fixture(); const id = f.add(); f.decide(id, "revision", { feedback: "Change the hero." });
    const original = readFileSync(join(f.repo, "leads", `${f.row(id).slug}.json`), "utf8");
    const files = f.snapshot(id)!.screenshots.map((s: { file: string }) => s.file);
    const deps = { readSources: async () => f.db.prepare("SELECT url, status, text, html, fetched_at FROM pages").all(), ensureDev: async () => {}, shoot: async () => ({ ok: true, files }), autoChecks: async () => Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`unmapped fixture check ${i}`, { pass: true }])) };
    await expect(verifyReview(f.ctx, id, deps)).rejects.toThrow(/Verify the remaining business facts/);
    expect(readFileSync(join(f.repo, "leads", `${f.row(id).slug}.json`), "utf8")).toBe(original);
    const qa = f.view(id).state.qa.map((q: { item: string }) => ({ ...q, pass: true }));
    f.db.prepare("UPDATE drafts SET qa = ? WHERE lead_id = ?").run(json(qa), id);
    await expect(verifyReview(f.ctx, id, deps)).resolves.toEqual({ ok: true });
    expect(f.workflow(id).decision).toBe("revision");
  });

  it("allows only known internal concept navigation in technical link checks", async () => {
    const f = fixture(); const id = f.add(); const rec = f.snapshot(id)!.record;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(`<head></head><a href="/for/${rec.slug}/contact">Contact details</a><a href="/for/${rec.slug}/services/example-service">Service</a>`));
    expect((await autoChecks(rec, { schemaOk: true, shootOk: true }))["Links:"].pass).toBe(true);
    vi.mocked(fetch).mockResolvedValue(new Response('<head></head><a href="mailto:office@example.example">Email</a>'));
    expect((await autoChecks(rec, { schemaOk: true, shootOk: true }))["Links:"].pass).toBe(false);
    vi.mocked(fetch).mockResolvedValue(new Response('<head></head><a href="/for/another-business/contact">Wrong business</a>'));
    expect((await autoChecks(rec, { schemaOk: true, shootOk: true }))["Links:"].pass).toBe(false);
  });
});
