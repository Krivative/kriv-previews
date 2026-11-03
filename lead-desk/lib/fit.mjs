// What kind of business a lead really is, which designs suit it and which photos to look for.
// Kriv, 2026-11-03: designs were picked from all 26 at random (an auto shop got a restaurant
// design, builders looked like real-estate sites) and every lead in an industry got the same
// two photos. Designs now come from a shortlist that fits the business, rotating to the one
// used least; photo searches come from what the business actually does.

const TRADES = ["hvac-calm", "hvac-bold", "plumbing-calm", "plumbing-bold", "auto-calm", "office-bold"];
const CLINICAL = ["dental-clear", "chiro-calm", "aesthetic-calm", "spa-calm"];

// Kinds that a broad niche hides. First match on name + category + source text wins.
const SUBTYPES = [
  { id: "autoglass", test: /\b(auto ?glass|windshield|windscreen)\b/i, designs: ["auto-calm", "auto-bold", "hvac-bold", "plumbing-bold"],
    queries: ["car windshield replacement", "windshield glass installation", "car side mirror", "car window glass", "auto glass repair technician"] },
  { id: "brewery", test: /\b(brew(ery|ing|pub)|taproom|craft beer|ale ?house)\b/i, designs: ["restaurant-bold", "cafe-poster", "cafe-calm", "restaurant-calm"],
    queries: ["brewery tanks", "craft beer taps", "beer flight taproom", "brewery barrels", "pint of craft beer bar"] },
  { id: "rv", test: /\b(rv|r\.v\.|recreational vehicles?|trailers?|camper|motorhome)\b/i, designs: ["office-bold", "hvac-bold", "auto-calm", "plumbing-bold"],
    queries: ["rv trailer", "aluminum sheet metal", "metal fabrication workshop", "camper trailer road", "steel panels factory"] },
  { id: "construction", test: /\b(construct\w*|general contractor|design[- ]build|builders?|project management|commercial build\w*|civil)\b/i, designs: ["office-bold", "hvac-bold", "plumbing-bold", "auto-calm"],
    queries: ["construction site crane", "building framing construction", "construction workers site", "concrete foundation pour", "architect blueprints construction", "commercial building construction"] },
  { id: "homecleaning", test: /\b(maid|house ?clean\w*|home clean\w*|residential clean\w*|condos?|apartments?|move[- ](in|out) clean\w*)\b/i, designs: ["spa-calm", "salon-calm", "dental-clear", "plumbing-calm"],
    queries: ["clean modern kitchen", "tidy bright living room", "cleaning supplies home", "made bed bright bedroom", "clean bathroom sink"] },
  { id: "barber", test: /\bbarber/i, designs: ["salon-bold", "spa-bold", "auto-bold", "salon-calm"],
    queries: ["barbershop chair", "barber tools clippers", "barbershop interior", "straight razor shave", "barber pole"] },
  { id: "nails", test: /\b(nails?|manicure|pedicure)\b/i, designs: ["aesthetic-bold", "salon-calm", "aesthetic-calm", "spa-calm"],
    queries: ["nail salon manicure", "nail polish colors", "pedicure spa", "nail art", "manicure table"] },
  { id: "vet", test: /\b(veterinar\w*|animal hospital|vet clinic)\b/i, designs: ["chiro-calm", "dental-clear", "spa-calm", "gym-calm"],
    queries: ["veterinary clinic dog", "cat at vet", "veterinary exam room", "happy dog outdoors", "puppy portrait"] },
  { id: "gymnastics", test: /\b(gymnastic\w*|tumbling|cheer)\b/i, designs: ["gym-calm", "gym-bold", "salon-bold"],
    queries: ["gymnastics gym", "balance beam", "gymnastics rings", "gym mats", "trampoline gym"] },
];

