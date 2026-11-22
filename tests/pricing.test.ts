import { describe, expect, it } from "vitest";
import { markets, pricingRules } from "@/offers/pricing";
import { packageSavings, quoteWindow, selectionTotal } from "@/offers/pricing-math";

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
    const us = ["website", "video", "inbox", "crm", "caller"];
    expect(packageSavings(markets.us, us, selectionTotal(markets.us, us))?.id).toBe("full-business");
  });
});
