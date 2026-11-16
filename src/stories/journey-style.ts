import type { CSSProperties } from "react";

// The randomizer for story sites (preview-only). A story site's look is not
// coded per client: it is chosen from the lists below by a seed. By default the
// seed is the lead's slug, so every lead gets its own combination and keeps it
// on every visit. `storyStyle` in the lead record can pin any part, or give a
// new seed to reshuffle (`pnpm story:shuffle <slug>`).
//
// What varies: the colour theme (dark and light grounds) and typefaces, the layout (see below), the corner shapes, how chapters
// are named, which side the drawing sits on, and the ring around it. What does
// not vary: the story's words (a recorded voice-over reads them) and the
// guardrails.

const mono = "JetBrains+Mono:wght@400;600";
const fonts = (...families: string[]) => `https://fonts.googleapis.com/css2?${[...families, mono].map((f) => `family=${f}`).join("&")}&display=swap`;

export type JourneyTheme = {
  name: string; label: string;
  dark: boolean; deep: string; bg: string; surface: string; ink: string; bright: string; muted: string; accent: string; accentInk: string; glow: string;
  display: string; displayName: string; body: string; bodyName: string;
  weight: number; tracking: string; letterCase: "uppercase" | "none";
  radius: string; radiusSmall: string; buttonRadius: string; googleCss: string;
  /** Suits a grown-up register (see `journeyAudiences`). `only` keeps a theme out of the general pool. */
  adult?: boolean; only?: "adults";
  /** Heading sizes were tuned for a wide, uppercase face; a small-bodied serif needs them larger. Default 1. */
  scale?: number;
};

