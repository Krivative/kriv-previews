import type { ReactNode } from "react";
import type { JourneyGenre } from "@/stories/journey-style";
import type { CastRole, UsherWords } from "./types";

// The costume layer (preview-only): a genre dresses any cast without touching
// its lines. It gives each role a title, one small prop, and the usher its own
// wording for the two lock notices and the "next chapter" cue.
//
// A genre is chosen by the story's seed, tied to how the chapters are named
// (src/stories/journey-style.ts), and can be pinned in a lead's `storyStyle`.
// Props are original inline SVG in the theme's colours, drawn in a 40 x 40 box.
// The wording is about the story's own controls only: no facts, no figures.

export type Genre = { label: string; titles: Record<CastRole, string>; props: Record<CastRole, ReactNode>; words: (unit: string) => UsherWords };

const line = { fill: "none", stroke: "var(--ink)", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const solid = { fill: "var(--accent)", stroke: "var(--ink)", strokeWidth: 2.4, strokeLinejoin: "round" } as const;
const paper = { fill: "var(--surface)", stroke: "var(--ink)", strokeWidth: 2.4, strokeLinejoin: "round" } as const;
const mark = { fill: "var(--ink)" } as const;

const Prop = ({ children }: { children: ReactNode }) => <svg viewBox="0 0 40 40" aria-hidden="true" data-cast-prop="">{children}</svg>;

/** A character's drawing with its prop beside it. */
export const dress = (art: ReactNode, prop: ReactNode) => <>{art}{prop}</>;

export const genres: Record<Exclude<JourneyGenre, "plain">, Genre> = {
  "film-crew": {
    label: "Film crew",
    titles: { guide: "director", expert: "script supervisor", heckler: "blooper reel", usher: "clapper loader" },
    props: {
      // megaphone
      guide: <Prop><path d="M8 16 L26 8 V32 L8 24 Z" {...solid} /><rect x="4" y="16" width="5" height="8" rx="1.5" {...paper} /><path d="M31 14 q4 6 0 12" {...line} /></Prop>,
      // script on a clipboard
      expert: <Prop><rect x="8" y="7" width="24" height="28" rx="3" {...paper} /><rect x="15" y="4" width="10" height="6" rx="2" {...solid} /><path d="M13 17 H27 M13 23 H27 M13 29 H22" {...line} /></Prop>,
      // popcorn
      heckler: <Prop><path d="M10 18 H30 L27 36 H13 Z" {...paper} /><path d="M17 18 L18 36 M23 18 L22 36" {...line} /><circle cx="13" cy="13" r="5" {...solid} /><circle cx="20" cy="10" r="5" {...solid} /><circle cx="27" cy="13" r="5" {...solid} /></Prop>,
      // clapperboard
      usher: <Prop><rect x="5" y="16" width="30" height="19" rx="2" {...paper} /><path d="M5 16 L33 7 L34.5 11.5 L6.5 20.5 Z" {...solid} /><path d="M13 13.5 l3 4 M21 11 l3 4 M28 8.6 l3 4" {...line} /></Prop>,
    },
    words: (unit) => ({
      playing: `Still rolling. The next ${unit} opens when this take ends.`,
      forward: `This reel only runs forward. You can move freely after the last ${unit}.`,
      next: `And cut. Scroll for the next ${unit}`,
    }),
  },
  "ships-crew": {
    label: "Ship's crew",
    titles: { guide: "captain", expert: "navigator", heckler: "stowaway", usher: "bosun" },
    props: {
      // ship's wheel
      guide: <Prop><circle cx="20" cy="20" r="11" {...paper} /><circle cx="20" cy="20" r="3.5" {...solid} /><path d="M20 4 V36 M4 20 H36 M8.7 8.7 L31.3 31.3 M31.3 8.7 L8.7 31.3" {...line} /></Prop>,
      // compass
      expert: <Prop><circle cx="20" cy="21" r="14" {...paper} /><path d="M20 10 L24 21 L20 32 L16 21 Z" {...solid} /><circle cx="20" cy="21" r="1.6" {...mark} /><path d="M17 5 H23" {...line} /></Prop>,
      // barrel
      heckler: <Prop><path d="M11 6 H29 Q34 20 29 34 H11 Q6 20 11 6 Z" {...paper} /><path d="M8.5 14 H31.5 M8.5 26 H31.5" {...line} /><circle cx="20" cy="20" r="2.6" {...solid} /></Prop>,
      // signal flag
      usher: <Prop><path d="M9 5 V37" {...line} /><path d="M9 7 H33 L27 14 L33 21 H9 Z" {...solid} /></Prop>,
    },
    words: (unit) => ({
      playing: `Steady as she goes. The next ${unit} opens when this one ends.`,
      forward: `This voyage sails one way. You can roam freely once we dock at the last ${unit}.`,
      next: `Fair wind. Scroll for the next ${unit}`,
    }),
  },
  "kitchen-brigade": {
    label: "Kitchen brigade",
    titles: { guide: "head chef", expert: "sous chef", heckler: "taster", usher: "expediter" },
    props: {
      // chef's hat
      guide: <Prop><path d="M11 22 Q3 20 6 13 Q9 7 15 10 Q20 3 25 10 Q31 7 34 13 Q37 20 29 22 Z" {...paper} /><rect x="11" y="22" width="18" height="11" rx="1.5" {...solid} /></Prop>,
      // whisk
      expert: <Prop><path d="M20 22 V37" {...line} /><path d="M20 22 Q8 14 20 4 Q32 14 20 22 Z" {...paper} /><path d="M20 22 Q15 13 20 4 Q25 13 20 22" {...line} /><rect x="17.5" y="22" width="5" height="5" rx="1" {...solid} /></Prop>,
      // tasting spoon
      heckler: <Prop><ellipse cx="14" cy="13" rx="8" ry="10" transform="rotate(-35 14 13)" {...solid} /><path d="M19 20 L35 36" {...line} /></Prop>,
      // service bell
      usher: <Prop><path d="M7 29 Q7 13 20 13 Q33 13 33 29 Z" {...solid} /><path d="M4 31 H36" {...line} /><circle cx="20" cy="9.5" r="3" {...paper} /></Prop>,
    },
    words: (unit) => ({
      playing: `Still cooking. The next ${unit} is served when this one is done.`,
      forward: `The courses come out in order. You can go back for seconds after the last ${unit}.`,
      next: `Order up. Scroll for the next ${unit}`,
    }),
  },
  "pit-crew": {
    label: "Pit crew",
    titles: { guide: "crew chief", expert: "race engineer", heckler: "backmarker", usher: "flag marshal" },
    props: {
      // headset
      guide: <Prop><path d="M8 24 V20 Q8 7 20 7 Q32 7 32 20 V24" {...line} /><rect x="4" y="21" width="8" height="12" rx="3" {...solid} /><rect x="28" y="21" width="8" height="12" rx="3" {...solid} /><path d="M8 33 Q10 38 19 37" {...line} /><circle cx="21" cy="37" r="1.8" {...mark} /></Prop>,
      // wrench
      expert: <Prop><path d="M27 4 a8 8 0 0 0 -9 11 L5 28 a3.6 3.6 0 0 0 5 5 L23 20 a8 8 0 0 0 11 -9 l-5 5 l-5 -1 l-1 -5 Z" {...solid} /></Prop>,
      // tyre
      heckler: <Prop><circle cx="20" cy="20" r="15" {...paper} /><circle cx="20" cy="20" r="7" {...solid} /><path d="M20 5 V9 M20 31 V35 M5 20 H9 M31 20 H35" {...line} /></Prop>,
      // chequered flag
      usher: <Prop><path d="M8 5 V37" {...line} /><rect x="8" y="6" width="26" height="18" {...paper} /><path d="M8 6 h8.67 v6 h-8.67 Z M25.33 6 h8.67 v6 h-8.67 Z M16.67 12 h8.66 v6 h-8.66 Z M8 18 h8.67 v6 h-8.67 Z M25.33 18 h8.67 v6 h-8.67 Z" {...mark} /></Prop>,
    },
    words: (unit) => ({
      playing: `Hold in the box. The next ${unit} opens when this one ends.`,
      forward: `No reversing on the track. You can move freely after the last ${unit}.`,
      next: `Green light. Scroll for the next ${unit}`,
    }),
  },
};
