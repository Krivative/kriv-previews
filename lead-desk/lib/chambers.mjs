// ChamberMaster member directories that automatic building works through, six a day (two until 2026-11-01), after the
// daily Hotfrog search (Kriv, 2026-10-28). Each was checked once from this network on 2026-10-28:
// it loaded and listed categories for the six niches. Public directory addresses only.
export const CHAMBERS = [
  // Wealthier suburbs in the US and Canada first (Kriv targets $3,000 websites and $10-15k full
  // service, 2026-11-02). Each loaded once from this network with categories for 9+ business types.
  { list: "https://members.planochamber.org/list/", state: "TX", town: "Plano" },
  { list: "https://burlingtonchamber.chambermaster.com/list/", state: "ON", town: "Burlington" },
  { list: "https://business.chandlerchamber.com/list/", state: "AZ", town: "Chandler" },
  { list: "https://business.langleychamber.com/list/", state: "BC", town: "Langley" },
  { list: "https://members.npbchamber.com/list/", state: "FL", town: "Palm Beach Gardens" },
  { list: "https://edmontonchamber.chambermaster.com/list/", state: "AB", town: "Edmonton" },
  { list: "https://business.dublinchamber.org/list/", state: "OH", town: "Dublin" },
  { list: "https://business.rhbot.ca/list/", state: "ON", town: "Richmond Hill" },
  { list: "https://business.cedarparkchamber.org/list/", state: "TX", town: "Cedar Park" },
  { list: "https://business.nvchamber.ca/list/", state: "BC", town: "North Vancouver" },
  { list: "https://business.gilbertaz.com/list/", state: "AZ", town: "Gilbert" },
  { list: "https://business.stalbertchamber.com/list/", state: "AB", town: "St. Albert" },
  { list: "https://business.castlerock.org/list/", state: "CO", town: "Castle Rock" },
  { list: "https://business.miltonchamber.ca/list/", state: "ON", town: "Milton" },
  { list: "https://loudounchamber.chambermaster.com/list/", state: "VA", town: "Leesburg" },
  { list: "https://business.businessinsurrey.com/list/", state: "BC", town: "Surrey" },
  { list: "https://business.woodlandschamber.org/list/", state: "TX", town: "The Woodlands" },
  { list: "https://aurorachamber.chambermaster.com/list/", state: "ON", town: "Aurora" },
  { list: "https://business.winterpark.org/list/", state: "FL", town: "Winter Park" },
  { list: "https://airdriechamber.chambermaster.com/list/", state: "AB", town: "Airdrie" },
  { list: "https://business.wakeforestchamber.org/list/", state: "NC", town: "Wake Forest" },
  { list: "https://victoriachamber.chambermaster.com/list/", state: "BC", town: "Victoria" },
  { list: "https://business.brentwoodchamber.com/list/", state: "TN", town: "Brentwood" },
  { list: "https://business.scottsdalechamber.com/list/", state: "AZ", town: "Scottsdale" },
  { list: "https://boernechamber.chambermaster.com/list/", state: "TX", town: "Boerne" },
  // Earlier directories (Kriv, 2026-10-28).
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
  // Kept from 2026-11-01's additions (suburban or affluent areas).
  { list: "https://blairsvilleunionchamber.chambermaster.com/list/", state: "GA", town: "Blairsville" },
  { list: "https://pickenscountychamber.chambermaster.com/list/", state: "GA", town: "Jasper" },
  { list: "https://hendersoncountync.chambermaster.com/list/", state: "NC", town: "Hendersonville" },
  { list: "https://whitehousechamber.chambermaster.com/list/", state: "TN", town: "White House" },
  { list: "https://northwestchamber.chambermaster.com/list/", state: "OK", town: "Bethany" },
  { list: "https://crestwoodsunset.chambermaster.com/list/", state: "MO", town: "Crestwood" },
];
// Directories no longer searched (smaller, lower-income towns, retired 2026-11-02). Kept so
// businesses already found there keep their state and town.
export const RETIRED_CHAMBERS = [
  { list: "https://claytonga.chambermaster.com/list/", state: "GA", town: "Morrow" },
  { list: "https://polkgeorgia.chambermaster.com/list/", state: "GA", town: "Cedartown" },
  { list: "https://hart-countyga.chambermaster.com/list/", state: "GA", town: "Hartwell" },
  { list: "https://thomasvillechamber.chambermaster.com/list/", state: "NC", town: "Thomasville" },
  { list: "https://rvchambernc.chambermaster.com/list/", state: "NC", town: "Roanoke Rapids" },
  { list: "https://granville-chamber.chambermaster.com/list/", state: "NC", town: "Oxford" },
  { list: "https://cherokeechamber.chambermaster.com/list/", state: "SC", town: "Gaffney" },
  { list: "https://warrentn.chambermaster.com/list/", state: "TN", town: "McMinnville" },
  { list: "https://shoalschamberal.chambermaster.com/list/", state: "AL", town: "Florence" },
  { list: "https://chiltoncountychamberal.chambermaster.com/list/", state: "AL", town: "Clanton" },
  { list: "https://greatervalleyarea.chambermaster.com/list/", state: "AL", town: "Valley" },
  { list: "https://southokcchamber.chambermaster.com/list/", state: "OK", town: "Oklahoma City" },
  { list: "https://exspgschambermo.chambermaster.com/list/", state: "MO", town: "Excelsior Springs" },
];
// Six a day since 2026-11-01 (Kriv asked for more businesses; was two).
export const CHAMBERS_PER_DAY = 6;

/** [state, town] for a member listing from one of these directories; the member's own town when its address has one. */
export function chamberWhere(listingUrl, address = "") {
  const c = [...CHAMBERS, ...RETIRED_CHAMBERS].find((x) => new URL(x.list).origin === new URL(listingUrl).origin);
  if (!c) return undefined;
  // US ZIP or Canadian postal code at the end ("Burlington, ON L7R 1A1"), then a trailing province/state.
  const town = String(address).split(", ")[1]?.replace(/\s*(\d{5}(-\d{4})?|[A-Z]\d[A-Z]\s?\d[A-Z]\d)\s*$/i, "").replace(/\s+[A-Z]{2}$/, "").trim();
  return [c.state, town || c.town];
}
