// Seeded look for /ph-rates (22 Nov 2026, Claude Code, Opus 5.5).
// Same method that produced kriv.agency seed 110 (Krivative/Kriv lib/design-seed.ts):
//   1. a fixed base that every candidate keeps (Fraunces with Inter, the kriv× logo, signal lime for calls to action,
//      packages on the brand spectrum, an inverted closing band);
//   2. option lists, each taken from a pattern in a reference Kriv shared;
//   3. hand-composed candidates that each show a different mix, plus random seeds for range;
//   4. Kriv picks by looking, then the pick is pinned.
// References for this page (Kriv, 22 Nov): a living-water hero with a mixed sans and italic serif headline;
// a fintech site with floating product cards, a pinned card that changes while a list scrolls, a technical
// spec sheet and a giant wordmark footer; a light security SaaS site with airy sections and outcome figures.
// Every figure the page shows is computed from src/offers/pricing.ts. Nothing here invents results.

export type PhColorway = { id: string; name: string; dark: boolean; vars: Record<string, string> };

// Brand kit colours only: ink #101112, paper #efefe8, signal #e7fa78, Care #88bafa, Operations #dec99d.
export const PH_COLORWAYS: readonly PhColorway[] = [
  { id: "ink-care", name: "Ink and Care blue (seed 110)", dark: true, vars: {} },
  { id: "sea", name: "Care blue sea, light", dark: false, vars: {
    "--paper": "#f4f8fd", "--band": "#e8f1fc", "--panel": "#ffffff", "--panel-alt": "#eef4fc", "--ink": "#0d1116", "--subtle": "#46566b",
    "--line": "#d3e1f2", "--accent": "#101112", "--button-bg": "#101112", "--button-ink": "#e7fa78", "--care": "#3f86ea", "--sand": "#c9a866" } },
  { id: "paper-ink", name: "Paper and ink", dark: false, vars: {
    "--paper": "#efefe8", "--band": "#e6e6dd", "--panel": "#f8f8f3", "--panel-alt": "#ecece4", "--ink": "#101112", "--subtle": "#53554e",
    "--line": "#d4d4c9", "--accent": "#101112", "--button-bg": "#101112", "--button-ink": "#e7fa78", "--care": "#4d8be0", "--sand": "#b99a5c" } },
  { id: "ink-sand", name: "Ink and Operations sand", dark: true, vars: {
    "--paper": "#121110", "--band": "#181614", "--panel": "#1f1c19", "--panel-alt": "#26221e", "--ink": "#f1ede4", "--subtle": "#b0a796",
    "--line": "#38332c", "--care": "#88bafa", "--sand": "#dec99d" } },
];

export const PH_HEROES = ["sea", "floating", "statement"] as const;    // living water / floating plan cards / seed 110 centred with wordmark
export const PH_HEADLINES = ["mixed", "serif"] as const;              // sans with an italic serif line / all Fraunces
export const PH_STORIES = ["pinned", "timeline"] as const;            // sticky plan card that changes as the trial steps scroll / 14-day line
export const PH_FIGURES = ["figures", "none"] as const;               // offer facts as large figures (not results)
export const PH_FINE = ["spec", "fold"] as const;                     // spec sheet / folded list (current)
export const PH_FOOTERS = ["wordmark", "band", "inkfill"] as const;   // giant kriv wordmark / plain band / wordmark that inks in as you scroll
// Round 2 (23 Nov, Kriv liked 203 and asked for better backgrounds, movement and interactivity). Only used with the statement hero.
export const PH_BACKDROPS = ["glow", "veil", "contour", "halftone"] as const; // soft colour glow / sea under a paper veil the pointer uncovers / moving sea-chart contour lines / printer's halftone dots that form the wordmark
export const PH_MOTIONS = ["calm", "reveal"] as const;               // still / sections rise in, figures count up, the 14-day rail fills as you scroll
export const PH_TOUCHES = ["none", "tilt", "magnet"] as const;        // nothing / plan cards drift with the pointer / buttons lean toward the pointer
export const PH_CARDS = ["none", "corners"] as const;                // plan cards around the centred statement (fintech reference)
export const PH_RADII = [16, 28] as const;