export const journeyThemes: JourneyTheme[] = [
  { name: "night-lime", label: "Night and lime", dark: true, deep: "#0d141c", bg: "#0d141c", surface: "#16222e", ink: "#eceef1", bright: "#f6f8fa", muted: "#8d9cab", accent: "#e7fa78", accentInk: "#0d141c", glow: "rgba(60, 150, 170, 0.16)",
    display: '"Lexend Zetta", "Manrope", Arial, sans-serif', displayName: "Lexend Zetta", body: '"Manrope", Arial, sans-serif', bodyName: "Manrope", weight: 300, tracking: "0.07em", letterCase: "uppercase",
    radius: "22px", radiusSmall: "14px", buttonRadius: "999px", googleCss: fonts("Lexend+Zetta:wght@200;300;400", "Manrope:wght@400;500;600;700") },
  { name: "forest-gold", label: "Forest and gold", dark: true, deep: "#0f1a14", bg: "#0f1a14", surface: "#17261d", ink: "#e9efe9", bright: "#f7faf5", muted: "#93a698", accent: "#f2c14e", accentInk: "#0f1a14", glow: "rgba(96, 160, 110, 0.18)",
    display: '"Fraunces", Georgia, serif', displayName: "Fraunces", body: '"Outfit", Arial, sans-serif', bodyName: "Outfit", weight: 400, tracking: "-0.015em", letterCase: "none",
    radius: "18px", radiusSmall: "12px", buttonRadius: "999px", googleCss: fonts("Fraunces:opsz,wght@9..144,400;9..144,500", "Outfit:wght@400;500;600;700"), adult: true },
  { name: "plum-rose", label: "Plum and rose", dark: true, deep: "#1a1020", bg: "#1a1020", surface: "#251830", ink: "#efe8f2", bright: "#fbf6fd", muted: "#a996b3", accent: "#ff9ec4", accentInk: "#1a1020", glow: "rgba(170, 100, 200, 0.2)",
    display: '"Syne", Arial, sans-serif', displayName: "Syne", body: '"Manrope", Arial, sans-serif', bodyName: "Manrope", weight: 700, tracking: "-0.02em", letterCase: "none",
    radius: "26px", radiusSmall: "16px", buttonRadius: "999px", googleCss: fonts("Syne:wght@600;700", "Manrope:wght@400;500;600;700") },
  { name: "charcoal-orange", label: "Charcoal and orange", dark: true, deep: "#151515", bg: "#151515", surface: "#1f1f1f", ink: "#ededea", bright: "#ffffff", muted: "#9c9c97", accent: "#ff8a3d", accentInk: "#151515", glow: "rgba(255, 138, 61, 0.1)",
    display: '"Archivo", Arial, sans-serif', displayName: "Archivo", body: '"Inter", Arial, sans-serif', bodyName: "Inter", weight: 800, tracking: "0.005em", letterCase: "uppercase",
    radius: "0px", radiusSmall: "0px", buttonRadius: "0px", googleCss: fonts("Archivo:wght@700;800", "Inter:wght@400;500;600;700") },
  { name: "teal-mint", label: "Deep teal and mint", dark: true, deep: "#082026", bg: "#082026", surface: "#0f2c33", ink: "#e4f1f0", bright: "#f4fbfa", muted: "#86a6a6", accent: "#7df0c8", accentInk: "#082026", glow: "rgba(60, 190, 170, 0.18)",
    display: '"Sora", Arial, sans-serif', displayName: "Sora", body: '"Rubik", Arial, sans-serif', bodyName: "Rubik", weight: 600, tracking: "-0.025em", letterCase: "none",
    radius: "14px", radiusSmall: "10px", buttonRadius: "14px", googleCss: fonts("Sora:wght@500;600", "Rubik:wght@400;500;600") },
  { name: "espresso-cream", label: "Espresso and cream", dark: true, deep: "#1c1512", bg: "#1c1512", surface: "#28201b", ink: "#f0e9e2", bright: "#fdf8f1", muted: "#ab9c8f", accent: "#f3e3c3", accentInk: "#1c1512", glow: "rgba(200, 150, 100, 0.14)",
    display: '"Playfair Display", Georgia, serif', displayName: "Playfair Display", body: '"Lato", Arial, sans-serif', bodyName: "Lato", weight: 600, tracking: "0em", letterCase: "none",
    radius: "6px", radiusSmall: "4px", buttonRadius: "6px", googleCss: fonts("Playfair+Display:wght@500;600", "Lato:wght@400;700"), adult: true },
  { name: "ink-sky", label: "Ink and sky", dark: true, deep: "#0b1024", bg: "#0b1024", surface: "#141a36", ink: "#e6eaf6", bright: "#f6f8ff", muted: "#8f98b8", accent: "#8fd3ff", accentInk: "#0b1024", glow: "rgba(90, 120, 230, 0.2)",
    display: '"Space Grotesk", Arial, sans-serif', displayName: "Space Grotesk", body: '"Inter", Arial, sans-serif', bodyName: "Inter", weight: 500, tracking: "-0.035em", letterCase: "none",
    radius: "22px", radiusSmall: "14px", buttonRadius: "999px", googleCss: fonts("Space+Grotesk:wght@500;600", "Inter:wght@400;500;600;700") },
  { name: "oxblood-peach", label: "Oxblood and peach", dark: true, deep: "#1f0f12", bg: "#1f0f12", surface: "#2c171b", ink: "#f3e8e6", bright: "#fff6f3", muted: "#b39a98", accent: "#ffc9a3", accentInk: "#1f0f12", glow: "rgba(220, 110, 100, 0.16)",
    display: '"Abril Fatface", Georgia, serif', displayName: "Abril Fatface", body: '"Poppins", Arial, sans-serif', bodyName: "Poppins", weight: 400, tracking: "0.005em", letterCase: "none",
    radius: "30px", radiusSmall: "18px", buttonRadius: "999px", googleCss: fonts("Abril+Fatface", "Poppins:wght@400;500;600") },
  // Light grounds: the same story in daylight.
  { name: "paper-pine", label: "Paper and pine", dark: false, deep: "#14261f", bg: "#f5f2ea", surface: "#ffffff", ink: "#1d2622", bright: "#0d1512", muted: "#5d6a63", accent: "#1f6b53", accentInk: "#ffffff", glow: "rgba(31, 107, 83, 0.12)",
    display: '"Fraunces", Georgia, serif', displayName: "Fraunces", body: '"Outfit", Arial, sans-serif', bodyName: "Outfit", weight: 500, tracking: "-0.02em", letterCase: "none",
    radius: "20px", radiusSmall: "12px", buttonRadius: "999px", googleCss: fonts("Fraunces:opsz,wght@9..144,400;9..144,500", "Outfit:wght@400;500;600;700"), adult: true },
  { name: "sky-coral", label: "Sky and coral", dark: false, deep: "#10202e", bg: "#eef4f8", surface: "#ffffff", ink: "#16232f", bright: "#0a141d", muted: "#586877", accent: "#c23a1e", accentInk: "#ffffff", glow: "rgba(70, 140, 200, 0.16)",
    display: '"Space Grotesk", Arial, sans-serif', displayName: "Space Grotesk", body: '"Inter", Arial, sans-serif', bodyName: "Inter", weight: 600, tracking: "-0.035em", letterCase: "none",
    radius: "12px", radiusSmall: "8px", buttonRadius: "12px", googleCss: fonts("Space+Grotesk:wght@500;600", "Inter:wght@400;500;600;700") },
  { name: "sand-violet", label: "Sand and violet", dark: false, deep: "#231a33", bg: "#f4eee6", surface: "#fffaf3", ink: "#2a2233", bright: "#170f22", muted: "#6c6177", accent: "#5b3fd1", accentInk: "#ffffff", glow: "rgba(120, 90, 220, 0.14)",
    display: '"Syne", Arial, sans-serif', displayName: "Syne", body: '"Manrope", Arial, sans-serif', bodyName: "Manrope", weight: 700, tracking: "-0.02em", letterCase: "none",
    radius: "28px", radiusSmall: "16px", buttonRadius: "999px", googleCss: fonts("Syne:wght@600;700", "Manrope:wght@400;500;600;700") },
  // Grown-up registers: quiet grounds, one restrained accent, a serif for the headings. Chosen only for an adult audience.
  { name: "porcelain-teal", label: "Porcelain and teal", dark: false, deep: "#0f2a2e", bg: "#f6f5f1", surface: "#ffffff", ink: "#1b2226", bright: "#0d1317", muted: "#5a666c", accent: "#0f5c63", accentInk: "#ffffff", glow: "rgba(15, 92, 99, 0.08)",
    display: '"Cormorant Garamond", Georgia, serif', displayName: "Cormorant Garamond", body: '"Inter", Arial, sans-serif', bodyName: "Inter", weight: 500, tracking: "-0.01em", letterCase: "none",
    radius: "4px", radiusSmall: "2px", buttonRadius: "4px", googleCss: fonts("Cormorant+Garamond:wght@500;600", "Inter:wght@400;500;600;700"), scale: 1.55, adult: true, only: "adults" },
  { name: "linen-bronze", label: "Linen and bronze", dark: false, deep: "#2a1d12", bg: "#f3ede4", surface: "#fbf7f0", ink: "#2a231c", bright: "#17110b", muted: "#6b5f52", accent: "#7a4a1e", accentInk: "#ffffff", glow: "rgba(122, 74, 30, 0.08)",
    display: '"DM Serif Display", Georgia, serif', displayName: "DM Serif Display", body: '"DM Sans", Arial, sans-serif', bodyName: "DM Sans", weight: 400, tracking: "-0.005em", letterCase: "none",
    radius: "10px", radiusSmall: "6px", buttonRadius: "999px", googleCss: fonts("DM+Serif+Display", "DM+Sans:wght@400;500;600;700"), scale: 1.35, adult: true, only: "adults" },
  { name: "slate-pearl", label: "Slate and pearl", dark: true, deep: "#14181c", bg: "#14181c", surface: "#1d2329", ink: "#e8eaec", bright: "#f7f8f9", muted: "#96a0a8", accent: "#e6d5b8", accentInk: "#14181c", glow: "rgba(230, 213, 184, 0.07)",
    display: '"Marcellus", Georgia, serif', displayName: "Marcellus", body: '"Inter", Arial, sans-serif', bodyName: "Inter", weight: 400, tracking: "0.01em", letterCase: "none",
    radius: "2px", radiusSmall: "2px", buttonRadius: "2px", googleCss: fonts("Marcellus", "Inter:wght@400;500;600;700"), scale: 1.35, adult: true, only: "adults" },
];
// Who the story is for. "general" is the full, playful range. "adults" is the grown-up
// register for general and aesthetic practices: quiet themes only, no cast unless the
// record asks for one, no costume, no dotted or dashed rings, no glass cards. The seed
// still chooses within that range, so two adult sites do not look alike.
export const journeyAudiences = ["general", "adults"] as const;
export type JourneyAudience = (typeof journeyAudiences)[number];
const generalThemes = journeyThemes.filter((t) => !t.only);
const adultThemes = journeyThemes.filter((t) => t.adult);

