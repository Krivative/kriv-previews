import { useId, type CSSProperties } from "react";
import j from "./journey.module.css";

// A concept redraw of the clinic's own logo in the journey's look (preview-only).
// It keeps the logo's parts as the clinic drew them: three teeth that step down
// in size and carry the clinic's letters, a line beneath them, a toothbrush at
// the top left, an open ring, and the clinic's name set around the ring.
// Kriv chose the "solid teeth" version (2026-11-16). It is a proposal for the
// clinic to approve, not the clinic's official mark.

const TOOTH = "M200 96 C176 78 122 84 120 148 C119 196 138 214 144 262 C148 296 152 334 168 334 C184 334 182 286 200 286 C218 286 216 334 232 334 C248 334 252 296 256 262 C262 214 281 196 280 148 C278 84 224 78 200 96 Z";
// Each tooth: left edge, top edge and scale of the 160 x 250 tooth drawing.
const teeth = [{ x: 40, y: 74, k: 0.36 }, { x: 106, y: 84, k: 0.29 }, { x: 160, y: 94, k: 0.22 }];

// The same drawing on each ground it has to live on.
const NAVY = "#0d141c";
const tones = {
  navy: { "--logo-tooth": "#eceef1", "--logo-letter": NAVY, "--logo-line": "#e7fa78", "--logo-ring": "rgba(170, 200, 212, 0.55)", "--logo-text": "#eceef1", "--logo-brush": "#eceef1", "--logo-bristle": "#e7fa78" },
  lime: { "--logo-tooth": NAVY, "--logo-letter": "#e7fa78", "--logo-line": NAVY, "--logo-ring": "rgba(13, 20, 28, 0.45)", "--logo-text": NAVY, "--logo-brush": NAVY, "--logo-bristle": NAVY },
  light: { "--logo-tooth": NAVY, "--logo-letter": "#ffffff", "--logo-line": "#2b7f92", "--logo-ring": "rgba(13, 20, 28, 0.35)", "--logo-text": NAVY, "--logo-brush": NAVY, "--logo-bristle": "#2b7f92" },
} as const;
export type LogoTone = keyof typeof tones;

export function JourneyLogo({ letters, ring, compact = false, tone = "navy" }: { letters: string; ring?: string; compact?: boolean; tone?: LogoTone }) {
  const id = useId();
  const marks = letters.slice(0, 3).split("");
  return <svg className={compact ? j.logoMark : j.logoBadge} style={tones[tone] as CSSProperties} viewBox={compact ? "30 64 180 124" : "0 0 240 240"} role="img" aria-label={`${ring ?? letters} logo, concept redraw`}>
    {compact ? null : <>
      <circle className={j.logoRing} cx="120" cy="120" r="112" pathLength={100} transform="rotate(-128 120 120)" />
      <g transform="rotate(-38 48 48)">
        <rect className={j.logoBrush} x="22" y="36" width="52" height="9" rx="4.5" />
        {[0, 1, 2, 3, 4].map((n) => <rect key={n} className={j.logoBristle} x={27 + n * 9} y="45" width="6" height="13" rx="2.5" />)}
      </g>
      {ring ? <>
        <path id={id} d="M120 22 A98 98 0 1 1 119.9 22" fill="none" />
        <text className={j.logoText}><textPath href={`#${id}`} startOffset="3%">{ring}</textPath></text>
      </> : null}
    </>}
    {teeth.map((t, n) => <g key={n}>
      <path className={j.logoTooth} d={TOOTH} transform={`translate(${t.x} ${t.y}) scale(${t.k}) translate(-120 -84)`} />
      {marks[n] ? <text className={j.logoLetter} x={t.x + 80 * t.k} y={t.y + 86 * t.k} fontSize={74 * t.k}>{marks[n]}</text> : null}
    </g>)}
    <path className={j.logoSmile} d="M42 170 Q120 192 198 162" />
  </svg>;
}

/** The clinic's letters and the words around the ring, as on its own logo. */
export function logoWords(site: { business: { name: string; address: { city: string } } }) {
  const city = site.business.address.city.startsWith("[") ? "" : ` ${site.business.address.city}`;
  return { letters: site.business.name.split(" ")[0].toUpperCase(), ring: `${site.business.name}${city}`.toUpperCase() };
}
