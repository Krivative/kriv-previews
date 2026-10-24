import { describe, expect, it } from "vitest";
import { emailFooter, isOptOut, optOutMailto, SENDER } from "@/outreach/footer";

describe("email footer", () => {
  const footer = emailFooter();

  it("has every CAN-SPAM element", () => {
    expect(footer).toContain(SENDER.postalAddress);
    expect(footer).toContain("business offer");
    expect(footer.toLowerCase()).toContain('reply "unsubscribe"');
    expect(footer).toContain(SENDER.business);
  });

  it("says where KRIV is based", () => {
    expect(footer).toContain("Philippines");
  });

  it("builds an opt-out mailto", () => {
    expect(optOutMailto()).toBe("mailto:hello@kriv.agency?subject=Unsubscribe");
  });
});

describe("opt-out detection", () => {
  it.each(["Unsubscribe", "please remove me", "Not interested, thanks", "STOP emailing us", "Don’t contact us again", "opt-out"])(
    "treats %j as an opt-out",
    (text) => expect(isOptOut(text)).toBe(true),
  );

  it.each(["Looks great, can we talk Tuesday?", "How much would this cost?"])("does not treat %j as an opt-out", (text) =>
    expect(isOptOut(text)).toBe(false),
  );
});
