import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb, now } from "../lead-desk/lib/db.mjs";
import { upsertLead } from "../lead-desk/lib/leads.mjs";
import { presetForm, presetEmail, REVISIONS } from "../lead-desk/lib/offer-presets.mjs";
import { prepareLead } from "../lead-desk/lib/preparation.mjs";
import { preparationReadiness } from "../lead-desk/lib/preparation-state.mjs";
import { approveBlockers } from "../lead-desk/lib/approve-api.mjs";
import { inboxRoutes } from "../lead-desk/lib/inbox-api.mjs";
import { automationStatus, automationTick, nextPreparation } from "../lead-desk/lib/automation.mjs";
import { assertReviewedPublish } from "../lead-desk/lib/publish.mjs";
import { aiRoutes } from "../lead-desk/lib/ai-api.mjs";
import { aiEnabled, aiSuggest } from "../lead-desk/lib/ai.mjs";
import { toRecord } from "../lead-desk/lib/builder.mjs";

// Synthetic businesses only. No real databases, credentials, websites or paid API requests.
const SITE = "https://acme.example/";
const TEXT = "Acme Air. Heating and air conditioning. AC repair in Ocala FL. (352) 555-0100. Contact info@acme.example.";
const templates = [{ id: "hvac-calm" }, { id: "hvac-bold" }];
const photo = { url: "https://images.unsplash.com/example", credit: { provider: "Unsplash", photographer: "Example Photographer", profileUrl: "https://unsplash.com/@example", photoPage: "https://unsplash.com/photos/example" } };
function fixture() {
  const repo = mkdtempSync(join(tmpdir(), "offer-preparation-"));
  for (const dir of ["leads", "docs", "shots", "data"]) mkdirSync(join(repo, dir));
  writeFileSync(join(repo, "docs", "LEAD-QA.md"), readFileSync(join(process.cwd(), "docs", "LEAD-QA.md")));
  const db = openDb(":memory:");
  const id = upsertLead(db, { name: "Acme Air", town: "Ocala", state: "FL", niche: "hvac", website: SITE, phone: "3525550100", email: "info@acme.example" }, { bucket: "qualified" });
  const ctx = { db, repo, leadsDir: join(repo, "data") };
  const page = { url: SITE, status: 200, text: TEXT, html: "<h2>Our services</h2><h3>AC repair</h3>" };
  const files = ["desktop", "phone"].map((n) => join(repo, "shots", `${n}.png`));
  for (const f of files) writeFileSync(f, `synthetic ${f}`);
  const deps = {
    readSources: async () => {
      db.prepare("INSERT INTO pages (url, status, html, text, fetched_at) VALUES (?, 200, ?, ?, ?) ON CONFLICT(url) DO UPDATE SET text = excluded.text, fetched_at = excluded.fetched_at").run(SITE, page.html, page.text, now());
      return [page];
    },
    templates: () => templates,
    photos: async () => [photo],
    ensureDev: async () => {},
    shoot: async () => ({ ok: true, files }),
    autoChecks: async () => Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`check ${i}`, { pass: true }])),
  };
  const lead = () => db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
  return { ctx, db, id, deps, lead, page, files };
}
afterEach(() => vi.restoreAllMocks());

