// Seeded effects for the PCO Dental clinic concept (Kriv, 23 Nov 2026: "randomize it so there are effects
// throughout the whole page"). The design itself (light editorial, A5 mark, realistic molar, no story or narration)
// stays as published on 20 Nov; the seed only adds backgrounds, movement and interaction from the effects arsenal
// (docs/EFFECTS-ARSENAL.md). Every section that would otherwise sit still gets a moving layer; no two neighbours match.

export const PCO_LAYERS = ["aurora", "chart", "ripple", "drift", "contour", "halftone"] as const;
// Generation 2 (Kriv, 23 Nov: "I like 303 but use the randomizer for completely new effects and style"): seeds 400 and up
// draw only from the new effects and add style traits; seeds below 400 (302, 303, 319) are unchanged.
export const PCO_LAYERS_2 = ["bubbles", "glints", "silk", "caustics", "nodes"] as const;
export type PcoLayer = (typeof PCO_LAYERS)[number] | (typeof PCO_LAYERS_2)[number];
export const PCO_PALETTES = ["clinic", "pearl", "mint", "dusk"] as const;   // as published / cool white and navy / fresh mint / navy-tinted
export const PCO_TYPES = ["sans", "serif"] as const;                       // Montserrat headings / the A5 mark's Cormorant serif
export const PCO_RADII = ["soft", "crisp"] as const;                       // big rounded panels / near-square
export const PCO_BUTTONS = ["pill", "outline"] as const;
export const PCO_ENTRIES = ["rise", "wipe", "blur"] as const;              // headings rise / images and panels wipe open / blur into focus
export const PCO_POINTERS = ["spotlight", "cards", "both"] as const;       // a soft light follows the pointer / cards turn in 3D / both
export const PCO_MOLARS_2 = ["float", "parallax"] as const;                 // bobs / drifts and turns as the page scrolls
// Generation 3 (Kriv, 23 Nov: "3 other randomizers that change the whole site too including the graphics but still cater to
// adults who have children old enough for braces and expensive procedures"): seeds 500 and up rebuild the clinic website part
// (hero, parents, bigger treatments, plan, visit) with a new layout and code-drawn graphics; the KRIV offer below keeps its content.
// PCO's treatments are not confirmed yet, so treatments are shown as examples to confirm, and parents get questions to ask.
export const PCO_LAYOUTS = ["split", "centered", "stack"] as const;        // copy beside the art / centred over a wide art band / big headline with art and shortcuts below
export const PCO_ARTS = ["line", "glass", "blueprint"] as const;           // PcoArt.tsx styles
export const PCO_ORDERS = ["parents-first", "treatments-first"] as const;
export const PCO_HEADLINES = ["Smiles that grow up with your family.", "Big dental decisions, planned calmly.", "Good care for every smile at home."] as const;
export const PCO_SECTIONS = ["hero", "clinic", "proposal", "campaign", "assistant", "pilot", "pricing", "next"] as const;
export type PcoSection = (typeof PCO_SECTIONS)[number];
export const PCO_TOUCHES = ["tilt", "magnet"] as const;     // the molar and hero turn with the pointer / buttons lean toward it
export const PCO_MOLARS = ["float", "still"] as const;      // the molar sculpture bobs slowly / stays put
export const PCO_MARQUEES = ["one", "two"] as const;        // campaign titles under the hero / plus the trial facts in the closing section
export const PCO_FOOTERS = ["wave", "repel", "drag"] as const; // the A5 mark's letters bob / lean away and the line turns / can be thrown
export const PCO_FOOTER_TONES = ["sage", "mint"] as const;

