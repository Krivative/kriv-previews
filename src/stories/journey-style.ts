import type { CSSProperties } from "react";

// The randomizer for story sites (preview-only). A story site's look is not
// coded per client: it is chosen from the lists below by a seed. By default the
// seed is the lead's slug, so every lead gets its own combination and keeps it
// on every visit. `storyStyle` in the lead record can pin any part, or give a
// new seed to reshuffle (`pnpm story:shuffle <slug>`).
//
// What varies: the colour theme and typefaces, the corner shapes, how chapters
// are named, which side the drawing sits on, and the ring around it. What does
// not vary: the story's words (a recorded voice-over reads them) and the
// guardrails.

const mono = "JetBrains+Mono:wght@400;600";
const fonts = (...families: string[]) => `https://fonts.googleapis.com/css2?${[...families, mono].map((f) => `family=${f}`).join("&")}&display=swap`;

export type JourneyTheme = {
  name: string; label: string;
  bg: string; surface: string; ink: string; bright: string; muted: string; accent: string; accentInk: string; glow: string;
  display: string; displayName: string; body: string; bodyName: string;
  weight: number; tracking: string; letterCase: "uppercase" | "none";
  radius: string; radiusSmall: string; buttonRadius: string; googleCss: string;
};

export const journeyThemes: JourneyTheme[] = [
  { name: "night-lime", label: "Night and lime", bg: "#0d141c", surface: "#16222e", ink: "#eceef1", bright: "#f6f8fa", muted: "#8d9cab", accent: "#e7fa78", accentInk: "#0d141c", glow: "rgba(60, 150, 170, 0.16)",
    display: '"Lexend Zetta", "Manrope", Arial, sans-serif', displayName: "Lexend Zetta", body: '"Manrope", Arial, sans-serif', bodyName: "Manrope", weight: 300, tracking: "0.07em", letterCase: "uppercase",
    radius: "22px", radiusSmall: "14px", buttonRadius: "999px", googleCss: fonts("Lexend+Zetta:wght@200;300;400", "Manrope:wght@400;500;600;700") },
  { name: "forest-gold", label: "Forest and gold", bg: "#0f1a14", surface: "#17261d", ink: "#e9efe9", bright: "#f7faf5", muted: "#93a698", accent: "#f2c14e", accentInk: "#0f1a14", glow: "rgba(96, 160, 110, 0.18)",
    display: '"Fraunces", Georgia, serif', displayName: "Fraunces", body: '"Outfit", Arial, sans-serif', bodyName: "Outfit", weight: 400, tracking: "-0.015em", letterCase: "none",
    radius: "18px", radiusSmall: "12px", buttonRadius: "999px", googleCss: fonts("Fraunces:opsz,wght@9..144,400;9..144,500", "Outfit:wght@400;500;600;700") },
  { name: "plum-rose", label: "Plum and rose", bg: "#1a1020", surface: "#251830", ink: "#efe8f2", bright: "#fbf6fd", muted: "#a996b3", accent: "#ff9ec4", accentInk: "#1a1020", glow: "rgba(170, 100, 200, 0.2)",
    display: '"Syne", Arial, sans-serif', displayName: "Syne", body: '"Manrope", Arial, sans-serif', bodyName: "Manrope", weight: 700, tracking: "-0.02em", letterCase: "none",
    radius: "26px", radiusSmall: "16px", buttonRadius: "999px", googleCss: fonts("Syne:wght@600;700", "Manrope:wght@400;500;600;700") },
  { name: "charcoal-orange", label: "Charcoal and orange", bg: "#151515", surface: "#1f1f1f", ink: "#ededea", bright: "#ffffff", muted: "#9c9c97", accent: "#ff8a3d", accentInk: "#151515", glow: "rgba(255, 138, 61, 0.1)",
    display: '"Archivo", Arial, sans-serif', displayName: "Archivo", body: '"Inter", Arial, sans-serif', bodyName: "Inter", weight: 800, tracking: "0.005em", letterCase: "uppercase",
    radius: "0px", radiusSmall: "0px", buttonRadius: "0px", googleCss: fonts("Archivo:wght@700;800", "Inter:wght@400;500;600;700") },
  { name: "teal-mint", label: "Deep teal and mint", bg: "#082026", surface: "#0f2c33", ink: "#e4f1f0", bright: "#f4fbfa", muted: "#86a6a6", accent: "#7df0c8", accentInk: "#082026", glow: "rgba(60, 190, 170, 0.18)",
    display: '"Sora", Arial, sans-serif', displayName: "Sora", body: '"Rubik", Arial, sans-serif', bodyName: "Rubik", weight: 600, tracking: "-0.025em", letterCase: "none",
    radius: "14px", radiusSmall: "10px", buttonRadius: "14px", googleCss: fonts("Sora:wght@500;600", "Rubik:wght@400;500;600") },
  { name: "espresso-cream", label: "Espresso and cream", bg: "#1c1512", surface: "#28201b", ink: "#f0e9e2", bright: "#fdf8f1", muted: "#ab9c8f", accent: "#f3e3c3", accentInk: "#1c1512", glow: "rgba(200, 150, 100, 0.14)",
    display: '"Playfair Display", Georgia, serif', displayName: "Playfair Display", body: '"Lato", Arial, sans-serif', bodyName: "Lato", weight: 600, tracking: "0em", letterCase: "none",
    radius: "6px", radiusSmall: "4px", buttonRadius: "6px", googleCss: fonts("Playfair+Display:wght@500;600", "Lato:wght@400;700") },
  { name: "ink-sky", label: "Ink and sky", bg: "#0b1024", surface: "#141a36", ink: "#e6eaf6", bright: "#f6f8ff", muted: "#8f98b8", accent: "#8fd3ff", accentInk: "#0b1024", glow: "rgba(90, 120, 230, 0.2)",
    display: '"Space Grotesk", Arial, sans-serif', displayName: "Space Grotesk", body: '"Inter", Arial, sans-serif', bodyName: "Inter", weight: 500, tracking: "-0.035em", letterCase: "none",
    radius: "22px", radiusSmall: "14px", buttonRadius: "999px", googleCss: fonts("Space+Grotesk:wght@500;600", "Inter:wght@400;500;600;700") },
  { name: "oxblood-peach", label: "Oxblood and peach", bg: "#1f0f12", surface: "#2c171b", ink: "#f3e8e6", bright: "#fff6f3", muted: "#b39a98", accent: "#ffc9a3", accentInk: "#1f0f12", glow: "rgba(220, 110, 100, 0.16)",
    display: '"Abril Fatface", Georgia, serif', displayName: "Abril Fatface", body: '"Poppins", Arial, sans-serif', bodyName: "Poppins", weight: 400, tracking: "0.005em", letterCase: "none",
    radius: "30px", radiusSmall: "18px", buttonRadius: "999px", googleCss: fonts("Abril+Fatface", "Poppins:wght@400;500;600") },
];

