/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- exercises the JavaScript Desk modules with SQLite fixtures (fictional businesses only).
import { describe, it, expect, afterEach } from "vitest";
import { openDb, now } from "../lead-desk/lib/db.mjs";
import { upsertLead, addSource } from "../lead-desk/lib/leads.mjs";
import { SERVICES, SERVICE, OFFERS, serviceFindings, alsoLine } from "../lead-desk/lib/services.mjs";
import { saveResearch, starterDraft, recommendOffer, discoverList, discoverResearch, validateDraft, EVIDENCE_TYPES } from "../lead-desk/lib/sales.mjs";
import { draftPrompt } from "../lead-desk/lib/harvey-runtime.mjs";
import { sitesForSalesRefresh } from "../lead-desk/lib/automation.mjs";

const databases = [];
afterEach(() => { for (const db of databases.splice(0)) db.close(); });
const modern = { status: 200, title: "Example Studio | Hair salon in Ocala", metaDescription: true, socialLinks: ["instagram.com"], bookingLinks: ["vagaro.com"] };
const fact = (type, id = `fact-${type}`) => ({ id, type, claim: "A reviewed fictional observation.", url: "https://example-studio.example", observedAt: now(), confirmed: true });

function business(db, { niche = "salon", bucket = "toReview", check = modern } = {}) {
  const id = upsertLead(db, { name: "Example Studio", state: "FL", niche, website: "https://example-studio.example", email: "hello@example-studio.example", flags: [], checkedAt: now() }, { bucket });
  addSource(db, id, "listing", "https://example-studio.example");
  if (check) db.prepare("INSERT INTO checks (host, data, checked_at) VALUES (?, ?, ?)").run("example-studio.example", JSON.stringify(check), now());
  return id;
}

describe("Kriv.Agency services as offers (Kriv, 2026-11-01)", () => {
  it("offers every service, keeps the original ids and requires known evidence types", () => {
    expect(Object.keys(OFFERS)).toEqual(expect.arrayContaining(["website", "build", "discovery", "seo", "ads", "smm", "social", "maintenance", "assistant", "outsourcing"]));
    for (const s of SERVICES) {
      expect(s.label && s.pitch && s.question).toBeTruthy();
      for (const t of s.needs ?? []) expect(EVIDENCE_TYPES[t], `${s.id} needs ${t}`).toBeTruthy();
      expect(s.pitch).not.toMatch(/\$|\d+%|guarantee/i);
    }
    expect(SERVICE.smm.pitch).toMatch(/long-form videos, commercials, 3 to 5 short videos and 3 to 10 image or carousel posts/);
  });

  it("finds nothing extra on a site that already links social profiles, describes itself and links booking", () => {
    expect(serviceFindings(modern, "salon")).toEqual([]);
  });

  it("turns missing social links, search description, placeholder title and booking link into observations", () => {
    const f = serviceFindings({ status: 200, title: "Home", metaDescription: false, socialLinks: [], bookingLinks: [] }, "salon");
    expect(f.map((x) => x.type)).toEqual(["social_gap", "search_gap", "search_gap", "booking_gap"]);
    expect(f[2].claim).toContain('"Home"');
  });

  it("asks about booking only for appointment businesses, and says nothing from older checks or failed loads", () => {
    const gaps = { status: 200, title: "Roofing in Ocala", metaDescription: true, socialLinks: [], bookingLinks: [] };
    expect(serviceFindings(gaps, "roofing").map((x) => x.type)).toEqual(["social_gap"]);
    expect(serviceFindings({ status: 200, title: "Old check", bookingLinks: [] }, "dental")).toEqual([]);
    expect(serviceFindings({ ...gaps, status: 500 }, "salon")).toEqual([]);
    expect(serviceFindings({ ...gaps, error: "net::ERR_NAME_NOT_RESOLVED" }, "salon")).toEqual([]);
    expect(serviceFindings(null, "salon")).toEqual([]);
  });

  it("recommends websites first, then booking, social media and search, and lists the other fits", () => {
    expect(recommendOffer([fact("website_issue"), fact("social_gap")])).toMatchObject({ offer: "website", also: ["Social media marketing", "Social media management"] });
    expect(recommendOffer([fact("booking_gap")]).offer).toBe("build");
    expect(recommendOffer([fact("social_gap"), fact("search_gap")])).toMatchObject({ offer: "smm", also: ["Social media management", "SEO (local search)"] });
    expect(recommendOffer([fact("search_gap")]).offer).toBe("seo");
    expect(recommendOffer([fact("observation")])).toMatchObject({ offer: "discovery", also: [] });
    expect(recommendOffer([{ ...fact("social_gap"), confirmed: false }]).offer).toBe("discovery");
  });
});

