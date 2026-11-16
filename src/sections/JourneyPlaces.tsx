import type { ReactNode } from "react";
import w from "./journey-world.module.css";

// Where each chapter of the dental story happens (preview-only). One location per chapter, in the
// order of src/stories/dental-journey.ts, drawn in the theme's colours and the same thin lines as the
// chapter drawings. The location of the chapter in view fades in behind it (journey-world.module.css,
// keyed on the story's data-step), so the background always fits the words in front of it.
// Decoration only: no words, no claims.

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const L = w.line, A = w.accentLine, S = w.solid, D = w.accentDot;

/** 1 / The start: a bedroom window at sunrise. */
function Morning() {
  return <>
    <circle className={w.moon} cx="1180" cy="330" r="90" />
    {range(14).map((i) => <path key={i} className={A} d={`M1180 330 m${Math.cos(i / 2.23) * 120} ${Math.sin(i / 2.23) * 120} l${Math.cos(i / 2.23) * 34} ${Math.sin(i / 2.23) * 34}`} />)}
    <path className={L} d="M900 120 H1460 V620 H900 Z M1180 120 V620 M900 370 H1460" />
    <path className={S} d="M860 100 Q920 380 880 660 H830 V100 Z M1500 100 Q1440 380 1480 660 H1530 V100 Z" />
    <path className={L} d="M1000 700 H1560 V820 H1000 Z M1000 700 Q1000 620 1100 620 H1460 Q1560 620 1560 700" />
    <path className={w.ticket} d="M1050 660 Q1050 630 1090 630 H1260 Q1290 630 1290 660 V680 H1050 Z" />
    <path className={L} d="M1560 760 V560 M1600 760 V600 M1560 600 q-40 -40 -10 -90 M1560 640 q40 -30 20 -80" />
    <rect className={S} x="1520" y="740" width="100" height="70" rx="8" />
  </>;
}

/** 2 / The tooth: a cross-section, enamel, dentin, the pulp and the gum. */
function Tooth() {
  return <g transform="translate(1180 120)">
    <path className={w.tooth} d="M-200 0 Q-260 0 -250 120 Q-240 240 -180 300 L-150 640 Q-140 700 -100 640 L-40 380 Q0 360 40 380 L100 640 Q140 700 150 640 L180 300 Q240 240 250 120 Q260 0 200 0 Q120 -30 0 20 Q-120 -30 -200 0 Z" />
    <path className={A} d="M-210 20 Q-250 100 -220 220 Q-190 300 -150 320 M210 20 Q250 100 220 220 Q190 300 150 320 M-200 0 Q-120 -30 0 20 Q120 -30 200 0" />
    <path className={L} d="M-160 60 Q-170 200 -110 300 L-90 560 M160 60 Q170 200 110 300 L90 560" />
    <path className={w.pulp} d="M-80 120 Q0 80 80 120 Q100 240 40 330 L60 560 Q0 600 -60 560 L-40 330 Q-100 240 -80 120 Z" />
    <path className={w.gum} d="M-420 360 Q-300 300 -180 330 Q0 380 180 330 Q300 300 420 360 V780 H-420 Z" />
  </g>;
}

/** 3 / The day: a breakfast table. */
function Meal() {
  return <>
    <path className={w.counter} d="M-40 640 H1640 V900 H-40 Z" />
    <path className={A} d="M-40 640 H1640" />
    <ellipse className={S} cx="1050" cy="600" rx="230" ry="46" />
    <ellipse className={w.ticket} cx="1050" cy="586" rx="170" ry="30" />
    {range(6).map((i) => <circle key={i} className={D} cx={980 + i * 26} cy={574 - (i % 2) * 8} r="9" />)}
    <path className={S} d="M1340 470 H1480 V600 Q1410 630 1340 600 Z M1480 500 q50 0 50 40 q0 40 -50 40" />
    {range(3).map((i) => <path key={i} className={w.steam} style={{ animationDelay: `${i * 0.8}s` }} d={`M${1380 + i * 30} 450 q-14 -30 0 -60 q14 -30 0 -60`} />)}
    <path className={S} d="M650 520 Q760 640 870 520 Z" />
    <path className={L} d="M650 520 H870 M700 500 q20 -20 40 0 q20 -20 40 0 q20 -20 40 0" />
    <path className={L} d="M560 630 V500 M540 500 V540 Q560 560 580 540 V500 M1290 630 V500 Q1320 520 1290 560" />
    <path className={L} d="M120 200 H560 V420 H120 Z M340 200 V420" />
  </>;
}

