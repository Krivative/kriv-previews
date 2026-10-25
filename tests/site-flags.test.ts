import { describe, expect, it } from "vitest";
import { emailsIn, flagsFor, isBusinessMailbox, isRoleEmail } from "../scripts/site-flags.mjs";

const now = new Date("2026-10-24T00:00:00Z");
const good = { status: 200, https: true, viewportMeta: true, overflowPx: 0, copyrightYear: 2026, loadMs: 2000, title: "Acme Dental", textLength: 3000 };

describe("website flags", () => {
  it("passes a modern site", () => {
    expect(flagsFor(good, now)).toEqual({ flags: [], weak: false });
  });

  it("calls an unreachable site weak", () => {
    expect(flagsFor({ error: "net::ERR_NAME_NOT_RESOLVED" }, now)).toEqual({ flags: ["unreachable"], weak: true });
  });

  it.each([
    [{ status: 403, title: "Just a moment...", textLength: 270 }],
    [{ status: 418, title: "Country Blocked", textLength: 50 }],
    [{ status: 202, title: "", textLength: 0 }],
    [{ status: 200, title: "Checking your browser...", textLength: 0 }],
    [{ error: "page.goto: Timeout 30000ms exceeded." }],
    [{ error: "page.goto: net::ERR_CONNECTION_TIMED_OUT at https://slow.example/" }],
    [{ status: 200, error: "page.evaluate: Execution context was destroyed, most likely because of a navigation" }],
  ])("never calls a bot wall, geo-block or failed check weak: %j", (r) => {
    expect(flagsFor(r, now)).toEqual({ flags: ["not-checked"], weak: false });
  });

  it("still calls a dead domain or a missing page unreachable", () => {
    expect(flagsFor({ status: 404, title: "404 Not Found" }, now).flags).toEqual(["unreachable"]);
    expect(flagsFor({ error: "net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH" }, now).weak).toBe(true);
  });

  it.each([
    [{ https: false }, "no-https"],
    [{ viewportMeta: false }, "no-mobile-viewport"],
    [{ overflowPx: 300 }, "sideways-scroll-on-phone"],
    [{ title: "This domain is for sale" }, "placeholder-or-empty"],
    [{ title: "AireSmith.com is for sale | HugeDomains" }, "placeholder-or-empty"],
    [{ title: "Squarespace - Website Expired" }, "placeholder-or-empty"],
  ])("one strong signal is enough: %j", (patch, flag) => {
    const r = flagsFor({ ...good, ...patch }, now);
    expect(r.flags).toContain(flag);
    expect(r.weak).toBe(true);
  });

  it("needs two minor signals", () => {
    expect(flagsFor({ ...good, copyrightYear: 2021 }, now)).toEqual({ flags: ["copyright-2021"], weak: false });
    expect(flagsFor({ ...good, copyrightYear: 2021, loadMs: 9000 }, now).weak).toBe(true);
  });

  it("does not flag a copyright from two years ago", () => {
    expect(flagsFor({ ...good, copyrightYear: 2024 }, now).flags).toEqual([]);
  });
});

describe("emails", () => {
  it("finds mailto and text addresses and drops builder and image noise", () => {
    const html = 'Call or write to Info@AcmeDental.com. <img src="logo@2x.png"> errors@sentry.io';
    expect(emailsIn(html, [{ href: "mailto:frontdesk@acmedental.com?subject=Hi" }]).sort()).toEqual([
      "frontdesk@acmedental.com",
      "info@acmedental.com",
    ]);
  });

  it("tells business mailboxes from personal ones", () => {
    expect(isRoleEmail("info@acmedental.com")).toBe(true);
    expect(isRoleEmail("appointments@acme.com")).toBe(true);
    expect(isRoleEmail("jane.smith@acme.com")).toBe(false);
    expect(isRoleEmail("drjones@gmail.com")).toBe(false);
  });

  // Fictional businesses and addresses only: real lead emails never go into Git.
  it("counts a mailbox named after the business or on its own domain, never a person's elsewhere", () => {
    const acme = { name: "Acme Dental", website: "https://www.acmedental.example/" };
    expect(isBusinessMailbox("acmedental@gmail.example", acme)).toBe(true);
    expect(isBusinessMailbox("acme@mail.example", acme)).toBe(true);
    expect(isBusinessMailbox("frontdesk@gmail.example", acme)).toBe(true);
    expect(isBusinessMailbox("bramley@bramley-ac.example", { name: "Bramley Air Conditioning Co.", website: "https://bramley-ac.example/" })).toBe(true);
    expect(isBusinessMailbox("jdoe@coolsmith.example", { name: "Coolsmith Inc", website: "https://www.coolsmith.example/" })).toBe(true);
    expect(isBusinessMailbox("jdoe@othersite.example", { name: "Coolsmith Inc", website: "https://www.coolsmith.example/" })).toBe(false);
    expect(isBusinessMailbox("jdoe@gmail.example", { name: "Coolsmith Inc", website: "https://www.coolsmith.example/" })).toBe(true);
    expect(isBusinessMailbox("maria.lopez@gmail.example", acme)).toBe(false);
    expect(isBusinessMailbox("maria_lopez@aol.example", acme)).toBe(false);
    // Any other free-mail address the business publishes counts (Kriv, 2026-10-25).
    expect(isBusinessMailbox("dentalmaria@gmail.example", acme)).toBe(true);
    expect(isBusinessMailbox("xqz123@gmail.example", { name: "Best Price Air Conditioning And Heating" })).toBe(true);
    expect(isBusinessMailbox("jdoe77@bellsouth.example", acme)).toBe(true);
    expect(isBusinessMailbox("jdoe@othersite.example", acme)).toBe(false);
  });
});
