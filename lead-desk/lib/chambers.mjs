// ChamberMaster member directories that automatic building works through, six a day (two until 2026-11-01), after the
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
  // Added 2026-11-01 for the wider business types: each loaded once from this network and listed
  // categories for at least seven of them (lead-desk/public/niches.js).
  { list: "https://claytonga.chambermaster.com/list/", state: "GA", town: "Morrow" },
  { list: "https://polkgeorgia.chambermaster.com/list/", state: "GA", town: "Cedartown" },
  { list: "https://hart-countyga.chambermaster.com/list/", state: "GA", town: "Hartwell" },
  { list: "https://blairsvilleunionchamber.chambermaster.com/list/", state: "GA", town: "Blairsville" },
  { list: "https://pickenscountychamber.chambermaster.com/list/", state: "GA", town: "Jasper" },
  { list: "https://thomasvillechamber.chambermaster.com/list/", state: "NC", town: "Thomasville" },
  { list: "https://rvchambernc.chambermaster.com/list/", state: "NC", town: "Roanoke Rapids" },
  { list: "https://granville-chamber.chambermaster.com/list/", state: "NC", town: "Oxford" },
  { list: "https://hendersoncountync.chambermaster.com/list/", state: "NC", town: "Hendersonville" },
  { list: "https://cherokeechamber.chambermaster.com/list/", state: "SC", town: "Gaffney" },
  { list: "https://whitehousechamber.chambermaster.com/list/", state: "TN", town: "White House" },
  { list: "https://warrentn.chambermaster.com/list/", state: "TN", town: "McMinnville" },
  { list: "https://shoalschamberal.chambermaster.com/list/", state: "AL", town: "Florence" },
  { list: "https://chiltoncountychamberal.chambermaster.com/list/", state: "AL", town: "Clanton" },
  { list: "https://greatervalleyarea.chambermaster.com/list/", state: "AL", town: "Valley" },
  { list: "https://northwestchamber.chambermaster.com/list/", state: "OK", town: "Bethany" },
  { list: "https://southokcchamber.chambermaster.com/list/", state: "OK", town: "Oklahoma City" },
  { list: "https://exspgschambermo.chambermaster.com/list/", state: "MO", town: "Excelsior Springs" },
  { list: "https://crestwoodsunset.chambermaster.com/list/", state: "MO", town: "Crestwood" },
];
// Six a day since 2026-11-01 (Kriv asked for more businesses; was two).
export const CHAMBERS_PER_DAY = 6;

/** [state, town] for a member listing from one of these directories; the member's own town when its address has one. */
export function chamberWhere(listingUrl, address = "") {
  const c = CHAMBERS.find((x) => new URL(x.list).origin === new URL(listingUrl).origin);
  if (!c) return undefined;
  const town = String(address).split(", ")[1]?.replace(/\s*\d{5}(-\d{4})?\s*$/, "").trim();
  return [c.state, town || c.town];
}
