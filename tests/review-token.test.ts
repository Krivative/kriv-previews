import { describe, it, expect } from "vitest";
import { createReviewToken, verifyReviewToken, MAX_DAYS } from "../src/lib/review-token";

const secret = "x".repeat(40), today = "2026-11-01";
describe("private review tokens", () => {
  it("verifies only for the signed slug, through its end date", () => {
    const t = createReviewToken("happy-hvac", { secret, today, days: 3 });
    expect(t.startsWith("2026-11-04.")).toBe(true);
    expect(verifyReviewToken("happy-hvac", t, { secret, today })).toBe(true);
    expect(verifyReviewToken("HAPPY-HVAC", t, { secret, today: "2026-11-04" })).toBe(true);
    expect(verifyReviewToken("happy-hvac", t, { secret, today: "2026-11-05" })).toBe(false);
    expect(verifyReviewToken("other-lead", t, { secret, today })).toBe(false);
    expect(verifyReviewToken("happy-hvac", t, { secret: "y".repeat(40), today })).toBe(false);
  });
  it("rejects tampering, malformed input and dates beyond the cap", () => {
    const t = createReviewToken("happy-hvac", { secret, today });
    expect(verifyReviewToken("happy-hvac", "2026-12-31" + t.slice(10), { secret, today })).toBe(false);
    expect(verifyReviewToken("happy-hvac", t.slice(0, -1) + (t.endsWith("A") ? "B" : "A"), { secret, today })).toBe(false);
    for (const bad of [undefined, null, "", "nope", t + "x", "x".repeat(200)]) expect(verifyReviewToken("happy-hvac", bad, { secret, today })).toBe(false);
    expect(createReviewToken("a", { secret, today, days: 99 }).slice(0, 10)).toBe("2026-11-15");
    expect(MAX_DAYS).toBe(14);
  });
  it("is off without a strong secret", () => {
    expect(() => createReviewToken("a", { secret: "short", today })).toThrow(/PREVIEW_REVIEW_SECRET/);
    const t = createReviewToken("a", { secret, today });
    expect(verifyReviewToken("a", t, { secret: "", today })).toBe(false);
  });
});