// How the chapters are named: the "lore" the visitor reads the story through.
export const journeyLores = {
  chapters: (n: number, _of: number, name: string) => ({ lead: `Chapter ${n}`, rest: name }),
  scenes: (n: number, _of: number, name: string) => ({ lead: `Scene ${n}`, rest: name }),
  stops: (n: number, of: number, name: string) => ({ lead: `Stop ${n} of ${of}`, rest: name }),
  pages: (n: number, _of: number, name: string) => ({ lead: `Page ${n}`, rest: name }),
} as const;
export type JourneyLore = keyof typeof journeyLores;
export const journeySides = ["right", "left"] as const;
export const journeyOrbits = ["dotted", "dashed", "double", "none"] as const;
export const themeNames = journeyThemes.map((t) => t.name) as [string, ...string[]];
export const loreNames = Object.keys(journeyLores) as [JourneyLore, ...JourneyLore[]];

export type StoryStyleChoice = { seed?: string; theme?: string; lore?: JourneyLore; side?: (typeof journeySides)[number]; orbit?: (typeof journeyOrbits)[number] };

/** A steady number from a string (FNV-1a, then a mixing step), so the same seed always gives the same look. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  // A final stir, so the separate choices made from one seed do not move together.
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
const pick = <T,>(list: readonly T[], seed: string, part: string) => list[hash(`${part}:${seed}`) % list.length];

/** The look for one story site: whatever its record pins, and the seed's choice for the rest. */
export function journeyStyle(site: { slug: string; storyStyle?: StoryStyleChoice }) {
  const choice = site.storyStyle ?? {};
  const seed = choice.seed ?? site.slug;
  return {
    seed,
    theme: journeyThemes.find((t) => t.name === choice.theme) ?? pick(journeyThemes, seed, "theme"),
    lore: choice.lore ?? pick(loreNames, seed, "lore"),
    side: choice.side ?? pick(journeySides, seed, "side"),
    orbit: choice.orbit ?? pick(journeyOrbits, seed, "orbit"),
  };
}

/** A theme as the CSS variables the story pages are built on. */
export function themeVars(t: JourneyTheme): CSSProperties {
  return {
    "--bg": t.bg, "--surface": t.surface, "--ink": t.ink, "--bright": t.bright, "--muted": t.muted, "--accent": t.accent, "--accent-ink": t.accentInk, "--glow": t.glow,
    "--font-display": t.display, "--font-body": t.body, "--font-accent": t.body, "--display-weight": t.weight, "--display-tracking": t.tracking, "--display-case": t.letterCase,
    "--radius": t.radius, "--radius-small": t.radiusSmall, "--button-radius": t.buttonRadius,
  } as CSSProperties;
}
