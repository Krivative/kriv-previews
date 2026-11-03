/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- exercises the JavaScript Desk modules; fictional businesses and addresses only.
import { describe, it, expect } from "vitest";
import { countryFor, parseAddress, toRecord, PROVINCES } from "../lead-desk/lib/builder.mjs";
import { CHAMBERS, RETIRED_CHAMBERS, chamberWhere } from "../lead-desk/lib/chambers.mjs";
import { hasNoSolicitationNotice } from "../scripts/site-flags.mjs";
import { classify } from "../scripts/finder/rules.mjs";
import { cityLine, addressText } from "../src/lib/us-format";
import { emailFooter } from "../src/outreach/footer";
import { openDb } from "../lead-desk/lib/db.mjs";
import { upsertLead } from "../lead-desk/lib/leads.mjs";
import { contactHold } from "../lead-desk/lib/sales.mjs";

describe("Canada (Kriv, 2026-11-02)", () => {
  it("knows provinces from US states, keeping CA as California", () => {
    expect(countryFor("ON")).toBe("CA");
    expect(countryFor("bc")).toBe("CA");
    expect(countryFor("CA")).toBe("US");
    expect(countryFor("TX")).toBe("US");
    expect(countryFor(undefined)).toBe("US");
    expect(PROVINCES.size).toBe(13);
  });

  it("reads a Canadian postal code and province from an address", () => {
    expect(parseAddress("100 Example Rd, Burlington, ON L7R 1A1")).toEqual({ postalCode: "L7R 1A1", region: "ON", line1: "100 Example Rd", city: "Burlington" });
    expect(parseAddress("5 Sample St, Langley, BC, v3a4b5")).toMatchObject({ postalCode: "V3A 4B5", region: "BC", city: "Langley" });
    expect(parseAddress("412 Dixie Hwy, Auburndale, FL 33823")).toMatchObject({ postalCode: "33823", region: "FL" });
  });

  it("builds Canadian previews as en-CA with country CA and a Canadian address line", () => {
    const form = { slug: "example-air", template: "hvac-calm", contentNiche: "hvac", country: "CA", f: { name: { v: "Example Air" }, city: { v: "Burlington" }, region: { v: "ON" }, postalCode: { v: "L7R 1A1" } }, lists: {}, photos: [] };
    const rec = toRecord(form);
    expect(rec.lang).toBe("en-CA");
    expect(rec.business.address.country).toBe("CA");
    expect(toRecord({ ...form, country: undefined }).business.address.country).toBe("CA");
    expect(toRecord({ ...form, country: undefined, f: { ...form.f, region: { v: "TX" } } }).lang).toBe("en-US");
    expect(cityLine(rec.business.address)).toBe("Burlington, ON L7R 1A1");
    expect(addressText({ line1: "1 Example Rd", city: "Langley", region: "BC", postalCode: "V3A 4B5", country: "CA" })).toBe("1 Example Rd, Langley, BC V3A 4B5");
  });

  it("puts the wealthier-suburb and Canadian directories first and keeps retired ones for old finds", () => {
    expect(CHAMBERS[0].town).toBe("Plano");
    expect(CHAMBERS.slice(0, 25).filter((c) => PROVINCES.has(c.state))).toHaveLength(10); // Burlington turned out to be Washington (2026-11-03)
    for (const c of RETIRED_CHAMBERS) expect(CHAMBERS.map((x) => x.list)).not.toContain(c.list);
    expect(chamberWhere("https://polkgeorgia.chambermaster.com/list/member/example-1", "")).toEqual(["GA", "Cedartown"]);
    expect(chamberWhere("https://burlingtonchamber.chambermaster.com/list/member/example-2", "")).toEqual(["WA", "Burlington"]);
    expect(chamberWhere("https://burlingtonchamber.chambermaster.com/list/member/example-2", "15066 Example Rd, Burlington 98233")).toEqual(["WA", "Burlington"]);
    expect(chamberWhere("https://business.langleychamber.com/list/member/example-3", "5 Sample St, Langley BC V3A 4B5")).toEqual(["BC", "Langley"]);
  });

  it("calls KRIV a web and marketing studio in every footer", () => {
    expect(emailFooter()).toContain("a web and marketing studio in the Philippines");
  });
});

describe("no unsolicited email notices (CASL, applied everywhere)", () => {
  it.each([
    "We do not accept unsolicited commercial electronic messages.",
    "No unsolicited emails, please.",
    "This address does not consent to receive unsolicited email.",
    "Unsolicited offers are not accepted.",
    "NO SOLICITATION",
    "Please, no soliciting.",
  ])("recognizes %s", (text) => {
    expect(hasNoSolicitationNotice(text)).toBe(true);
  });

  it.each([
    "Contact us for a free estimate.",
    "We never send unsolicited mail to our customers.",
    "Email us at any time. Solicitors welcome to call our office.",
    "",
  ])("does not flag %s", (text) => {
    expect(hasNoSolicitationNotice(text)).toBe(false);
  });

  it("never qualifies or offers a business whose site asks for no unsolicited email", async () => {
    const website = "https://example-dental.example/";
    const check = { status: 200, https: true, viewportMeta: false, flags: ["no-mobile-viewport"], weak: true, emails: ["info@example-dental.example"], finalUrl: website, noSolicitation: true };
    const r = await classify({ name: "Example Dental", niche: "dental", state: "ON", town: "Burlington", website, emailsListing: [] }, { checks: new Map([["example-dental.example", check]]), hasMx: async () => true });
    expect(r.bucket).toBe("none");
    expect(r.rec.why).toMatch(/unsolicited/);
    const db = openDb(":memory:");
    const id = upsertLead(db, { name: "Example Dental", website, email: "info@example-dental.example" }, { bucket: "qualified" });
    expect(contactHold(db, db.prepare("SELECT * FROM leads WHERE id = ?").get(id))).toBe("");
    db.prepare("INSERT INTO checks (host, data, checked_at) VALUES (?, ?, ?)").run("example-dental.example", JSON.stringify(check), new Date().toISOString());
    expect(contactHold(db, db.prepare("SELECT * FROM leads WHERE id = ?").get(id))).toMatch(/asks not to receive unsolicited email/);
    db.close();
  });
});