describe("preset offers without paid AI", () => {
  it("omits unsupported town, phone and services instead of inventing facts", () => {
    const f = fixture();
    const lead = { ...f.lead(), town: "Unverified Town", phone: "5551239999" };
    const form = presetForm(lead, [f.page], templates);
    expect(form.f).not.toHaveProperty("city");
    expect(form.f).not.toHaveProperty("phone");
    expect(JSON.stringify(form)).not.toContain("Unverified Town");
    expect(form.lists.services.map((s: { name: string }) => s.name)).toEqual(["AC repair"]);
    expect(() => presetForm(lead, [], templates)).toThrow(/business name cannot be confirmed/);
  });

  it("applies deterministic calm, bold and shorter presets with no invented website criticism", () => {
    const f = fixture();
    expect(presetForm(f.lead(), [f.page], templates, { revision: "Calmer look" }).template).toBe("hvac-calm");
    expect(presetForm(f.lead(), [f.page], templates, { revision: "Bolder look" }).template).toBe("hvac-bold");
    const form = presetForm(f.lead(), [f.page], templates, { revision: "Shorter wording" });
    const rec = toRecord({ ...form, photos: [photo] });
    const mail = presetEmail(f.lead(), rec, { revision: "Shorter wording" });
    expect(mail.body).toContain(`https://kriv.agency/${rec.slug}`);
    expect(mail.body).toContain("Interested in discussing it?");
    expect(mail.body).not.toMatch(/outdated|broken|ugly|\[\[/);
  });

  it("creates a ready review bound to the actual draft and email without ticking manual QA or approving", async () => {
    const f = fixture();
    await prepareLead(f.ctx, f.id, f.deps);
    expect(preparationReadiness(f.ctx, f.lead()).ready).toBe(true);
    expect(approveBlockers(f.ctx, f.lead())).toEqual([]);
    expect(f.lead().status).toBe("draft");
    const d = f.db.prepare("SELECT qa FROM drafts WHERE lead_id = ?").get(f.id);
    expect(JSON.parse(d.qa)).toEqual([]);
    expect(JSON.parse(readFileSync(join(f.ctx.repo, "leads", `${f.lead().slug}.json`), "utf8")).status).toBe("draft");
    expect(aiEnabled(f.db)).toBe(false);
  });

  it("invalidates ready content after a page, email, source or screenshot edit", async () => {
    const f = fixture(); await prepareLead(f.ctx, f.id, f.deps);
    f.db.prepare("UPDATE emails SET body = body || ' edited' WHERE lead_id = ?").run(f.id);
    expect(preparationReadiness(f.ctx, f.lead()).ready).toBe(false);
    expect(approveBlockers(f.ctx, f.lead()).join(" ")).toMatch(/changed/);
    await prepareLead(f.ctx, f.id, f.deps);
    writeFileSync(f.files[0], "new screenshot");
    expect(preparationReadiness(f.ctx, f.lead()).ready).toBe(false);
    await prepareLead(f.ctx, f.id, f.deps);
    f.db.prepare("UPDATE pages SET text = 'Changed source' WHERE url = ?").run(SITE);
    expect(preparationReadiness(f.ctx, f.lead()).ready).toBe(false);
  });

  it("keeps an unchanged approved snapshot valid but catches edits to it", async () => {
    const f = fixture(); await prepareLead(f.ctx, f.id, f.deps);
    const file = join(f.ctx.repo, "leads", `${f.lead().slug}.json`);
    const rec = JSON.parse(readFileSync(file, "utf8")); rec.status = "approved";
    writeFileSync(file, JSON.stringify(rec));
    f.db.prepare("UPDATE leads SET status = 'approved' WHERE id = ?").run(f.id);
    expect(preparationReadiness(f.ctx, f.lead()).ready).toBe(true);
    rec.hero.sub = "Changed after approval"; writeFileSync(file, JSON.stringify(rec));
    expect(preparationReadiness(f.ctx, f.lead()).ready).toBe(false);
  });

  it("holds blocked sources and technical failures and cannot use manual ticks to bypass them", async () => {
    const f = fixture();
    await expect(prepareLead(f.ctx, f.id, { ...f.deps, readSources: async () => [] })).rejects.toThrow(/Sources could not be read/);
    expect(f.db.prepare("SELECT state FROM preparations WHERE lead_id = ?").get(f.id).state).toBe("held");
    await expect(prepareLead(f.ctx, f.id, { ...f.deps, shoot: async () => ({ ok: false, files: f.files }) })).rejects.toThrow(/preview check failed/);
    expect(approveBlockers(f.ctx, f.lead()).join(" ")).toMatch(/preview check failed/);
    expect(preparationReadiness(f.ctx, f.lead()).ready).toBe(false);
  });

  it("requires the current source to publish the mailbox", async () => {
    const f = fixture(); f.page.text = "Acme Air in Ocala. No contact email shown.";
    await expect(prepareLead(f.ctx, f.id, f.deps)).rejects.toThrow(/contact email could not be confirmed/);
    expect(readdirSync(join(f.ctx.repo, "leads"))).toEqual([]);
  });

  it("preserves a concurrent draft edit rather than overwriting it", async () => {
    const f = fixture(); await prepareLead(f.ctx, f.id, f.deps);
    const file = join(f.ctx.repo, "leads", `${f.lead().slug}.json`);
    const edited = { ...JSON.parse(readFileSync(file, "utf8")), hero: { headline: "My edit", sub: "Keep this" } };
    await expect(prepareLead(f.ctx, f.id, { ...f.deps, templates: () => { writeFileSync(file, JSON.stringify(edited)); return templates; } })).rejects.toThrow(/edited during preparation/);
    expect(JSON.parse(readFileSync(file, "utf8")).hero.headline).toBe("My edit");
  });

  it("retains a private version backup before rewriting a draft for a preset revision", async () => {
    const f = fixture(); await prepareLead(f.ctx, f.id, f.deps);
    const old = readFileSync(join(f.ctx.repo, "leads", `${f.lead().slug}.json`), "utf8");
    f.db.prepare("UPDATE preparations SET state = 'queued', revision = ? WHERE lead_id = ?").run("Calmer look", f.id);
    await prepareLead(f.ctx, f.id, f.deps);
    const dir = join(f.ctx.leadsDir, "revisions");
    const backup = JSON.parse(readFileSync(join(dir, readdirSync(dir)[0]), "utf8"));
    expect(backup.record).toEqual(JSON.parse(old));
    expect(JSON.parse(readFileSync(join(f.ctx.repo, "leads", `${f.lead().slug}.json`), "utf8")).template).toBe("hvac-calm");
    expect(f.lead().status).toBe("draft");
  });

  it("has no source/model requests on startup while paused and blocks all legacy paid helpers", async () => {
    const f = fixture(); const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(automationStatus(f.ctx).running).toBe(false);
    automationTick(f.ctx);
    expect(f.db.prepare("SELECT COUNT(*) n FROM preparations").get().n).toBe(0);
    f.db.prepare("INSERT INTO settings (key, value) VALUES ('ai_enabled', '1')").run();
    expect(aiEnabled(f.db)).toBe(false);
    await expect(aiSuggest(f.ctx.repo, f.db, { kind: "email", lead: f.lead(), draft: "Hello", facts: "" })).rejects.toThrow(/Paid AI is disabled/);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(existsSync(join(f.ctx.repo, ".env.local"))).toBe(false);
  });

  it("accepts only preset revisions and queues them without approval", async () => {
    const f = fixture(); await prepareLead(f.ctx, f.id, f.deps);
    const route = inboxRoutes.find(([m, re]) => m === "POST" && (re as RegExp).test(`/api/inbox/${f.id}/revision`))![2] as (ctx: object) => { ok?: boolean; httpStatus?: number; paused?: boolean };
    const call = (request: string) => route({ ...f.ctx, params: { id: f.id }, body: { request } });
    expect(call("Invent five testimonials").httpStatus).toBe(400);
    expect(call(REVISIONS[0])).toMatchObject({ ok: true, paused: true });
    expect(preparationReadiness(f.ctx, f.lead()).ready).toBe(false);
    expect(f.lead().status).toBe("draft");
  });

  it("requires fresh sources for draft approval but keeps an approved snapshot publishable", async () => {
    const f = fixture(); await prepareLead(f.ctx, f.id, f.deps);
    f.db.prepare("UPDATE preparations SET updated_at = '2000-01-01T00:00:00Z' WHERE lead_id = ?").run(f.id);
    expect(preparationReadiness(f.ctx, f.lead()).ready).toBe(false);
    f.db.prepare("UPDATE leads SET status = 'approved' WHERE id = ?").run(f.id);
    const file = join(f.ctx.repo, "leads", `${f.lead().slug}.json`);
    const rec = JSON.parse(readFileSync(file, "utf8")); rec.status = "approved";
    writeFileSync(file, JSON.stringify(rec));
    const plan = { status: "approved", after: JSON.stringify(rec, null, 2) + "\n" };
    expect(() => assertReviewedPublish(f.ctx, f.lead(), plan)).not.toThrow();
    expect(() => assertReviewedPublish(f.ctx, f.lead(), { ...plan, after: plan.after.replace("Acme Air", "Wrong business") })).toThrow(/no longer matches/);
    // A later decline must stop a long-running publish even with its earlier lead snapshot.
    const approved = f.lead();
    f.db.prepare("UPDATE leads SET status = 'declined' WHERE id = ?").run(f.id);
    expect(() => assertReviewedPublish(f.ctx, approved, plan)).toThrow(/permission changed/);
  });

  it("skips missing, opted-out and already-sent mailboxes in background preparation", () => {
    const f = fixture(); expect(nextPreparation(f.ctx)?.id).toBe(f.id);
    f.db.prepare("UPDATE leads SET email = NULL WHERE id = ?").run(f.id);
    expect(nextPreparation(f.ctx)).toBeUndefined();
    f.db.prepare("UPDATE leads SET email = 'info@acme.example' WHERE id = ?").run(f.id);
    f.db.prepare("INSERT INTO opt_outs VALUES ('acme.example', 'domain', 'stop', ?)").run(now());
    expect(nextPreparation(f.ctx)).toBeUndefined();
    f.db.prepare("DELETE FROM opt_outs").run();
    f.db.prepare("INSERT INTO emails (lead_id, status, updated_at) VALUES (?, 'sent', ?)").run(f.id, now());
    expect(nextPreparation(f.ctx)).toBeUndefined();
  });

  it("validates search settings without starting work or enabling paid requests", async () => {
    const f = fixture(); const fetchSpy = vi.spyOn(globalThis, "fetch");
    const route = inboxRoutes.find(([m, re]) => m === "POST" && (re as RegExp).test("/api/inbox/settings"))![2] as (ctx: object) => { httpStatus?: number; enabled?: boolean };
    expect(route({ ...f.ctx, body: { enabled: true, search: { source: "hotfrog", towns: ["invalid"] } } }).httpStatus).toBe(400);
    expect(automationStatus(f.ctx).enabled).toBe(false);
    expect(route({ ...f.ctx, body: { enabled: true, search: { source: "hotfrog", towns: ["ocala-fl"] } } }).enabled).toBe(true);
    expect(route({ ...f.ctx, body: { enabled: false } }).enabled).toBe(false);
    for (const path of ["/api/ai", `/api/build/${f.id}/ai-prefill`, "/api/ai/suggest"]) {
      const handler = aiRoutes.find(([m, re]) => m === "POST" && (re as RegExp).test(path))![2] as (ctx: object) => Promise<{ httpStatus?: number }>;
      expect((await handler({ ...f.ctx, params: { id: f.id }, body: { enabled: true } })).httpStatus).toBe(400);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