// How the chapters are named: the "lore" the visitor reads the story through.
export const journeyLores = {
  chapters: (n: number, _of: number, name: string) => ({ lead: `Chapter ${n}`, rest: name }),
  scenes: (n: number, _of: number, name: string) => ({ lead: `Scene ${n}`, rest: name }),
  stops: (n: number, of: number, name: string) => ({ lead: `Stop ${n} of ${of}`, rest: name }),
  pages: (n: number, _of: number, name: string) => ({ lead: `Page ${n}`, rest: name }),
} as const;
export type JourneyLore = keyof typeof journeyLores;
/** The word for one part of the story, for sentences such as "the next scene". */
export const loreUnits: Record<JourneyLore, string> = { chapters: "chapter", scenes: "scene", stops: "stop", pages: "page" };
// The cast's costume: a genre changes each character's title, one small prop and the
// usher's wording (src/stories/casts/genres.tsx). "plain" is no costume, and is only
// ever chosen by pinning it. Each way of naming the chapters has a genre it suits.
export const journeyGenres = ["plain", "film-crew", "ships-crew", "kitchen-brigade", "pit-crew"] as const;
export type JourneyGenre = (typeof journeyGenres)[number];
export const lorePartners: Record<JourneyLore, Exclude<JourneyGenre, "plain">> = { scenes: "film-crew", chapters: "ships-crew", pages: "kitchen-brigade", stops: "pit-crew" };
const costumes = journeyGenres.filter((g) => g !== "plain");
// The sound world: the room the visitor is standing in (src/stories/story-sound.ts). "plain" is the
// business's own room (a clinic sounds like a clinic). Two looks in three hear the world that suits their
// costume; the third is the seed's own pick. Sound never changes a word of the story.
export const soundWorlds = ["plain", "film-crew", "ships-crew", "kitchen-brigade", "pit-crew"] as const;
export type SoundWorld = (typeof soundWorlds)[number];
export const journeySides = ["right", "left"] as const;
export const journeyOrbits = ["dotted", "dashed", "double", "none"] as const;
export const themeNames = journeyThemes.map((t) => t.name) as [string, ...string[]];
export const loreNames = Object.keys(journeyLores) as [JourneyLore, ...JourneyLore[]];

