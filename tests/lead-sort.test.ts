import { describe, expect, it } from "vitest";
import { sortLeads, timeZoneOf, utcOffset, localTime, SORTS } from "../lead-desk/public/lead-sort.js";

const at = new Date("2026-11-03T04:45:00Z"); // Mon 11:45 pm Eastern, after DST ended
const row = (name: string, state: string, town = "", extra = {}) => ({ name, state, town, priority: 1, updatedAt: "2026-11-01", completedSteps: 1, totalSteps: 6, ...extra });

describe("inbox sorting", () => {
  it("knows each lead's time zone, including towns that differ from their state", () => {
    expect(timeZoneOf("TX", "Austin")).toBe("America/Chicago");
    expect(timeZoneOf("TX", "El Paso")).toBe("America/Denver");
    expect(timeZoneOf("FL", "Panama City")).toBe("America/Chicago");
    expect(timeZoneOf("on", "Burlington")).toBe("America/Toronto");
    expect(timeZoneOf("", "")).toBeNull();
    expect(utcOffset("America/New_York", at)).toBe(-300);
    expect(utcOffset("America/Phoenix", at)).toBe(-420);
    expect(localTime("America/New_York", at)).toBe("Mon 11:45 PM");
  });

  it("orders east to west and back, unknown zones last", () => {
    const rows = [row("LA", "CA"), row("Unknown", ""), row("Dublin", "OH"), row("Austin", "TX"), row("Chandler", "AZ")];
    expect(sortLeads(rows, "eastfirst", { at }).map((r) => r.name)).toEqual(["Dublin", "Austin", "Chandler", "LA", "Unknown"]);
    expect(sortLeads(rows, "westfirst", { at }).map((r) => r.name)).toEqual(["LA", "Chandler", "Austin", "Dublin", "Unknown"]);
  });

  it("puts the leads closest to sending first and supports the other orders", () => {
    const rows = [row("B", "TX", "Waco", { completedSteps: 2, createdAt: "2026-10-01" }), row("A", "AZ", "Chandler", { completedSteps: 5, createdAt: "2026-11-02" }), row("C", "AB", "", { createdAt: "2026-10-20" })];
    expect(sortLeads(rows, "closest").map((r) => r.name)).toEqual(["A", "B", "C"]);
    expect(sortLeads(rows, "newest").map((r) => r.name)).toEqual(["A", "C", "B"]);
    expect(sortLeads(rows, "location").map((r) => r.name)).toEqual(["C", "A", "B"]);
    expect(sortLeads(rows, "namedesc").map((r) => r.name)).toEqual(["C", "B", "A"]);
    expect(sortLeads(rows, "nonsense").map((r) => r.name)).toHaveLength(3);
    expect(rows.map((r) => r.name)).toEqual(["B", "A", "C"]); // input untouched
    expect(new Set(SORTS.map(([k]) => k)).size).toBe(SORTS.length);
  });
});
