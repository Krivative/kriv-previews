import { describe, expect, it } from "vitest";
import { emailsIn, flagsFor, isRoleEmail } from "../scripts/site-flags.mjs";

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
    [{ https: false }, "no-https"],
    [{ viewportMeta: false }, "no-mobile-viewport"],
    [{ overflowPx: 300 }, "sideways-scroll-on-phone"],
    [{ title: "This domain is for sale" }, "placeholder-or-empty"],
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
});