// ---------- Layout: where everything sits on wide screens ----------
// Each of these is chosen by the seed and can be pinned in `storyStyle`. Phones and tablets
// always use one arrangement that is known to be safe; the choices apply from 900px wide.
export const journeyMarks = ["rail-right", "rail-left", "top"] as const; // the chapter marks
export const journeyBrands = ["top-centre", "top-left", "bottom-left"] as const; // the client's mark
export const journeyVoices = ["bottom-right", "bottom-left", "top-right"] as const; // narration and cast buttons
export const journeyCues = ["bottom-centre", "bottom-left", "bottom-right"] as const; // the "next chapter" notice
export const journeyWords = ["beside", "centred"] as const; // words beside the drawing, or centred under it
export const journeyMaps = ["ring", "line", "zigzag"] as const; // the level-two map
export const journeyCards = ["glass", "outlined", "solid"] as const;
export const journeyEntrances = ["edge", "under-words", "behind"] as const; // where the cast steps out
type Pick<T extends readonly string[]> = T[number];

export type StoryStyleChoice = {
  seed?: string; audience?: JourneyAudience; theme?: string; lore?: JourneyLore; genre?: JourneyGenre; sound?: SoundWorld; side?: Pick<typeof journeySides>; orbit?: Pick<typeof journeyOrbits>;
  marks?: Pick<typeof journeyMarks>; brand?: Pick<typeof journeyBrands>; voice?: Pick<typeof journeyVoices>; cue?: Pick<typeof journeyCues>;
  words?: Pick<typeof journeyWords>; map?: Pick<typeof journeyMaps>; cards?: Pick<typeof journeyCards>; entrance?: Pick<typeof journeyEntrances>;
};
export type JourneyLayout = Required<Pick2>;
type Pick2 = { marks: Pick<typeof journeyMarks>; brand: Pick<typeof journeyBrands>; voice: Pick<typeof journeyVoices>; cue: Pick<typeof journeyCues>; words: Pick<typeof journeyWords>; map: Pick<typeof journeyMaps>; cards: Pick<typeof journeyCards>; entrance: Pick<typeof journeyEntrances>; side: Pick<typeof journeySides> };

