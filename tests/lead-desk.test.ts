import { describe, expect, it } from "vitest";
import { openDb, isOptedOut } from "../lead-desk/lib/db.mjs";
import { upsertLead, laterStatus, findLead } from "../lead-desk/lib/leads.mjs";
import { addOptOut, routes, needsKriv } from "../lead-desk/lib/api.mjs";
import { parseEmailFile } from "../lead-desk/lib/import.mjs";
import { classify } from "../scripts/finder/rules.mjs";
import { emailFooter } from "@/outreach/footer";
import { qaChecklist } from "../lead-desk/lib/preview.mjs";
import { toRecord, formProblems, schemaProblems, parseAddress, suggestSlug } from "../lead-desk/lib/builder.mjs";
import { aiEnabled } from "../lead-desk/lib/ai.mjs";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const fresh = () => openDb(":memory:");
type Route = [string, RegExp, (ctx: Record<string, unknown>) => unknown];
const call = (db: unknown, method: string, path: string, body: unknown = {}, extra: Record<string, unknown> = {}) => {
  for (const [m, re, fn] of routes as Route[]) {
    const match = m === method && path.match(re);
    if (match) return fn({ db, params: match.groups ?? {}, query: {}, body, ...extra });
  }
  throw new Error(`no route ${method} ${path}`);
};

// A throwaway repo with the real QA checklist and one draft lead file.
function tempRepo(slug: string) {
  const dir = mkdtempSync(join(tmpdir(), "lead-desk-"));
  mkdirSync(join(dir, "docs"));
  mkdirSync(join(dir, "leads"));
  copyFileSync(join(process.cwd(), "docs", "LEAD-QA.md"), join(dir, "docs", "LEAD-QA.md"));
  writeFileSync(join(dir, "leads", `${slug}.json`), JSON.stringify({ slug, status: "draft" }));
  return dir;
}

describe("lead desk: records", () => {
  it("merges the same business found by website, phone or email", () => {
    const db = fresh();
    const a = upsertLead(db, { name: "Acme Air", state: "FL", website: "https://www.acmeair.example/", phone: "+1 (352) 555-0100" }, { bucket: "near" });
    expect(upsertLead(db, { name: "Acme Air LLC", state: "FL", website: "http://acmeair.example/contact" })).toBe(a);
    expect(upsertLead(db, { name: "Acme", state: "FL", phone: "352-555-0100" })).toBe(a);
    const b = upsertLead(db, { name: "Beta Dental", state: "TX", email: "info@beta.example" });
    expect(upsertLead(db, { name: "Beta Dental PLLC", state: "TX", email: "INFO@beta.example" })).toBe(b);
    expect(db.prepare("SELECT COUNT(*) n FROM leads").get().n).toBe(2);
    expect(findLead(db, { website: "https://acmeair.example" }).name).toBe("Acme Air");
  });

  it("only moves statuses forward, and never past declined or expired", () => {
    expect(laterStatus("found", "draft")).toBe("draft");
    expect(laterStatus("sent", "draft")).toBe("sent");
    expect(laterStatus("declined", "sent")).toBe("declined");
    expect(laterStatus("live", "expired")).toBe("expired");
  });
});