export type PhDesign = {
  seed: number; colorway: PhColorway; hero: (typeof PH_HEROES)[number]; headline: (typeof PH_HEADLINES)[number];
  story: (typeof PH_STORIES)[number]; figures: (typeof PH_FIGURES)[number]; fine: (typeof PH_FINE)[number];
  footer: (typeof PH_FOOTERS)[number]; radius: number;
  backdrop: (typeof PH_BACKDROPS)[number]; motion: (typeof PH_MOTIONS)[number]; touch: (typeof PH_TOUCHES)[number]; cards: (typeof PH_CARDS)[number];
};

function rng(seed: number) {
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = <T,>(r: () => number, list: readonly T[]) => list[Math.floor(r() * list.length)];

type Curated = { c: string } & Omit<PhDesign, "seed" | "colorway">;
// Round 1 candidates, composed by hand so each shows a different hero, colorway and story.
export const PH_CURATED: Record<number, Curated> = {
  // Seed 110's dark Care blue with the living Cebu-sea hero: closest to the main site, most "weapon".
  201: { c: "ink-care", hero: "sea", headline: "serif", story: "pinned", figures: "figures", fine: "spec", footer: "wordmark", radius: 28, backdrop: "glow", motion: "calm", touch: "none", cards: "none" },
  // Light and airy Care-blue sea with floating plan cards: the portfolio piece for PH clients.
  202: { c: "sea", hero: "floating", headline: "mixed", story: "pinned", figures: "figures", fine: "spec", footer: "wordmark", radius: 28, backdrop: "glow", motion: "calm", touch: "none", cards: "none" },
  // Paper editorial with the seed 110 statement hero and the 14-day line: the calmest, most document-like.
  203: { c: "paper-ink", hero: "statement", headline: "serif", story: "timeline", figures: "figures", fine: "spec", footer: "band", radius: 16, backdrop: "glow", motion: "calm", touch: "none", cards: "none" },
  // Round 2: three takes on 203 (paper editorial), each with its own background, movement and interaction.
  // Paper over a living sea: the pointer (or a slow drift on phones) lifts the paper to show water; ripples where you touch.
  204: { c: "paper-ink", hero: "statement", headline: "serif", story: "timeline", figures: "figures", fine: "spec", footer: "band", radius: 16, backdrop: "veil", motion: "reveal", touch: "magnet", cards: "none" },
  // Sea chart: contour lines that drift like a nautical chart and swell around the pointer, plan cards in the corners that move with it.
  205: { c: "paper-ink", hero: "statement", headline: "serif", story: "pinned", figures: "figures", fine: "spec", footer: "band", radius: 16, backdrop: "contour", motion: "reveal", touch: "tilt", cards: "corners" },
  // Press: halftone dots that print the kriv wordmark on load, a wave through the dot field, dots that swell under the pointer; footer inks in.
  206: { c: "paper-ink", hero: "statement", headline: "serif", story: "timeline", figures: "figures", fine: "spec", footer: "inkfill", radius: 16, backdrop: "halftone", motion: "reveal", touch: "magnet", cards: "none" },
};
export const PH_CANDIDATES = [201, 202, 203, 204, 205, 206] as const;
export const PH_PINNED_SEED: number | null = null; // set when Kriv picks

export function phDesignFor(seed: number): PhDesign {
  const r = rng(seed * 131 + 7);
  let d: PhDesign = {
    seed, colorway: pick(r, PH_COLORWAYS), hero: pick(r, PH_HEROES), headline: pick(r, PH_HEADLINES), story: pick(r, PH_STORIES),
    figures: pick(r, PH_FIGURES), fine: pick(r, PH_FINE), footer: pick(r, PH_FOOTERS), radius: pick(r, PH_RADII),
    backdrop: pick(r, PH_BACKDROPS), motion: pick(r, PH_MOTIONS), touch: pick(r, PH_TOUCHES), cards: pick(r, PH_CARDS),
  };
  const fixed = PH_CURATED[seed];
  if (fixed) { const { c, ...rest } = fixed; d = { ...d, ...rest, colorway: PH_COLORWAYS.find((x) => x.id === c)! }; }
  if (d.hero !== "statement") d = { ...d, backdrop: "glow", cards: "none" };
  return d;
}

export function phSeedFrom(value: unknown, allowOverride: boolean) {
  const fallback = PH_PINNED_SEED ?? PH_CANDIDATES[0];
  if (!allowOverride) return fallback;
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" && /^\d{1,6}$/.test(raw) ? Number(raw) : fallback;
}