/**
 * Makes a set of layout choices safe: no two things may claim the same place. The rules are small and
 * fixed, so any seed and any pin ends in an arrangement with one element per place.
 */
export function resolveLayout(raw: Pick2): Pick2 {
  const l = { ...raw };
  // A row of chapter marks along the top takes the top centre: the brand moves to the top left.
  if (l.marks === "top" && l.brand === "top-centre") l.brand = "top-left";
  // The bottom left holds one thing: the brand first, then the buttons, then the notice.
  if (l.brand === "bottom-left" && l.voice === "bottom-left") l.voice = "bottom-right";
  if (l.cue === "bottom-left" && (l.brand === "bottom-left" || l.voice === "bottom-left")) l.cue = "bottom-centre";
  if (l.cue === "bottom-right" && l.voice === "bottom-right") l.cue = "bottom-centre";
  // The cast can only step out from under the words when the words sit beside the drawing.
  if (l.words === "centred" && l.entrance === "under-words") l.entrance = "edge";
  return l;
}

/** The place each element takes, per screen width. Used by the tests to prove nothing shares a place. */
export function layoutPlaces(l: Pick2, width: "phone" | "tablet" | "desktop"): Record<"brand" | "marks" | "voice" | "cue" | "cast", string> {
  if (width !== "desktop") return { brand: "top-row-1", marks: "top-row-2", voice: "top-row-3", cue: "bottom-centre", cast: "drawing-lower-right" };
  return { brand: l.brand, marks: l.marks === "top" ? "top-centre" : l.marks, voice: l.voice, cue: l.cue, cast: l.words === "centred" ? "drawing-band-right" : `cast-${l.entrance}-${l.entrance === "under-words" ? (l.side === "left" ? "right" : "left") : l.side}-above-bottom-band` };
}

