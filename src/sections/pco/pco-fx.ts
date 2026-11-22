// Seeded effects for the PCO Dental clinic concept (Kriv, 23 Nov 2026: "randomize it so there are effects
// throughout the whole page"). The design itself (light editorial, A5 mark, realistic molar, no story or narration)
// stays as published on 20 Nov; the seed only adds backgrounds, movement and interaction from the effects arsenal
// (docs/EFFECTS-ARSENAL.md). Every section that would otherwise sit still gets a moving layer; no two neighbours match.

export const PCO_LAYERS = ["aurora", "chart", "ripple", "drift", "contour", "halftone"] as const;
export type PcoLayer = (typeof PCO_LAYERS)[number];
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
  molar: (typeof PCO_MOLARS)[number];
  marquee: (typeof PCO_MARQUEES)[number];
  footer: (typeof PCO_FOOTERS)[number];
  footerTone: (typeof PCO_FOOTER_TONES)[number];
};

function rng(seed: number) {
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = <T,>(r: () => number, list: readonly T[]) => list[Math.floor(r() * list.length)];

export function pcoFxFor(seed: number): PcoFx {
  const r = rng(seed * 977 + 13);
  const layers = {} as Record<PcoSection, PcoLayer>;
  let prev: PcoLayer | undefined;
  for (const section of PCO_SECTIONS) { prev = pick(r, PCO_LAYERS.filter((x) => x !== prev)); layers[section] = prev; }
  return { seed, layers, touch: pick(r, PCO_TOUCHES), molar: pick(r, PCO_MOLARS), marquee: pick(r, PCO_MARQUEES), footer: pick(r, PCO_FOOTERS), footerTone: pick(r, PCO_FOOTER_TONES) };
}

export const PCO_FX_CANDIDATES = [302, 303, 319] as const; // picked so the three differ in hero background, footer, pointer style and marquees
export const PCO_FX_PINNED: number | null = null; // the live page shows no effects until Kriv picks a seed

/** The effects seed for a request: ?fx=<seed> outside production, otherwise the pinned seed (or none). */
export function pcoFxSeed(value: unknown, allowOverride: boolean): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (allowOverride && typeof raw === "string") {
    if (raw === "off") return null;
    if (/^\d{1,6}$/.test(raw)) return Number(raw);
  }
  return PCO_FX_PINNED;
}
