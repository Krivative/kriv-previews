import type { CSSProperties } from "react";
import p from "./ph-rates.module.css";

// A looping strip of words (round 4, Kriv 23 Nov 2026: "a marquee or two that does not feel out of place").
// Two copies of the list slide by half their width, so the loop is seamless. It pauses on hover and stands still
// with reduced motion. Only the first copy is read by screen readers.
export function PhMarquee({ items, label, tone = "line", reverse = false, seconds = 40 }: { items: string[]; label?: string; tone?: "line" | "big"; reverse?: boolean; seconds?: number }) {
  const row = (hidden: boolean) => <ul className={p.marqueeRow} aria-hidden={hidden || undefined} aria-label={hidden ? undefined : label}>
    {items.map((x, i) => <li key={i}>{x}<span aria-hidden="true">×</span></li>)}
  </ul>;
  return <div className={p.marquee} data-tone={tone} data-reverse={reverse || undefined} aria-hidden={label ? undefined : true} style={{ "--secs": `${seconds}s` } as CSSProperties}>
    <div className={p.marqueeTrack}>{row(false)}{row(true)}</div>
  </div>;
}