describe("lead desk: Kriv's clicks", () => {
  it("approves only a draft with every QA item ticked and an email draft, and never sets live or sent by hand", async () => {
    const db = fresh();
    const repo = tempRepo("gamma-chiro");
    const id = upsertLead(db, { name: "Gamma Chiro", state: "UT", website: "https://gamma.example", email: "info@gamma.example" });
    const approve = () => call(db, "POST", `/api/leads/${id}/status`, { status: "approved" }, { repo }) as { httpStatus?: number; body?: { error: string }; status?: string };
    expect(approve().httpStatus).toBe(400); // not a draft
    db.prepare("UPDATE leads SET status = 'draft', slug = 'gamma-chiro' WHERE id = ?").run(id);
    db.prepare("INSERT INTO drafts (slug, lead_id, created_at, updated_at) VALUES ('gamma-chiro', ?, 'x', 'x')").run(id);
    expect(needsKriv(db).some((n: { kind: string }) => n.kind === "approve")).toBe(true);
    expect(approve().body?.error).toMatch(/QA items not ticked.*No email draft/);
    const qa = qaChecklist(repo).map((q: { item: string }) => ({ item: q.item, pass: true }));
    db.prepare("UPDATE drafts SET qa = ? WHERE slug = 'gamma-chiro'").run(JSON.stringify(qa));
    db.prepare("INSERT INTO emails (lead_id, to_addr, subject, body, updated_at) VALUES (?, 'info@gamma.example', 'A concept', 'Hi [[owner_first_name]]', 'x')").run(id);
    expect(approve().body?.error).toMatch(/blanks/);
    db.prepare("UPDATE emails SET body = 'Hi there' WHERE lead_id = ?").run(id);
    expect(approve().status).toBe("approved");
    expect(JSON.parse(readFileSync(join(repo, "leads", "gamma-chiro.json"), "utf8")).status).toBe("approved");
    expect((call(db, "POST", `/api/leads/${id}/status`, { status: "live" }) as { httpStatus: number }).httpStatus).toBe(400);
    expect(db.prepare("SELECT action FROM history WHERE lead_id = ?").all(id).map((h: { action: string }) => h.action)).toContain("status");
  });

  it("publishes only on the confirm click that repeats the address", () => {
    const db = fresh();
    const id = upsertLead(db, { name: "Iota Air", state: "FL", website: "https://iota.example" });
    db.prepare("UPDATE leads SET status = 'approved', slug = 'iota-air' WHERE id = ?").run(id);
    const r = call(db, "POST", `/api/leads/${id}/publish`, {}, { repo: tempRepo("iota-air") }) as { body: { error: string } };
    expect(r.body.error).toMatch(/confirm click/);
  });

  it("opt-outs block the address and its own domain, not a free-mail domain, and expire the lead", () => {
    const db = fresh();
    const own = upsertLead(db, { name: "Delta HVAC", state: "TX", email: "office@delta.example", website: "https://delta.example" });
    const free = upsertLead(db, { name: "Echo Plumbing", state: "FL", email: "echoplumbing@gmail.com" });
    const other = upsertLead(db, { name: "Fox Auto", state: "FL", email: "foxauto@gmail.com" });
    expect(addOptOut(db, { value: "jane@delta.example" }).expired).toEqual([own]);
    expect(isOptedOut(db, "info@delta.example")).toBe(true);
    expect(addOptOut(db, { value: "EchoPlumbing@gmail.com", reason: "replied stop" }).added).toEqual(["echoplumbing@gmail.com"]);
    expect(isOptedOut(db, "foxauto@gmail.com")).toBe(false);
    const status = (id: string) => db.prepare("SELECT status FROM leads WHERE id = ?").get(id).status;
    expect([status(own), status(free), status(other)]).toEqual(["expired", "expired", "found"]);
    expect(() => addOptOut(db, { value: "not an address" })).toThrow();
  });
});

describe("lead desk: import and rules", () => {
  it("reads an email draft file and drops the standard footer", () => {
    const text = `To: info@acme.example\r\nSubject: A concept\r\n\r\nHi Acme team,\r\n\r\nKriv\r\n\r\n${emailFooter()}\r\n`;
    expect(parseEmailFile(text)).toEqual({ to: "info@acme.example", subject: "A concept", body: "Hi Acme team,\n\nKriv" });
  });

  it("applies the unchanged rules: no website + business mailbox with mail records qualifies", async () => {
    const checks = new Map();
    const c = { state: "FL", town: "Ocala", niche: "hvac", name: "Acme Air", website: null, emailsListing: ["acmeair@gmail.com"], listingUrl: "https://www.hotfrog.com/company/x", sources: [] };
    expect((await classify(c, { checks, hasMx: async () => true })).bucket).toBe("qualified");
    expect((await classify(c, { checks, hasMx: async () => false })).bucket).toBe("near");
    expect((await classify({ ...c, emailsListing: ["maria.lopez@gmail.com"] }, { checks, hasMx: async () => true })).bucket).toBe("near");
    expect((await classify({ ...c, name: "Aspen Dental" }, { checks, hasMx: async () => true })).bucket).toBe("skip");
  });
});