describe("modern-site businesses in Discover", () => {
  it("lists a modern site with a social gap and starts research with unconfirmed social and search findings", () => {
    const db = openDb(":memory:"); databases.push(db);
    const id = business(db, { check: { ...modern, socialLinks: [], metaDescription: false } });
    const list = discoverList(db, { bucket: "toReview" });
    expect(list.items.map((i) => i.id)).toEqual([id]);
    const detail = discoverResearch(db, id, null);
    expect(detail.evidence.map((e) => [e.type, e.confirmed])).toEqual([["social_gap", false], ["search_gap", false]]);
    expect(detail.recommendation.offer).toBe("discovery");
  });

  it("leaves a modern site with no gaps out of Discover", () => {
    const db = openDb(":memory:"); databases.push(db);
    business(db);
    expect(discoverList(db, { bucket: "toReview" }).items).toEqual([]);
  });
});

describe("drafts for each service", () => {
  it("requires the matching reviewed evidence before drafting SEO or social media offers", () => {
    const db = openDb(":memory:"); databases.push(db);
    const id = business(db);
    saveResearch(db, id, { expectedRevision: 0, offer: "seo", evidence: [fact("social_gap")] });
    expect(() => starterDraft(db, id, 1)).toThrow(/SEO \(local search\) offer needs a reviewed search visibility observation/);
    saveResearch(db, id, { expectedRevision: 1, offer: "ads", evidence: [fact("social_gap")] });
    expect(starterDraft(db, id, 2).draft.provider).toBe("template");
  });

  it.each(SERVICES.map((s) => s.id))("writes a valid plain starter draft for %s that cites the fitting evidence", (offer) => {
    const db = openDb(":memory:"); databases.push(db);
    const id = business(db);
    const needs = SERVICE[offer].needs ?? ["observation"];
    const evidence = [fact("observation", "general"), fact(needs[0], "fit")];
    saveResearch(db, id, { expectedRevision: 0, offer, evidence });
    const { draft } = starterDraft(db, id, 1);
    expect(draft.body).toContain(SERVICE[offer].question);
    expect(draft.body).toContain("Kriv.Agency also helps local businesses with");
    expect(draft.evidenceIds).toEqual([needs[0] === "observation" ? "general" : "fit"]);
    expect(() => validateDraft({ subject: draft.subject, body: draft.body, evidenceIds: draft.evidenceIds }, evidence)).not.toThrow();
  });

  it("never names the selected service twice in the also line", () => {
    expect(alsoLine("seo")).toBe("Kriv.Agency also helps local businesses with websites, ads and social media content.");
    expect(alsoLine("assistant")).toBe("Kriv.Agency also helps local businesses with websites, SEO, ads and social media content.");
  });

  it("tells Claude what the selected service is and to lead with it", () => {
    const p = draftPrompt({ name: "Example Studio", offer: "smm", evidence: [fact("social_gap")] });
    expect(p).toContain("Selected offer: Social media marketing: producing social content each week");
    expect(p).toContain("Lead with this offer only");
  });
});

describe("re-checking older checks for the new facts", () => {
  it("picks open businesses whose check predates social links, modern sites first, and skips sent ones", () => {
    const db = openDb(":memory:"); databases.push(db);
    const put = (name, bucket, data, status = "found") => {
      const host = `${name}.example`;
      const id = upsertLead(db, { name, website: `https://${host}`, email: `info@${host}` }, { bucket });
      db.prepare("UPDATE leads SET status = ? WHERE id = ?").run(status, id);
      db.prepare("INSERT INTO checks (host, data, checked_at) VALUES (?, ?, ?)").run(host, JSON.stringify(data), now());
    };
    put("near-one", "near", { status: 200 });
    put("modern-one", "toReview", { status: 200 });
    put("fresh-one", "toReview", { status: 200, socialLinks: [] });
    put("dead-one", "toReview", { error: "net::ERR_NAME_NOT_RESOLVED" });
    put("sent-one", "qualified", { status: 200 }, "sent");
    expect(sitesForSalesRefresh(db)).toEqual(["https://modern-one.example", "https://near-one.example"]);
  });
});
