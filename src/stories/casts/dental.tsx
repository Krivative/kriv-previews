import type { CSSProperties } from "react";
import { Face, Figure } from "@/sections/CastParts";
import type { CastFile } from "./types";

// The cast of the dental story. Original characters, drawn from the same parts
// as the story's main drawing; none is based on a real person or on any
// existing mascot or character.
//
// DRAFT LINES: the clinic approves its cast's lines before they are final.
// Serious lines are general, well-established dental facts: no claims about
// the clinic, no promised results, no medical advice. The heckler teases the
// scene and the other characters, never the visitor.

const TOOTH = "M60 22 C46 12 14 15 13 52 C12 80 23 91 27 119 C29 135 34 138 40 138 C50 138 49 110 60 110 C71 110 70 138 80 138 C86 138 91 135 93 119 C97 91 108 80 107 52 C106 15 74 12 60 22 Z";
const line = { fill: "none", stroke: "var(--ink)", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const body = { fill: "var(--surface)", stroke: "var(--ink)", strokeWidth: 3, strokeLinejoin: "round" } as const;

/** A chibi dentist: big head, small body, white coat, a dentist's mirror in hand. */
const dentist = <Figure label="The dentist, a small cartoon guide">
  <path d="M42 88 Q60 80 78 88 L84 132 Q60 138 36 132 Z" {...body} />
  <path d="M60 86 V132" {...line} strokeWidth={2} />
  <path d="M52 86 L60 98 L68 86" {...line} strokeWidth={2} />
  <circle cx="60" cy="112" r="2.4" fill="var(--accent)" />
  <path d="M40 132 v6 M52 134 v5 M68 134 v5 M80 132 v6" {...line} />
  <path d="M40 96 Q26 104 28 116" {...line} />
  <g data-part="arm">
    <path d="M80 96 Q96 92 100 74" {...line} />
    <path d="M100 74 L106 52" {...line} strokeWidth={2.4} />
    <circle cx="108" cy="44" r="9" fill="color-mix(in srgb, var(--accent) 30%, var(--surface))" stroke="var(--ink)" strokeWidth={2.4} />
  </g>
  <circle cx="60" cy="48" r="38" {...body} />
  <path d="M24 42 Q30 8 60 10 Q92 8 96 44 Q84 26 60 28 Q38 26 24 42 Z" fill="var(--ink)" />
  <path d="M30 30 Q60 20 90 30" fill="none" stroke="var(--accent)" strokeWidth={4} strokeLinecap="round" />
  <circle cx="60" cy="24" r="6" fill="var(--accent)" stroke="var(--ink)" strokeWidth={2} />
  <Face x={60} y={56} />
</Figure>;

/** The tooth itself. */
const tooth = <Figure label="The tooth, a small cartoon expert">
  <path d={TOOTH} {...body} />
  <path d="M28 46 C28 32 37 26 46 25" {...line} opacity={0.5} />
  <g data-part="arm"><path d="M104 66 Q116 60 114 46" {...line} /></g>
  <Face x={60} y={62} size={1.05} />
</Figure>;

/** A grumpy bit of plaque. */
const plaque = <Figure label="A bit of plaque, a small cartoon heckler">
  <path d="M30 70 Q14 60 26 46 Q24 28 44 32 Q54 16 70 30 Q92 22 94 44 Q112 52 98 70 Q108 92 84 94 Q76 112 58 100 Q36 110 34 90 Q16 86 30 70 Z" fill="var(--plaque, #cfc77c)" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />
  <g data-part="arm"><path d="M96 78 Q110 84 108 98" {...line} /></g>
  <path d="M34 122 q8 -8 16 0 M70 122 q8 -8 16 0" {...line} />
  <g style={{ "--cast-face": "var(--deep, #101112)" } as CSSProperties}><Face x={60} y={62} /></g>
</Figure>;

/** The toothbrush. */
const brush = <Figure label="The toothbrush, a small cartoon usher">
  <rect x="44" y="34" width="32" height="100" rx="14" {...body} />
  <rect x="38" y="8" width="44" height="30" rx="8" {...body} />
  {[0, 1, 2, 3].map((n) => <rect key={n} x={43 + n * 9.5} y="-2" width="6" height="12" rx="3" fill="var(--accent)" />)}
  <g data-part="arm"><path d="M76 84 Q92 80 94 64" {...line} /></g>
  <path d="M44 90 Q30 96 30 110" {...line} />
  <Face x={60} y={66} size={0.6} />
</Figure>;

export const dentalCast: CastFile = {
  story: "dental-journey",
  draft: true,
  members: {
    guide: { role: "guide", name: "The dentist", art: dentist, lines: {
      smile: [{ text: "Hello. I'll point things out as we go.", move: "wave" }],
      tooth: [{ text: "That bright line is the enamel." }],
      meal: [{ text: "Watch the crumbs. This is where it starts." }],
      plaque: [{ text: "Those soft dots are the plaque.", face: "thinking" }],
      spot: [{ text: "See the small ring? That is the spot.", face: "concerned" }],
      checkup: [{ text: "This mirror shows the side you cannot see." }],
      home: [{ text: "Along the gum line, and gently." }],
      again: [{ text: "Come inside. The clinic is next.", move: "wave" }],
    } },
    expert: { role: "expert", name: "The tooth", art: tooth, lines: {
      smile: [{ text: "A full adult set has thirty-two of us.", face: "happy" }],
      tooth: [{ text: "Enamel has no living cells. It cannot grow back." }],
      meal: [{ text: "Saliva helps rinse food away between meals." }],
      plaque: [{ text: "Plaque starts to form again within hours of brushing." }],
      spot: [{ text: "An early spot often gives no pain at all.", face: "concerned" }],
      checkup: [{ text: "Tartar is hardened plaque. Brushing cannot shift it." }],
      home: [{ text: "Fluoride helps enamel stand up to acid.", face: "happy" }],
      again: [{ text: "Looked after, a tooth can last a lifetime.", face: "happy" }],
    } },
    heckler: { role: "heckler", name: "A bit of plaque", art: plaque, lines: {
      smile: [{ text: "Nice smile. Very dramatic lighting." }],
      tooth: [{ text: "Hardest tissue in the body, it says. We'll see." }],
      meal: [{ text: "Finally. Lunch.", face: "happy", move: "hop" }],
      plaque: [{ text: "That's me. I prefer \"a quiet film\"." }],
      spot: [{ text: "I didn't do it. The acid did.", face: "surprised" }],
      checkup: [{ text: "Not the mirror. Anything but the mirror.", face: "concerned", move: "peek" }],
      home: [{ text: "Two whole minutes? Rude.", face: "concerned" }],
      again: [{ text: "Fine. I'll be back after dinner." }],
    } },
    usher: { role: "usher", name: "The toothbrush", art: brush, lines: {} },
  },
  tease: { text: "Going backwards? The plot hasn't changed.", face: "cheeky", move: "shrug" },
  end: "That was the last chapter. The page is yours now.",
};
