import type { CSSProperties } from "react";
import { seedNumber } from "@/stories/journey-style";
import d from "./sneaker.module.css";

// A concept revamp of DV Shop Cebu's own badge (preview-only). It stays close to the
// shop's logo: a dark disc inside a light ring, outlined D and V letters, a rule,
// "SHOP CEBU" and "EST.2020". What the randomizer varies is only the finish: the ring,
// how the letters are drawn, and the accent stitch. The look's seed picks one
// (Kriv, 2026-11-17: "feeding it through the randomizer to pick the best out of their
// style"); the brand page shows the pick and its siblings, so Kriv can pin another.
// It is a proposal for the DV Shop team to approve, not the shop's official mark.

export const logoRings = ["single", "double", "stitched"] as const;
export const logoLetters = ["outline", "inline", "solid"] as const;
export const logoAccents = ["none", "rule", "dot"] as const;
export type DvLogoStyle = { ring: (typeof logoRings)[number]; letters: (typeof logoLetters)[number]; accent: (typeof logoAccents)[number] };

/** The randomizer's pick for this look: the same seed always gives the same badge. */
export function dvLogoStyle(seed: string): DvLogoStyle {
  const n = (part: string, len: number) => seedNumber(`logo-${part}:${seed}`) % len;
  return { ring: logoRings[n("ring", 3)], letters: logoLetters[n("letters", 3)], accent: logoAccents[n("accent", 3)] };
}

/** Every combination, for the brand page's "siblings" row. */
export const allDvLogoStyles: DvLogoStyle[] = logoRings.flatMap((ring) => logoLetters.map((letters, i) => ({ ring, letters, accent: logoAccents[(i + logoRings.indexOf(ring)) % 3] })));

// The two letters as single strokes on a 240 x 240 badge, interlocked like the shop's own.
const D = "M78 70 L78 150 L104 150 C134 150 150 132 150 110 C150 88 134 70 104 70 Z";
const V = "M118 70 L144 150 L170 70";

const tones = {
  dark: { "--dv-disc": "#0b0b0b", "--dv-ring": "#f4f1ec", "--dv-ink": "#f4f1ec", "--dv-accent": "var(--accent)" },
  light: { "--dv-disc": "#f4f1ec", "--dv-ring": "#0b0b0b", "--dv-ink": "#0b0b0b", "--dv-accent": "var(--accent)" },
  accent: { "--dv-disc": "var(--accent)", "--dv-ring": "var(--accent-ink)", "--dv-ink": "var(--accent-ink)", "--dv-accent": "var(--accent-ink)" },
} as const;
export type DvTone = keyof typeof tones;

export function DvLogo({ style, tone = "dark", compact = false, label = "DV Shop Cebu" }: { style: DvLogoStyle; tone?: DvTone; compact?: boolean; label?: string }) {
  const lettersClass = style.letters === "solid" ? d.lettersSolid : style.letters === "inline" ? d.lettersInline : d.lettersOutline;
  return <svg className={compact ? d.logoMark : d.logoBadge} style={tones[tone] as CSSProperties} viewBox="0 0 240 240" role="img" aria-label={`${label} logo, concept revamp`} data-ring={style.ring} data-letters={style.letters} data-accent={style.accent}>
    <circle className={d.disc} cx="120" cy="120" r="104" />
    <circle className={d.ring} cx="120" cy="120" r="112" />
    {style.ring === "double" ? <circle className={d.ringThin} cx="120" cy="120" r="96" /> : null}
    {style.ring === "stitched" ? <circle className={d.stitch} cx="120" cy="120" r="97" /> : null}
    <g className={lettersClass} transform={compact ? "translate(-4 18)" : undefined}>
      <path d={D} /><path d={V} />
      {style.letters === "inline" ? <g className={d.inner}><path d={D} /><path d={V} /></g> : null}
    </g>
    {compact ? null : <>
      <line className={d.rule} x1="74" y1="164" x2="166" y2="164" />
      <text className={d.word} x="120" y="186">SHOP CEBU</text>
      <text className={d.est} x="120" y="204">EST.2020</text>
      {style.accent === "rule" ? <line className={d.accentLine} x1="100" y1="164" x2="140" y2="164" /> : null}
      {style.accent === "dot" ? <circle className={d.accentDot} cx="176" cy="74" r="6" /> : null}
    </>}
  </svg>;
}

/** Kriv's personal brand mark for the owner: "Dop-", in the same family as the DV badge. */
export function DopMark({ style, tone = "dark" }: { style: DvLogoStyle; tone?: DvTone }) {
  return <svg className={d.logoBadge} style={tones[tone] as CSSProperties} viewBox="0 0 240 240" role="img" aria-label="Dop- personal mark, concept">
    <circle className={d.disc} cx="120" cy="120" r="104" />
    <circle className={d.ring} cx="120" cy="120" r="112" />
    {style.ring === "double" ? <circle className={d.ringThin} cx="120" cy="120" r="96" /> : null}
    {style.ring === "stitched" ? <circle className={d.stitch} cx="120" cy="120" r="97" /> : null}
    <text className={`${d.dop} ${style.letters === "solid" ? d.dopSolid : ""}`} x="112" y="138">Dop</text>
    <line className={d.dash} x1="168" y1="124" x2="196" y2="124" />
    <text className={d.est} x="120" y="186">PERSONAL MARK</text>
  </svg>;
}
