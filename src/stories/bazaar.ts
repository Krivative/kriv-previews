// The bazaar (Kriv, 2026-11-16): every story world has a market, because every niche and genre has one.
// Part two of a story is a walk through it, Street View style, where each of KRIV's five services stands
// at its own stall a few steps past the one before. The randomizer (journey-style.ts) picks the world from
// the lead's niche and the bazaar from the seed and the costume, so each client walks through a market in
// their own world. Decoration and wording only: prices and facts come from src/offers/ph-local.ts.

/** The services, in the order the visitor meets them (six since 2026-11-16: the AI agent became the chat agent, and the voice agent joined). Every bazaar has a stall for each. */
export const stallKinds = ["website", "content", "live-seller", "crm", "agent", "voice"] as const;
export type StallKind = (typeof stallKinds)[number];

/** The painted worlds. Each has its own scenes (public/scenes/<world>) and its own bazaar. */
export const journeyWorlds = {
  "smile-kingdom": { label: "The Smile Kingdom", niches: ["dental"], chibi: "dentist" },
  "merchants-road": { label: "The Merchant's Road", niches: [] as string[], chibi: "merchant" },
  "composers-citadel": { label: "The Composer's Citadel", niches: ["agency"], chibi: "producer" },
} as const;
export type JourneyWorld = keyof typeof journeyWorlds;
export const worldNames = Object.keys(journeyWorlds) as [JourneyWorld, ...JourneyWorld[]];

/** The world for a niche. A niche no world claims walks the Merchant's Road. */
export function worldFor(niche?: string): JourneyWorld {
  return (worldNames.find((w) => (journeyWorlds[w].niches as readonly string[]).includes(niche ?? "")) ?? "merchants-road");
}

/** The chibi's costume: the world's own trade (on the dental site, a dentist). */
export const chibiCostumes = { dentist: "Dentist's coat and mirror", merchant: "Merchant's apron and satchel", producer: "Headphones and a baton" } as const;
export type ChibiCostume = keyof typeof chibiCostumes;

export type Bazaar = {
  name: string; label: string;
  /** "world": the world's own market; otherwise the market that suits that costume, in any world. */
  fits: "world" | "film-crew" | "ships-crew" | "kitchen-brigade" | "pit-crew";
  /** Where the market is, one line, for the walk's opening. */
  setting: string;
  stalls: Record<StallKind, string>;
};

/** The world's own markets. */
export const worldBazaars: Record<JourneyWorld, Bazaar> = {
  "smile-kingdom": { name: "pearl-market", label: "The Pearl Market", fits: "world", setting: "under the Smile Kingdom's white towers, lanterns in mint and lime",
    stalls: { website: "The Hall of Mirrors", content: "The Herald's Board", "live-seller": "The Bright Stage", crm: "The Appointment Clock", agent: "The Helper's Booth", voice: "The Bell Tower" } },
  "merchants-road": { name: "road-bazaar", label: "The Road Bazaar", fits: "world", setting: "where the Merchant's Road widens into tents of sand and violet",
    stalls: { website: "The Window Maker", content: "The Poster Wall", "live-seller": "The Auction Stage", crm: "The Ledger House", agent: "The Errand Runner", voice: "The Crier's Post" } },
  "composers-citadel": { name: "music-fair", label: "The Music Fair", fits: "world", setting: "in the citadel's courtyard, between the towers",
    stalls: { website: "The Glass Stage", content: "The Poster Gallery", "live-seller": "The Busker's Stage", crm: "The Score Library", agent: "The Stagehand", voice: "The Singer's Balcony" } },
};

/** The costume's markets: the same five stalls, dressed for the genre. */
export const genreBazaars: Bazaar[] = [
  { name: "studio-lot", label: "The Studio Lot", fits: "film-crew", setting: "a back lot of painted fronts and spotlights",
    stalls: { website: "The Set Builder", content: "The Poster Department", "live-seller": "The Live Studio", crm: "The Call Sheet Office", agent: "The Runner's Trailer", voice: "The Phone Booth" } },
  { name: "harbour-market", label: "The Harbour Market", fits: "ships-crew", setting: "along the quay, where the ships unload",
    stalls: { website: "The Lighthouse", content: "The Signal Flags", "live-seller": "The Auction Pier", crm: "The Harbour Log", agent: "The Deckhand's Post", voice: "The Harbour Bell" } },
  { name: "night-market", label: "The Night Market", fits: "kitchen-brigade", setting: "a street of food stalls under string lights",
    stalls: { website: "The Shopfront", content: "The Menu Board", "live-seller": "The Grill Stage", crm: "The Order Rail", agent: "The Runner", voice: "The Order Window" } },
  { name: "paddock-market", label: "The Paddock Market", fits: "pit-crew", setting: "behind the pit lane, flags and tool chests",
    stalls: { website: "The Showroom", content: "The Livery Shop", "live-seller": "The Podium", crm: "The Timing Tower", agent: "The Pit Crew Bay", voice: "The Radio Tent" } },
];

export const allBazaars: Bazaar[] = [...Object.values(worldBazaars), ...genreBazaars];
export const bazaarNames = allBazaars.map((b) => b.name) as [string, ...string[]];

/**
 * The bazaar for a look: a pin wins; otherwise two in three get the world's own market and the third the
 * market that suits the costume (the world's own when the costume is plain).
 */
export function pickBazaar(world: JourneyWorld, genre: string, tie: number, pin?: string): Bazaar {
  const pinned = allBazaars.find((b) => b.name === pin);
  if (pinned) return pinned;
  if (tie % 3) return worldBazaars[world];
  return genreBazaars.find((b) => b.fits === genre) ?? worldBazaars[world];
}
