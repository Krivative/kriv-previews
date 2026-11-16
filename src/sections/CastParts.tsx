import type { ReactNode } from "react";
import { expressions } from "@/stories/casts/types";

// Shared parts for cast drawings (preview-only). Every character is inline SVG
// in the site's theme colours (CSS variables), so it follows every theme, and
// every character wears the same six faces: the story's own emoticons.

/** One character, drawn in a 120 x 140 box. `data-cast-art` is what the animations move. */
export function Figure({ label, children }: { label: string; children: ReactNode }) {
  return <svg viewBox="0 0 120 140" role="img" aria-label={label} data-cast-art="">{children}</svg>;
}

const ink = { fill: "none", stroke: "var(--cast-face, var(--ink))", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const dot = { fill: "var(--cast-face, var(--ink))" } as const;

/** The six expressions, centred on (x, y); `size` 1 fits a face about 44 wide. Only the one in use is shown. */
export function Face({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  const faces: Record<(typeof expressions)[number], ReactNode> = {
    neutral: <><circle cx="-11" cy="-4" r="3.2" {...dot} /><circle cx="11" cy="-4" r="3.2" {...dot} /><path d="M-7 9 H7" {...ink} /></>,
    happy: <><path d="M-15 -3 q4 -6 8 0" {...ink} /><path d="M7 -3 q4 -6 8 0" {...ink} /><path d="M-8 7 q8 9 16 0" {...ink} /></>,
    surprised: <><circle cx="-11" cy="-5" r="4.6" {...ink} /><circle cx="11" cy="-5" r="4.6" {...ink} /><circle cx="0" cy="10" r="3.6" {...ink} /></>,
    thinking: <><circle cx="-11" cy="-4" r="3.2" {...dot} /><path d="M6 -4 H16" {...ink} /><path d="M-2 10 q6 -3 10 1" {...ink} /><path d="M5 -13 l10 -3" {...ink} /></>,
    cheeky: <><circle cx="-11" cy="-4" r="3.2" {...dot} /><path d="M6 -4 q5 -5 10 0" {...ink} /><path d="M-8 7 q10 8 16 -2" {...ink} /></>,
    concerned: <><circle cx="-11" cy="-3" r="3.2" {...dot} /><circle cx="11" cy="-3" r="3.2" {...dot} /><path d="M-17 -12 l10 3" {...ink} /><path d="M17 -12 l-10 3" {...ink} /><path d="M-7 11 q7 -6 14 0" {...ink} /></>,
  };
  return <g transform={`translate(${x} ${y}) scale(${size})`}>{expressions.map((name) => <g key={name} data-face={name}>{faces[name]}</g>)}</g>;
}
