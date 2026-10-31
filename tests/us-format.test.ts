import { describe, it, expect } from "vitest";
import { addressText, cityLine, phoneText } from "../src/lib/us-format";

describe("US-ready display formats", () => {
  it("writes US addresses as City, ST ZIP", () => {
    const a = { line1: "100 Main St", city: "Austin", region: "TX", postalCode: "78701", country: "US" };
    expect(cityLine(a)).toBe("Austin, TX 78701");
    expect(addressText(a)).toBe("100 Main St, Austin, TX 78701");
    expect(addressText({ city: "Sherman", region: "TX", country: "US" })).toBe("Sherman, TX");
  });
  it("keeps other countries in their own comma-separated order", () => {
    expect(addressText({ line1: "1 Rizal Ave", city: "Cebu City", region: "Cebu", postalCode: "6000", country: "PH" })).toBe("1 Rizal Ave, Cebu City, Cebu, 6000");
  });
  it("prefers the business's own phone wording and formats US numbers", () => {
    expect(phoneText({ phoneDisplay: "210-555-0100", phoneE164: "+12105550100" })).toBe("210-555-0100");
    expect(phoneText({ phoneE164: "+12105550100" })).toBe("(210) 555-0100");
    expect(phoneText({ phoneE164: "+639171234567" })).toBe("+639171234567");
    expect(phoneText({})).toBe("");
  });
});
