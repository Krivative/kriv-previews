import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkLead, draftOffer, offerPlans, summarise } from "../scripts/lib/offer-ready.mjs";

// "Offer-ready": a client could be sent the link today and find a truthful site and an offer
// written for their market. The check works on any lead record, whatever its template or style.

const today = "2026-11-17";
const ph = { slug: "a-shop", status: "approved", expiresAt: "2026-12-17", template: "cafe-01", sources: ["https://example.com/"], business: { name: "A Shop", phone: "0900 000 0000", address: { country: "PH" } }, offer: { plan: "ph-local", quoteNumber: "Q1", quoteDate: today, validUntil: "2026-12-17" } };

describe("offer-ready: one lead", () => {
  it("passes a complete Philippine lead, whatever its template or story", () => {
    expect(checkLead(ph, today)).toMatchObject({ ready: true, blockers: [] });
    expect(checkLead({ ...ph, template: "hvac-02" }, today).ready).toBe(true);
    expect(checkLead({ ...ph, story: "sneaker-journey", storyStyle: { audience: "adults" } }, today)).toMatchObject({ ready: true, warnings: [] });
  });
  it("blocks placeholders, drafts, expired links and run-out quotations", () => {
    expect(checkLead({ ...ph, hero: { sub: "Open [OPENING HOURS]" } }, today).blockers.join(" ")).toContain("placeholder");
    expect(checkLead({ ...ph, status: "draft" }, today).ready).toBe(false);
    expect(checkLead({ ...ph, expiresAt: "2026-11-01" }, today).blockers.join(" ")).toContain("expired");
    expect(checkLead({ ...ph, offer: { ...ph.offer, validUntil: "2026-11-10" } }, today).blockers.join(" ")).toContain("ran out");
    expect(checkLead({ ...ph, sources: [] }, today).ready).toBe(false);
  });
  it("never lets one market's prices stand in for another's", () => {
    const us = { ...ph, business: { ...ph.business, address: { country: "US" } } };
    expect(checkLead(us, today).blockers.join(" ")).toContain("written for PH");
    // A market with no price plan gets the price-free offer, never another market's prices.
    expect(checkLead({ ...us, offer: undefined }, today).blockers.join(" ")).toContain('"us-pricing" plan fits US');
    expect(draftOffer(us, today, "Q2")).toMatchObject({ plan: "us-pricing", catalogVersion: "2026-11-22" });
    const ca = { ...us, business: { ...us.business, address: { country: "CA" } } };
    expect(draftOffer(ca, today, "Q3")).toMatchObject({ plan: "consult-first" });
    expect(checkLead({ ...us, offer: draftOffer(us, today, "Q2") }, today).ready).toBe(true);
    // And a market that has prices does not hide behind the price-free page.
    expect(checkLead({ ...ph, offer: { ...ph.offer, plan: "consult-first" } }, today).blockers.join(" ")).toContain("has its own price plan");
    expect(draftOffer({ business: {} }, today, "Q0")).toBeNull();
    expect(checkLead({ ...ph, offer: undefined }, today).blockers.join(" ")).toContain("--add");
  });
  it("drafts a quotation only for a market with a plan, valid no longer than the preview", () => {
    expect(draftOffer({ ...ph, offer: undefined }, today, "Q3")).toEqual({ plan: "ph-local", catalogVersion: "2026-11-22", quoteNumber: "Q3", quoteDate: today, validUntil: "2026-12-17" });
    expect(draftOffer({ ...ph, expiresAt: "2026-11-30" }, today, "Q4")!.validUntil).toBe("2026-11-30");
    expect(Object.keys(offerPlans)).toEqual(["ph-local", "us-pricing", "consult-first"]);
  });
  it("warns, without blocking, when a story has no audience or its cast is still a draft", () => {
    const story = { ...ph, story: "dental-journey" };
    expect(checkLead(story, today).warnings.join(" ")).toContain("audience");
    expect(checkLead(story, today, { castDraft: true }).warnings.join(" ")).toContain("drafts");
    expect(checkLead({ ...story, storyStyle: { audience: "adults" } }, today, { castDraft: true }).warnings).toEqual([]);
    expect(checkLead(story, today, { missingAudio: ["/audio/x.mp3"] }).ready).toBe(false);
  });
});

describe("offer-ready: every lead in the repository", () => {
  const leads = readdirSync(path.join(process.cwd(), "leads")).filter((f) => f.endsWith(".json") && !f.startsWith("test-")).map((f) => JSON.parse(readFileSync(path.join(process.cwd(), "leads", f), "utf8")));
  it("checks all of them without throwing, and groups what holds them back", () => {
    const sum = summarise(leads.map((l) => checkLead(l, today)));
    expect(sum.total).toBe(leads.length);
    expect(sum.ready).toBeLessThanOrEqual(sum.total);
    for (const [why, count] of sum.blockers) { expect(typeof why).toBe("string"); expect(count).toBeGreaterThan(0); }
  });
});

describe("the workflow: a new session starts small", () => {
  it("is pointed at a short state file, not the whole history", () => {
    const rules = readFileSync(path.join(process.cwd(), "CLAUDE.md"), "utf8");
    expect(rules).toMatch(/^Read STATE\.md before any work/);
    expect(rules).toContain("never read it whole");
    expect(statSync(path.join(process.cwd(), "STATE.md")).size).toBeLessThan(6000);
    expect(readFileSync(path.join(process.cwd(), "STATE.md"), "utf8").split("\n").length).toBeLessThanOrEqual(80);
  });
});
