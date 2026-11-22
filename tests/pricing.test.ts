import { describe, expect, it } from "vitest";
import { markets, pricingRules } from "@/offers/pricing";
import { menuGroups, packageSavings, quoteTotal, quoteWindow, selectionTotal } from "@/offers/pricing-math";

describe("approved pricing catalog", () => {
  it("uses the regular monthly selection as the only annual baseline", () => {
    const { allIn, annualDiscount, paidMonths, windows } = pricingRules.ph;
    const { monthly } = selectionTotal(markets.ph, [...allIn]);
    expect(monthly).toBe(31500);
    const quotes = windows.map((w) => quoteWindow(monthly, paidMonths, w.freeMonths, annualDiscount));
    expect(quotes.map((q) => [q.covered, q.effective, q.percent])).toEqual([
      [15, 18900, 40], [14, 20250, 36], [13, 21808, 31], [12, 23625, 25],
    ]);
    expect(quotes.every((q) => q.annualBaseline === 378000 && q.payment === 283500)).toBe(true);
  });

  it("counts included CRM modules and community management once", () => {
    expect(selectionTotal(markets.ph, ["crm", "pipeline", "video", "community"])).toEqual({ monthly: 23000, setup: 0 });
  });

  it("suggests a package only when it covers every selection and saves money", () => {
    const selection = ["website", "starter", "inbox", "profile"];
    expect(packageSavings(markets.ph, selection, selectionTotal(markets.ph, selection))?.id).toBe("presence");
    const mixed = [...selection, "ads"];
    expect(packageSavings(markets.ph, mixed, selectionTotal(markets.ph, mixed))).toBeUndefined();
    const setupOnly = ["website", "growth", "inbox"];
    expect(packageSavings(markets.us, setupOnly, selectionTotal(markets.us, setupOnly))?.id).toBe("growth");
    const us = ["website", "video", "inbox", "crm", "caller"];
    expect(packageSavings(markets.us, us, selectionTotal(markets.us, us))?.id).toBe("full-business");
  });

  it("prices the 22 November services in both markets", () => {
    const ph = markets.ph.items, us = markets.us.items;
    expect([ph.discordSetup.setup, ph.discord.monthly, ph.email.monthly]).toEqual([10000, 3000, 2500]);
    expect([us.discordSetup.setup, us.discord.monthly, us.email.monthly]).toEqual([1500, 1000, 1000]);
    expect([ph.linkedinMakeover.setup, ph.linkedinContent.monthly, ph.linkedinEngagement.monthly, ph.linkedinPage.monthly]).toEqual([5000, 3500, 3000, 3000]);
    expect([us.linkedinMakeover.setup, us.linkedinContent.monthly, us.linkedinEngagement.monthly, us.linkedinPage.monthly]).toEqual([750, 1000, 1000, 1000]);
    expect([ph.linkedinPresence.monthly, ph.linkedinPresence.worth]).toEqual([8000, 11500]);
  });

  it("includes the makeover setup in LinkedIn Presence and counts its parts once", () => {
    expect(selectionTotal(markets.ph, ["linkedinPresence", "linkedinMakeover", "linkedinContent", "linkedinEngagement"])).toEqual({ monthly: 8000, setup: 0 });
    expect(selectionTotal(markets.ph, ["linkedinMakeover", "linkedinContent"])).toEqual({ monthly: 3500, setup: 5000 });
  });

  it("gives US clients the website with no setup fee", () => {
    expect(markets.us.items.website.setup).toBe(0);
    expect(selectionTotal(markets.us, ["website"]).setup).toBe(0);
  });

  it("keeps the proposed buyout fee unapproved and off the page", () => {
    expect(pricingRules.us.freeWebsite.proposedBuyout.approved).toBe(false);
  });

  it("groups the menu by package, with the new services as add-ons", () => {
    for (const market of [markets.ph, markets.us]) {
      const groups = menuGroups(market);
      expect(groups.flatMap((g) => g.ids).sort()).toEqual(Object.keys(market.items).sort());
      expect(groups.find((g) => g.title === "LinkedIn add-ons")?.ids).toContain("linkedinContent");
      expect(groups.find((g) => g.title === "Discord add-ons")?.ids).toEqual(["discordSetup", "discord"]);
      expect(groups.find((g) => g.title === "Email add-ons")?.ids).toEqual(["email"]);
      expect(groups[0].packageId).toBe(market.packages[0].id);
    }
  });

  it("adds add-ons on top of a package and never charges twice for what it covers", () => {
    const growth = markets.ph.packages.find((p) => p.id === "growth")!;
    expect(quoteTotal(markets.ph, growth, [])).toEqual({ monthly: 12500, setup: 0 });
    expect(quoteTotal(markets.ph, growth, ["website", "linkedinContent", "discordSetup"])).toEqual({ monthly: 16000, setup: 10000 });
    expect(quoteTotal(markets.ph, growth, ["viber"])).toEqual({ monthly: 13500, setup: 0 });
    const full = markets.us.packages.find((p) => p.id === "full-business")!;
    expect(quoteTotal(markets.us, full, ["linkedinMakeover", "email"])).toEqual({ monthly: 13500, setup: 10750 });
    expect(quoteTotal(markets.ph, undefined, ["website"])).toEqual(selectionTotal(markets.ph, ["website"]));
  });
});