/** 4 / The film: close up on the tooth's surface, where plaque gathers. */
function Film() {
  return <>
    <path className={w.tooth} d="M-40 760 Q400 700 800 740 T1640 700 V900 H-40 Z" />
    <path className={w.plaqueBand} d="M-40 760 Q400 700 800 740 T1640 700 V760 Q1200 780 800 790 T-40 820 Z" />
    {range(16).map((i) => <g key={i} className={w.wobble} style={{ animationDelay: `${(i % 6) * 0.5}s` }} transform={`translate(${700 + (i * 113) % 900} ${170 + (i * 71) % 300})`}>
      <ellipse className={w.germ} rx={26 + (i % 3) * 10} ry={16 + (i % 2) * 8} />
      <path className={L} d="M-10 -4 h4 M8 2 h4" />
    </g>)}
  </>;
}

/** 5 / The spot: acid drips onto the enamel and a small weak spot appears. */
function Spot() {
  return <>
    <path className={w.tooth} d="M-40 760 Q400 720 800 740 T1640 720 V900 H-40 Z" />
    <ellipse className={w.decay} cx="1160" cy="742" rx="70" ry="20" />
    <path className={L} d="M1100 742 l-20 36 M1210 746 l26 30" />
    {range(5).map((i) => <path key={i} className={w.drip} style={{ animationDelay: `${i * 0.7}s` }} d={`M${1080 + i * 40} 160 q-14 26 0 36 q14 -10 0 -36 Z`} />)}
    <path className={L} d="M980 120 H1360" />
  </>;
}

/** 6 / The check-up: the clinic room, with the chair, the lamp and the tray. */
function Clinic() {
  return <>
    <path className={L} d="M720 100 H1060 V420 H720 Z M890 100 V420" />
    <g className={w.sweep}><path className={w.beamFill} d="M1180 260 L1010 640 H1350 Z" /></g>
    <path className={L} d="M1500 80 V160 Q1500 200 1300 220" /><path className={A} d="M1130 220 H1300 L1270 270 H1160 Z" />
    <path className={S} d="M960 700 H1440 L1500 640 Q1520 600 1480 590 H1100 Q1060 520 1000 520 Q940 520 940 580 Z" />
    <path className={L} d="M1180 700 V800 M1060 800 H1300" />
    <path className={w.ticket} d="M1460 470 H1600 V500 H1460 Z" /><path className={L} d="M1530 500 V640 M1480 486 h20 M1520 486 h20 M1560 486 h20" />
    <path className={L} d="M120 300 H520 V760 H120 Z M120 450 H520 M120 600 H520 M300 360 v30 M300 510 v30 M300 660 v30" />
  </>;
}

/** 7 / At home: the bathroom sink, the mirror and the toothbrush. */
function Home() {
  return <>
    {range(9).map((i) => <path key={i} className={w.tile} d={`M0 ${100 + i * 90} H1600`} />)}
    {range(18).map((i) => <path key={i} className={w.tile} d={`M${i * 90} 100 V900`} />)}
    <rect className={w.mirror} x="880" y="120" width="460" height="360" rx="30" />
    <path className={L} d="M940 200 l60 -60 M960 260 l110 -110" />
    <path className={S} d="M820 600 H1400 Q1400 720 1110 730 Q820 720 820 600 Z" />
    <path className={L} d="M1110 520 V600 M1110 520 H1180 V550" />
    <rect className={S} x="1450" y="500" width="80" height="100" rx="10" />
    <path className={A} d="M1470 500 L1460 380 M1500 500 L1520 390" /><path className={L} d="M1450 380 h24 M1508 390 h26" />
    <path className={w.ticket} d="M1300 590 L1440 560 L1446 586 L1306 616 Z" />
    {range(8).map((i) => <circle key={i} className={w.bubble} style={{ animationDelay: `${i * 0.5}s` }} cx={1000 + i * 40} cy={560 - (i % 3) * 20} r={6 + (i % 3) * 3} />)}
  </>;
}

/** 8 / The smile goes on: evening, the town and a clean, sparkling sky. */
function Evening() {
  return <>
    <circle className={w.moon} cx="1200" cy="560" r="120" />
    <path className={w.counter} d="M-40 620 H1640 V900 H-40 Z" />
    {range(14).map((i) => <path key={i} className={S} d={`M${560 + i * 80} 620 V${480 - (i % 4) * 50} H${620 + i * 80} V620`} />)}
    {range(22).map((i) => <path key={i} className={w.sparkle} style={{ animationDelay: `${(i % 8) * 0.35}s` }} d={`M${640 + (i * 173) % 920} ${110 + (i * 89) % 300} m0 -14 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z`} />)}
  </>;
}

const dental: (() => ReactNode)[] = [Morning, Tooth, Meal, Film, Spot, Clinic, Home, Evening];

/** The dental story's locations, one per chapter. */
export function DentalPlaces() {
  return <>{dental.map((Place, n) => <g key={n} className={w.place} data-place={n}><Place /></g>)}</>;
}
