// Inbox sorting and the recipient's time zone. Pure functions: no DOM, so tests import this file.

const ZONES = {
  "America/New_York": ["CT", "DC", "DE", "FL", "GA", "IN", "KY", "MA", "MD", "ME", "MI", "NC", "NH", "NJ", "NY", "OH", "PA", "RI", "SC", "VA", "VT", "WV"],
  "America/Toronto": ["ON", "QC"],
  "America/Chicago": ["AL", "AR", "IA", "IL", "KS", "LA", "MN", "MO", "MS", "ND", "NE", "OK", "SD", "TN", "TX", "WI"],
  "America/Winnipeg": ["MB"], "America/Regina": ["SK"],
  "America/Denver": ["CO", "ID", "MT", "NM", "UT", "WY"], "America/Phoenix": ["AZ"], "America/Edmonton": ["AB"],
  "America/Los_Angeles": ["CA", "NV", "OR", "WA"], "America/Vancouver": ["BC"],
  "America/Halifax": ["NB", "NS", "PE"], "America/St_Johns": ["NL"], "America/Anchorage": ["AK"], "Pacific/Honolulu": ["HI"],
};
const BY_STATE = Object.fromEntries(Object.entries(ZONES).flatMap(([zone, states]) => states.map((s) => [s, zone])));
// Towns whose zone differs from the rest of their state (docs/OUTREACH.md "When to send").
const TOWNS = { "TX|el paso": "America/Denver", ...Object.fromEntries(["pensacola", "panama city", "panama city beach", "destin", "fort walton beach", "niceville", "crestview", "navarre", "milton"].map((t) => [`FL|${t}`, "America/Chicago"])) };
const ZONE_NAMES = { "America/New_York": "Eastern", "America/Toronto": "Eastern", "America/Chicago": "Central", "America/Winnipeg": "Central", "America/Regina": "Central", "America/Denver": "Mountain", "America/Phoenix": "Mountain", "America/Edmonton": "Mountain", "America/Los_Angeles": "Pacific", "America/Vancouver": "Pacific", "America/Halifax": "Atlantic", "America/St_Johns": "Newfoundland", "America/Anchorage": "Alaska", "Pacific/Honolulu": "Hawaii" };

export function timeZoneOf(state, town) {
  const s = String(state ?? "").trim().toUpperCase();
  return TOWNS[`${s}|${String(town ?? "").trim().toLowerCase()}`] ?? BY_STATE[s] ?? null;
}
export const zoneName = (zone) => ZONE_NAMES[zone] ?? "";

// Minutes ahead of UTC right now in that zone (DST included); null when unknown.
export function utcOffset(zone, at = new Date()) {
  if (!zone) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(at).map((p) => [p.type, p.value]));
  const local = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return Math.round((local - Math.floor(at.getTime() / 6e4) * 6e4) / 6e4);
}
export function localTime(zone, at = new Date()) {
  return zone ? new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", hour: "numeric", minute: "2-digit" }).format(at) : "";
}

export const SORTS = [
  ["priority", "Priority first"],
  ["closest", "Closest to sending"],
  ["eastfirst", "Time zone: east to west"],
  ["westfirst", "Time zone: west to east"],
  ["oldest", "Waiting longest"],
  ["recent", "Recent activity"],
  ["newest", "Newest found"],
  ["firstfound", "Oldest found"],
  ["location", "Location (state, town)"],
  ["industry", "Industry"],
  ["name", "Business name A–Z"],
  ["namedesc", "Business name Z–A"],
];

const text = (v) => String(v ?? "");
const byName = (a, b) => text(a.name).localeCompare(text(b.name));
const byPriority = (a, b) => a.priority - b.priority || text(a.updatedAt).localeCompare(text(b.updatedAt));
const found = (r) => text(r.createdAt ?? r.updatedAt);
const offset = (r, at) => utcOffset(timeZoneOf(r.state, r.town), at);
const byOffset = (dir, at) => (a, b) => {
  const x = offset(a, at), y = offset(b, at);
  if (x === y) return byPriority(a, b) || byName(a, b);
  if (x === null) return 1; if (y === null) return -1; // unknown zones last
  return dir * (y - x);
};

// niches: label lookup for the Industry sort. Returns a new array.
export function sortLeads(rows, sort, { niches = {}, at = new Date() } = {}) {
  const compare = {
    closest: (a, b) => (b.completedSteps ?? 0) / (b.totalSteps || 1) - (a.completedSteps ?? 0) / (a.totalSteps || 1) || byPriority(a, b),
    eastfirst: byOffset(1, at), westfirst: byOffset(-1, at),
    oldest: (a, b) => text(a.updatedAt).localeCompare(text(b.updatedAt)),
    recent: (a, b) => text(b.updatedAt).localeCompare(text(a.updatedAt)),
    newest: (a, b) => found(b).localeCompare(found(a)) || byName(a, b),
    firstfound: (a, b) => found(a).localeCompare(found(b)) || byName(a, b),
    location: (a, b) => text(a.state).localeCompare(text(b.state)) || text(a.town).localeCompare(text(b.town)) || byName(a, b),
    industry: (a, b) => text(niches[a.niche] ?? a.niche).localeCompare(text(niches[b.niche] ?? b.niche)) || byName(a, b),
    name: byName, namedesc: (a, b) => byName(b, a),
  }[sort] ?? byPriority;
  return [...rows].sort(compare);
}