/** A steady number from a string (FNV-1a, then a mixing step), so the same seed always gives the same look. */
export function seedNumber(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  // A final stir, so the separate choices made from one seed do not move together.
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
const pick = <T,>(list: readonly T[], seed: string, part: string) => list[seedNumber(`${part}:${seed}`) % list.length];

/** The look for one story site: whatever its record pins, and the seed's choice for the rest. */
export function journeyStyle(site: { slug: string; storyStyle?: StoryStyleChoice }) {
  const choice = site.storyStyle ?? {};
  const seed = choice.seed ?? site.slug;
  const adults = choice.audience === "adults";
  const lore = choice.lore ?? pick(adults ? (["chapters", "pages"] as const) : loreNames, seed, "lore");
  // Two looks in three wear the genre that suits their chapter naming; the third is the seed's own pick. An adult audience wears no costume.
  const genre = choice.genre ?? (adults ? "plain" : seedNumber(`genre-tie:${seed}`) % 3 ? lorePartners[lore] : pick(costumes, seed, "genre"));
  return {
    seed,
    audience: (adults ? "adults" : "general") as JourneyAudience,
    genre,
    // The same rule one layer down: two in three hear their costume's room, the third the seed's pick. An adult audience hears the plain room.
    sound: choice.sound ?? (adults ? "plain" : seedNumber(`sound-tie:${seed}`) % 3 ? genre : pick(soundWorlds, seed, "sound")) as SoundWorld,
    theme: journeyThemes.find((t) => t.name === choice.theme) ?? pick(adults ? adultThemes : generalThemes, seed, "theme"),
    lore,
    side: choice.side ?? pick(journeySides, seed, "side"),
    orbit: choice.orbit ?? pick(adults ? (["none", "double"] as const) : journeyOrbits, seed, "orbit"),
    layout: resolveLayout({
      side: choice.side ?? pick(journeySides, seed, "side"),
      marks: choice.marks ?? pick(journeyMarks, seed, "marks"),
      brand: choice.brand ?? pick(journeyBrands, seed, "brand"),
      voice: choice.voice ?? pick(journeyVoices, seed, "voice"),
      cue: choice.cue ?? pick(journeyCues, seed, "cue"),
      words: choice.words ?? pick(journeyWords, seed, "words"),
      map: choice.map ?? pick(journeyMaps, seed, "map"),
      cards: choice.cards ?? pick(adults ? (["outlined", "solid"] as const) : journeyCards, seed, "cards"),
      entrance: choice.entrance ?? pick(journeyEntrances, seed, "entrance"),
    }),
  };
}

/** The look as data attributes on the page's root: the stylesheets do the rest. */
export function lookAttributes(look: ReturnType<typeof journeyStyle>) {
  const l = look.layout;
  return { "data-theme-name": look.theme.name, "data-genre": look.genre, "data-sound": look.sound, "data-audience": look.audience, "data-side": look.side, "data-orbit": look.orbit, "data-marks": l.marks, "data-brand": l.brand, "data-voice": l.voice, "data-cue": l.cue, "data-words": l.words, "data-map": l.map, "data-cards": l.cards, "data-entrance": l.entrance };
}

/** A theme as the CSS variables the story pages are built on. */
export function themeVars(t: JourneyTheme): CSSProperties {
  return {
    "--deep": t.deep, "--line": `color-mix(in srgb, ${t.ink} 16%, transparent)`, "--strike": t.dark ? "#ff6b6b" : "#c8322b", "--shade": t.dark ? "rgba(0, 0, 0, 0.35)" : "rgba(40, 30, 60, 0.14)", "--bg": t.bg, "--surface": t.surface, "--ink": t.ink, "--bright": t.bright, "--muted": t.muted, "--accent": t.accent, "--accent-ink": t.accentInk, "--glow": t.glow,
    "--font-display": t.display, "--font-body": t.body, "--font-accent": t.body, "--display-weight": t.weight, "--display-tracking": t.tracking, "--display-case": t.letterCase, "--display-scale": t.scale ?? 1,
    "--radius": t.radius, "--radius-small": t.radiusSmall, "--button-radius": t.buttonRadius,
  } as CSSProperties;
}

// ---------- KRIV's own rates page ----------
// The rates page runs through the same style system as lead stories, pinned here (Kriv's pick, 2026-11-16:
// "sand and violet"). It must never look like a client's story: see the test that compares it with PCO.
export const ratesStyle: StoryStyleChoice = { theme: "sand-violet", lore: "stops", genre: "plain", sound: "plain", side: "left", orbit: "double", marks: "rail-left", brand: "top-left", voice: "bottom-right", cue: "bottom-centre", words: "beside", map: "line", cards: "outlined", entrance: "edge" };
export const ratesLook = () => journeyStyle({ slug: "ph-rates", storyStyle: ratesStyle });