describe("lead desk: email and LinkedIn", async () => {
  const { fill, openBlanks, gmailComposeUrl, teamName, valuesFor, loadTemplates } = await import("../lead-desk/lib/compose.mjs");
  const { emailBlockers } = await import("../lead-desk/lib/outreach-api.mjs");

  it("fills templates from the lead and leaves unknown blanks visible", () => {
    const v = valuesFor({ name: "Acme Air Conditioning LLC", town: "Ocala", niche: "hvac", slug: "acme-air", website: "http://www.acmeair.example/", flags: ["sideways-scroll-on-phone"], looks_dated: [] });
    expect(v.team).toBe("Acme Air Conditioning");
    expect(teamName("Hilliard's Air Conditioning & Heating Inc.")).toBe("Hilliard's Air");
    const t = loadTemplates().email.find((x: { id: string }) => x.id === "phone-problems");
    const r = fill(t.body, v);
    expect(r.text).toContain("https://kriv.agency/acme-air");
    expect(r.text).toContain("scrolls sideways");
    expect(r.blanks).toEqual(["problem_2", "facts_used"]);
    expect(openBlanks("Subject", r.text)).toEqual(["problem_2", "facts_used"]);
  });

  it("builds a Gmail compose link from hello@kriv.agency with the footer, and sends nothing", () => {
    const u = new URL(gmailComposeUrl({ to: "info@acme.example", subject: "A concept", body: "Hi\n\nKriv" }));
    expect(u.origin + u.pathname).toBe("https://mail.google.com/mail/");
    expect(u.searchParams.get("view")).toBe("cm");
    expect(u.searchParams.get("authuser")).toBe("hello@kriv.agency");
    expect(u.searchParams.get("body")).toBe(`Hi\n\nKriv\n\n${emailFooter()}`);
  });

  it("keeps Gmail closed until the page is live, the blanks are filled and the address may be emailed", () => {
    const db = fresh();
    const id = upsertLead(db, { name: "Acme", state: "FL", email: "info@acme.example" });
    const lead = () => db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
    const mail = { to_addr: "info@acme.example", subject: "A concept", body: "Hi [[owner_first_name]]", status: "draft" };
    expect(emailBlockers(db, lead(), mail).join(" ")).toMatch(/not live.*blanks/);
    db.prepare("UPDATE leads SET status = 'live' WHERE id = ?").run(id);
    expect(emailBlockers(db, lead(), { ...mail, body: "Hi there" })).toEqual([]);
    addOptOut(db, { value: "acme.example" });
    db.prepare("UPDATE leads SET status = 'live' WHERE id = ?").run(id);
    expect(emailBlockers(db, lead(), { ...mail, body: "Hi there" })[0]).toMatch(/do-not-contact/);
    expect(emailBlockers(db, lead(), { ...mail, status: "sent" })[0]).toMatch(/Already sent/);
  });
});

describe("lead desk: build preview", () => {
  const SITE = "https://acmeair.example/";
  const form = () => ({
    slug: "acme-air", template: "hvac-calm", photos: [],
    f: {
      name: { v: "Acme Air", s: SITE }, category: { v: "Heating and air conditioning", s: SITE }, phone: { v: "(352) 555-0100", s: SITE },
      city: { v: "Ocala", s: SITE }, region: { v: "FL", s: SITE }, headline: { v: "Heating and cooling in *Ocala.*", s: SITE }, sub: { v: "Repairs and installs.", s: SITE },
      servicesTitle: { v: "What we do" },
    },
    lists: { services: [{ name: "AC repair", blurb: "Repairs for air conditioners.", s: SITE }], hours: [], custom: [] },
  });

  it("needs a source URL for every fact and writes a record the app's schema accepts", () => {
    const f = form();
    expect(formProblems(f)).toEqual([]);
    f.f.phone.s = "";
    f.lists.services[0].s = "";
    expect(formProblems(f)).toEqual(expect.arrayContaining([expect.stringMatching(/^Phone: add the source URL/), "Services 1: add the source URL"]));
    const rec = toRecord(form(), { createdAt: "2026-10-26" });
    expect(schemaProblems(rec)).toEqual([]);
    expect(rec).toMatchObject({ status: "draft", expiresAt: "2026-11-25", sources: [SITE], business: { phoneE164: "+13525550100" } });
    expect(rec.about).toBeUndefined(); // unknown means absent
    expect(formProblems({ ...form(), slug: "about" })).toContain("Address (slug): that's a kriv.agency page name");
  });

  it("reads listing addresses and suggests short slugs", () => {
    expect(parseAddress("412 Dixie Highway, Auburndale, FL, 33823-2809")).toEqual({ line1: "412 Dixie Highway", city: "Auburndale", region: "FL", postalCode: "33823" });
    expect(suggestSlug("Hilliard's Air Conditioning & Heating Inc.")).toBe("hilliards-air");
    expect(suggestSlug("Chucks Ducts")).toBe("chucks-ducts");
  });

  it("keeps AI help off until it is switched on", () => {
    const db = fresh();
    expect(aiEnabled(db)).toBe(false);
  });
});
