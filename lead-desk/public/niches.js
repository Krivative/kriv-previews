// Every business type KRIV looks for, in one place (Kriv, 2026-11-01: add every local business
// type that really benefits from a website, social media and the other Kriv.Agency services).
// Plain browser-safe module: the Desk screens load it from /niches.js and the server, finder
// and builder import it directly. Adding a type here adds it everywhere.
//
// id        stored on leads; never rename an existing id
// label     Desk label          plural   email wording ("looking up {plural} around {town}")
// category  default category    noun     "Looking for {noun} in {town}?"
// templates website designs offered first in the manual Build screen (src/templates)
// content   page-guide wording (src/lib/site-pages.ts); "general" when none fits
// hotfrog   Hotfrog category slugs    chamber  directory category pattern (first match wins)
// photo     Unsplash search           services words that confirm a listed service
export const NICHE_LIST = [
  // The original six (2026-10-24).
  { id: "dental", label: "Dental", plural: "dentists", category: "Dental clinic", noun: "a dentist", templates: ["dental-clear", "dental-bold"], content: "dental",
    hotfrog: ["dentists", "dentist"], chamber: /dent(al|ist)/i, photo: "empty dental chair room", services: /clean|exam|check|fill|crown|implant|dent|whiten|root canal|bridge/i },
  { id: "chiro", label: "Chiropractic", plural: "chiropractors", category: "Chiropractic clinic", noun: "a chiropractor", templates: ["chiro-calm", "chiro-bold"], content: "chiro",
    hotfrog: ["chiropractors", "chiropractor"], chamber: /chiropract/i, photo: "empty treatment room", services: /chiro|adjust|massage|spinal|rehab|treatment|therapy/i },
  { id: "hvac", label: "HVAC", plural: "heating and air companies", category: "Heating and air conditioning", noun: "heating and cooling", templates: ["hvac-calm", "hvac-bold"], content: "hvac",
    hotfrog: ["heating-air-conditioning", "hvac", "air-conditioning"], chamber: /(air[- ]condition|heating|hvac|mechanical)/i, photo: "air conditioner outdoor unit tools", services: /\b(ac|air|cooling|heating|heat|duct|vent|furnace|thermostat|refrigeration)\b/i },
  { id: "plumbing", label: "Plumbing", plural: "plumbers", category: "Plumbing", noun: "a plumber", templates: ["plumbing-calm", "plumbing-bold"], content: "plumbing",
    hotfrog: ["plumbers", "plumbing"], chamber: /plumb/i, photo: "plumbing pipes tools", services: /plumb|drain|water|pipe|sewer|leak|toilet|faucet|sink/i },
  { id: "auto", label: "Auto repair", plural: "auto repair shops", category: "Auto repair", noun: "car repairs", templates: ["auto-calm", "auto-bold"], content: "auto",
    hotfrog: ["auto-repair", "car-repair", "mechanics", "auto-body-repair", "auto-detailing"], chamber: /(auto(motive)? (repair|service|body|detail)|car repair|car wash|collision|mechanic|transmission|brake|detailing)/i, photo: "car engine tools", services: /brake|oil|tire|engine|transmission|battery|align|repair|maintenance|diagnostic|collision|paint|detail/i },
  // Checked before med spa: "Pool & Spa" and "Nail Salon & Spa" are not med spas.
  { id: "pool", label: "Pool service", plural: "pool companies", category: "Pool service", noun: "pool care", templates: ["hvac-calm", "plumbing-bold"], content: "general",
    hotfrog: ["swimming-pool-services", "pool-service"], chamber: /\bpools?\b/i, photo: "swimming pool water", services: /pool|clean|repair|pump|filter|resurfac|chemical/i },
  { id: "salon", label: "Salon & barber", plural: "salons and barbers", category: "Salon", noun: "a salon", templates: ["salon-calm", "salon-bold"], content: "salon",
    hotfrog: ["hair-salons", "barbers", "nail-salons"], chamber: /(salon|barber|nail|hair (care|stylist)|\blash|\bbrows?\b)/i, photo: "hair salon chairs", services: /cut|color|style|blow|nail|manicure|pedicure|lash|brow|shave|beard|wax/i },
  { id: "medspa", label: "Med spa", plural: "med spas", category: "Med spa", noun: "skin and aesthetic care", templates: ["aesthetic-calm", "aesthetic-bold"], content: "aesthetic",
    hotfrog: ["medical-spa", "medical-spas", "skin-care"], chamber: /(med(ical)?[- ]spa|aesthetic|skin|cosmetic surg|laser|botox|day spa|massage|spas?\b)/i, photo: "skincare tray products", services: /facial|skin|peel|laser|treatment|botox|filler|microneed|massage/i },
  // Home services (added 2026-11-01).
  { id: "roofing", label: "Roofing", plural: "roofers", category: "Roofing", noun: "a roofer", templates: ["plumbing-bold", "hvac-calm"], content: "general",
    hotfrog: ["roofing", "roofers"], chamber: /roof/i, photo: "roof shingles house", services: /roof|shingle|metal|leak|gutter|repair|replace|inspect/i },
  { id: "electrical", label: "Electrical", plural: "electricians", category: "Electrical contractor", noun: "an electrician", templates: ["hvac-bold", "plumbing-calm"], content: "general",
    hotfrog: ["electricians", "electrical-contractors"], chamber: /electric/i, photo: "electrical panel tools", services: /electric|wiring|panel|lighting|outlet|generator|ev charg|surge/i },
  { id: "landscaping", label: "Landscaping & lawn", plural: "landscaping companies", category: "Landscaping", noun: "lawn and landscape care", templates: ["plumbing-calm", "hvac-calm"], content: "general",
    hotfrog: ["landscaping", "lawn-care", "tree-services"], chamber: /(landscap|lawn|tree (service|care|trim)|irrigation|sprinkler)/i, photo: "green lawn garden", services: /lawn|mow|landscap|tree|trim|irrigat|sprinkler|mulch|sod|hardscape/i },
  { id: "pest", label: "Pest control", plural: "pest control companies", category: "Pest control", noun: "pest control", templates: ["hvac-bold", "plumbing-bold"], content: "general",
    hotfrog: ["pest-control", "exterminators"], chamber: /(pest|extermin|termite)/i, photo: "house exterior garden", services: /pest|termite|ant|rodent|mosquito|bed bug|inspect|treat/i },
  { id: "cleaning", label: "Cleaning", plural: "cleaning companies", category: "Cleaning service", noun: "a cleaning service", templates: ["spa-calm", "hvac-calm"], content: "general",
    hotfrog: ["cleaning-services", "carpet-cleaning", "pressure-washing"], chamber: /(clean|janitor|maid|pressure wash|power wash|restoration)/i, photo: "clean bright living room", services: /clean|carpet|window|pressure|wash|janitor|move[- ]out|deep|office/i },
  { id: "painting", label: "Painting", plural: "painters", category: "Painting contractor", noun: "a painter", templates: ["plumbing-calm", "hvac-bold"], content: "general",
    hotfrog: ["painters", "painting-contractors"], chamber: /paint(er|ing)/i, photo: "paint roller wall", services: /paint|interior|exterior|cabinet|stain|drywall|pressure/i },
  { id: "homeservices", label: "Other home services", plural: "home service companies", category: "Home services", noun: "home services", templates: ["hvac-calm", "plumbing-bold"], content: "general",
    hotfrog: ["garage-doors", "fencing", "flooring", "handyman", "locksmiths", "movers"], chamber: /(garage door|fenc|floor|handyman|locksmith|moving|movers|remodel|construct|contractor|window|siding|concrete|cabinet|countertop)/i, photo: "house exterior", services: /install|repair|replace|remodel|door|fence|floor|lock|move|window|concrete/i },
  // Health, fitness and pets.
  { id: "clinic", label: "Therapy & eye care", plural: "clinics", category: "Clinic", noun: "a clinic", templates: ["chiro-calm", "dental-clear"], content: "general",
    hotfrog: ["physical-therapy", "optometrists", "podiatrists"], chamber: /(physical therap|physiotherap|optomet|eye care|podiat|audiolog|hearing|acupunct|counseling|wellness)/i, photo: "empty treatment room", services: /therap|exam|eye|vision|rehab|treat|hearing|foot|acupunct|counsel/i },
  { id: "fitness", label: "Gym & fitness", plural: "gyms and studios", category: "Fitness studio", noun: "a gym", templates: ["gym-calm", "gym-bold"], content: "gym",
    hotfrog: ["gyms", "fitness-centers", "yoga"], chamber: /(gym|fitness|yoga|pilates|martial art|karate|jiu|boxing|crossfit|dance studio|personal train)/i, photo: "gym weights", services: /class|train|yoga|pilates|boxing|martial|membership|coach|strength|dance/i },
  { id: "pets", label: "Vet & pets", plural: "vets and pet businesses", category: "Pet care", noun: "pet care", templates: ["spa-calm", "office-calm"], content: "general",
    hotfrog: ["veterinarians", "pet-grooming"], chamber: /(veterinar|animal hospital|pet (groom|care|sit|board)|grooming|kennel|dog train)/i, photo: "dog portrait", services: /groom|bath|board|vaccin|exam|train|dental|spay|neuter|daycare/i },
  // Food (social media fits these especially well).
  { id: "restaurant", label: "Restaurant", plural: "restaurants", category: "Restaurant", noun: "a restaurant", templates: ["restaurant-calm", "restaurant-bold"], content: "restaurant",
    hotfrog: ["restaurants"], chamber: /(restaurant|grill|pizza|bbq|barbecue|diner|taco|sushi|catering|food truck)/i, photo: "restaurant table", services: /lunch|dinner|breakfast|brunch|cater|menu|pizza|grill|takeout|delivery/i },
  { id: "cafe", label: "Café & bakery", plural: "cafés and bakeries", category: "Café", noun: "a café", templates: ["cafe-calm", "cafe-poster"], content: "cafe",
    hotfrog: ["cafes", "bakeries", "coffee-shops"], chamber: /(caf[eé]|coffee|bakery|bakeries|dessert|ice cream|donut)/i, photo: "coffee cup cafe", services: /coffee|espresso|latte|pastr|bread|cake|dessert|breakfast|cater/i },
  // Professional services.
  { id: "legal", label: "Law firm", plural: "law firms", category: "Law firm", noun: "an attorney", templates: ["office-calm", "office-bold"], content: "office",
    hotfrog: ["lawyers", "attorneys"], chamber: /(attorney|law (firm|office)|lawyer|legal service)/i, photo: "office desk books", services: /law|injur|family|estate|criminal|divorce|business|probate|immigration|real estate/i },
  { id: "accounting", label: "Accounting & tax", plural: "accounting firms", category: "Accounting firm", noun: "an accountant", templates: ["office-bold", "office-calm"], content: "office",
    hotfrog: ["accountants", "tax-preparation", "bookkeeping"], chamber: /(account(ant|ing)|\bcpa\b|bookkeep|tax (prep|service|return))/i, photo: "office desk calculator", services: /tax|bookkeep|payroll|audit|account|consult|advis|planning/i },
];

export const NICHE = Object.fromEntries(NICHE_LIST.map((n) => [n.id, n]));
export const NICHES = Object.fromEntries(NICHE_LIST.map((n) => [n.id, n.label]));
export const NICHE_IDS = NICHE_LIST.map((n) => n.id);
// The six the Desk searched before 2026-11-01. A saved search with exactly these means "all".
export const LEGACY_NICHES = ["hvac", "dental", "chiro", "medspa", "plumbing", "auto"];
export const nicheOf = (s) => NICHE_LIST.find((n) => n.chamber.test(s))?.id;