const BY_NICHE = {
  dental: { designs: ["dental-clear", "dental-bold", "chiro-calm", "aesthetic-calm"], queries: ["modern dental clinic", "dental chair", "dental tools", "toothbrush bathroom", "dental office reception"] },
  chiro: { designs: ["chiro-calm", "chiro-bold", "spa-calm", "aesthetic-calm"], queries: ["chiropractic table", "treatment room", "spine model", "massage therapy room", "stretching exercise"] },
  hvac: { designs: ["hvac-calm", "hvac-bold", "plumbing-calm", "plumbing-bold", "auto-calm"], queries: ["air conditioner outdoor unit", "hvac technician", "furnace", "air duct vent", "thermostat wall", "rooftop hvac units"] },
  plumbing: { designs: ["plumbing-calm", "plumbing-bold", "hvac-calm", "hvac-bold"], queries: ["plumbing pipes", "plumber tools", "kitchen faucet", "water heater", "bathroom sink"] },
  auto: { designs: ["auto-calm", "auto-bold", "hvac-bold", "plumbing-bold"], queries: ["car repair garage", "car engine", "mechanic tools", "tire change", "car lift garage"] },
  pool: { designs: ["resort-calm", "hvac-calm", "plumbing-calm", "spa-calm"], queries: ["swimming pool water", "backyard pool", "pool cleaning", "pool tiles"] },
  salon: { designs: ["salon-calm", "salon-bold", "aesthetic-bold", "spa-calm"], queries: ["hair salon chairs", "hair styling", "salon interior", "hair products shelf", "hair color bowl"] },
  medspa: { designs: ["aesthetic-calm", "aesthetic-bold", "spa-calm", "spa-bold"], queries: ["skincare products", "facial treatment room", "spa towels", "serum bottles", "spa interior"] },
  roofing: { designs: TRADES, queries: ["roofer installing shingles", "metal roof", "roof construction", "new roof house", "roof tiles closeup"] },
  electrical: { designs: ["hvac-bold", "hvac-calm", "plumbing-bold", "auto-calm", "office-bold"], queries: ["electrician wiring", "electrical panel", "led lighting installation", "ev charger", "electrical cables"] },
  landscaping: { designs: ["resort-calm", "plumbing-calm", "hvac-calm", "spa-calm"], queries: ["green lawn garden", "landscaping stone path", "garden design", "lawn mower grass", "hedge trimming"] },
  pest: { designs: TRADES, queries: ["house exterior", "pest control sprayer", "clean kitchen", "garden path home"] },
  cleaning: { designs: ["spa-calm", "salon-calm", "dental-clear", "plumbing-calm"], queries: ["clean bright living room", "cleaning supplies", "clean office", "window cleaning", "clean kitchen counter"] },
  painting: { designs: TRADES, queries: ["paint roller wall", "painted interior", "paint cans", "house painting exterior", "color swatches"] },
  homeservices: { designs: TRADES, queries: ["house exterior", "home renovation", "tools workbench", "new floor installation", "modern home interior"] },
  clinic: { designs: CLINICAL, queries: ["treatment room", "clinic reception", "physical therapy", "medical office"] },
  fitness: { designs: ["gym-calm", "gym-bold", "salon-bold"], queries: ["gym weights", "fitness class", "yoga studio", "gym interior", "training equipment"] },
  pets: { designs: ["spa-calm", "chiro-calm", "salon-calm", "gym-calm"], queries: ["happy dog", "dog grooming", "cat portrait", "dog walking park", "pet supplies"] },
  restaurant: { designs: ["restaurant-calm", "restaurant-bold", "cafe-poster", "cafe-calm"], queries: ["restaurant table", "plated dish", "restaurant interior", "chef cooking", "food platter"] },
  cafe: { designs: ["cafe-calm", "cafe-poster", "restaurant-calm"], queries: ["coffee cup cafe", "espresso machine", "pastries display", "cafe interior", "latte art"] },
  legal: { designs: ["office-calm", "office-bold"], queries: ["office desk books", "law library", "meeting room", "modern office"] },
  accounting: { designs: ["office-bold", "office-calm"], queries: ["office desk calculator", "documents desk", "modern office", "meeting room"] },
};
const DEFAULT = { designs: ["office-calm", "office-bold", "hvac-calm", "plumbing-calm"], queries: ["modern office", "workshop tools", "storefront"] };

/** The lead's kind: { id, designs, queries }. `text` is name, category and source-page text. */
export function kindOf(lead, text = "") {
  const sample = `${lead.name ?? ""} ${lead.category ?? ""} ${String(text).slice(0, 6000)}`;
  // The business name and category decide first; page text only when they say nothing.
  const head = `${lead.name ?? ""} ${lead.category ?? ""}`;
  const sub = SUBTYPES.find((k) => k.test.test(head)) ?? (BY_NICHE[lead.niche] && !["homeservices", "cleaning"].includes(lead.niche) ? null : SUBTYPES.find((k) => k.test.test(sample)));
  if (sub) return { id: sub.id, designs: sub.designs, queries: sub.queries };
  const base = BY_NICHE[lead.niche] ?? DEFAULT;
  return { id: lead.niche ?? "general", designs: base.designs, queries: base.queries };
}

/**
 * The fitting design used least so far (usage: { templateId: count }), ties broken by the
 * lead's own seed so neighbours differ. `look` ("calm"/"bold") narrows when Kriv asked for it.
 */
/** @param {{ designs: string[] }} kind @param {{ id: string, look?: string | null }[]} templates @param {{ usage?: Record<string, number>, seed?: number, look?: string | null, avoid?: string | null }} [options] */
export function chooseDesign(kind, templates, { usage = {}, seed = 0, look = null, avoid = null } = {}) {
  const known = new Map(templates.map((t) => [t.id, t]));
  let pool = kind.designs.filter((id) => known.has(id));
  if (look) pool = pool.filter((id) => known.get(id).look === look).length ? pool.filter((id) => known.get(id).look === look) : pool;
  if (avoid && pool.length > 1) pool = pool.filter((id) => id !== avoid);
  if (!pool.length) return null;
  // The first two are the industry's own designs; the others only once those are used clearly more.
  const ranked = pool.map((id, i) => ({ id, uses: (usage[id] ?? 0) + (kind.designs.indexOf(id) >= 2 ? 2 : 0), order: (i + seed) % pool.length })).sort((a, b) => a.uses - b.uses || a.order - b.order);
  return ranked[0].id;
}
