// ChamberMaster member directories that automatic building works through, two a day, after the
// daily Hotfrog search (Kriv, 2026-10-28). Each was checked once from this network on 2026-10-28:
// it loaded and listed categories for the six niches. Public directory addresses only.
export const CHAMBERS = [
  { list: "https://greatermagnoliaparkwaychamber.chambermaster.com/list/", state: "TX", town: "Magnolia" },
  { list: "https://business.seminolebusiness.org/list/", state: "FL", town: "Sanford" },
  { list: "https://lubbockchambertx.chambermaster.com/list/", state: "TX", town: "Lubbock" },
  { list: "https://slchamber.chambermaster.com/list/", state: "UT", town: "Salt Lake City" },
  { list: "https://puntagordachamber.chambermaster.com/list/", state: "FL", town: "Punta Gorda" },
  { list: "https://beaumont.chambermaster.com/list/", state: "TX", town: "Beaumont" },
  { list: "https://www.fwbchamber.org/list/", state: "FL", town: "Fort Walton Beach" },
  { list: "https://georgetownchambertx.chambermaster.com/list/", state: "TX", town: "Georgetown" },
  { list: "https://northportchamber.chambermaster.com/list/", state: "FL", town: "North Port" },
  { list: "https://greenvillechambertx.chambermaster.com/list/", state: "TX", town: "Greenville" },
  { list: "https://sebastianchamberfl.chambermaster.com/list/", state: "FL", town: "Sebastian" },
  { list: "https://sandychamber.chambermaster.com/list/", state: "UT", town: "Sandy" },
  { list: "https://venicechamberfl.chambermaster.com/list/", state: "FL", town: "Venice" },
  { list: "https://portlandtx.chambermaster.com/list/", state: "TX", town: "Portland" },
  { list: "https://chamber.hollywoodchamber.org/list/", state: "FL", town: "Hollywood" },
  { list: "https://angletonchamber.chambermaster.com/list/", state: "TX", town: "Angleton" },
];
export const CHAMBERS_PER_DAY = 2;

/** [state, town] for a member listing from one of these directories; the member's own town when its address has one. */
export function chamberWhere(listingUrl, address = "") {
  const c = CHAMBERS.find((x) => new URL(x.list).origin === new URL(listingUrl).origin);
  if (!c) return undefined;
  const town = String(address).split(", ")[1]?.replace(/\s*\d{5}(-\d{4})?\s*$/, "").trim();
  return [c.state, town || c.town];
}