export type PcoFx = {
  seed: number;
  layers: Record<PcoSection, PcoLayer>;
  touch: (typeof PCO_TOUCHES)[number];
  molar: (typeof PCO_MOLARS)[number] | (typeof PCO_MOLARS_2)[number];
  marquee: (typeof PCO_MARQUEES)[number];
  footer: (typeof PCO_FOOTERS)[number];
  footerTone: (typeof PCO_FOOTER_TONES)[number];
  gen: 1 | 2 | 3;
  site?: { layout: (typeof PCO_LAYOUTS)[number]; art: (typeof PCO_ARTS)[number]; order: (typeof PCO_ORDERS)[number]; headline: (typeof PCO_HEADLINES)[number]; extra: [PcoLayer, PcoLayer] };
  style?: { palette: (typeof PCO_PALETTES)[number]; type: (typeof PCO_TYPES)[number]; radius: (typeof PCO_RADII)[number]; buttons: (typeof PCO_BUTTONS)[number];
    entry: (typeof PCO_ENTRIES)[number]; pointer: (typeof PCO_POINTERS)[number]; bar: boolean };
};

function rng(seed: number) {
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = <T,>(r: () => number, list: readonly T[]) => list[Math.floor(r() * list.length)];

export function pcoFxFor(seed: number): PcoFx {
  const r = rng(seed * 977 + 13);
  const gen2 = seed >= 400, gen3 = seed >= 500;
  const pool: readonly PcoLayer[] = gen3 ? [...PCO_LAYERS, ...PCO_LAYERS_2] : gen2 ? PCO_LAYERS_2 : PCO_LAYERS;
  const layers = {} as Record<PcoSection, PcoLayer>;
  let prev: PcoLayer | undefined;
  for (const section of PCO_SECTIONS) { prev = pick(r, pool.filter((x) => x !== prev)); layers[section] = prev; }
  const base = { seed, layers, touch: pick(r, PCO_TOUCHES), molar: pick(r, PCO_MOLARS) as PcoFx["molar"], marquee: pick(r, PCO_MARQUEES), footer: pick(r, PCO_FOOTERS), footerTone: pick(r, PCO_FOOTER_TONES) };
  if (!gen2) return { ...base, gen: 1 };
  const g2 = { ...base, molar: pick(r, PCO_MOLARS_2),
    style: { palette: pick(r, PCO_PALETTES), type: pick(r, PCO_TYPES), radius: pick(r, PCO_RADII), buttons: pick(r, PCO_BUTTONS), entry: pick(r, PCO_ENTRIES), pointer: pick(r, PCO_POINTERS), bar: r() < 0.5 } };
  if (!gen3) return { ...g2, gen: 2 };
  const e1 = pick(r, pool.filter((x) => x !== layers.clinic)), e2 = pick(r, pool.filter((x) => x !== e1));
  return { ...g2, gen: 3, site: { layout: pick(r, PCO_LAYOUTS), art: pick(r, PCO_ARTS), order: pick(r, PCO_ORDERS), headline: pick(r, PCO_HEADLINES), extra: [e1, e2] } };
}

export const PCO_FX_CANDIDATES = [302, 303, 319] as const; // picked so the three differ in hero background, footer, pointer style and marquees
// Kriv liked 303 (23 Nov). Generation 2 candidates, picked from the randomizer's draws so they differ in palette, type,
// corners, buttons, entry, pointer and footer: 412 pearl + serif, 404 dusk + wipe, 420 mint + crisp.
export const PCO_FX_CANDIDATES_2 = [412, 404, 420] as const;
// Generation 3 (whole site, for parents): 537 split + line art + pearl serif, 509 centred + glass art + clinic greens, 514 stacked + blueprint art + dusk serif.
export const PCO_FX_CANDIDATES_3 = [537, 509, 514] as const;
export const PCO_FX_PINNED: number | null = 514; // Kriv, 23 Nov 2026: "pin and publish 514"

/** The effects seed for a request: ?fx=<seed> outside production, otherwise the pinned seed (or none). */
export function pcoFxSeed(value: unknown, allowOverride: boolean): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (allowOverride && typeof raw === "string") {
    if (raw === "off") return null;
    if (/^\d{1,6}$/.test(raw)) return Number(raw);
  }
  return PCO_FX_PINNED;
}
