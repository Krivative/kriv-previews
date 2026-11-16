import type { ReactNode } from "react";
import type { SoundWorld } from "@/stories/journey-style";
import w from "./journey-world.module.css";

// The world a story travels through (preview-only). A wide line drawing behind the chapters, in the
// theme's own colours and the same thin-line style as the chapter drawings, so every look stays on brand.
// It moves one stage further with each chapter (`--journey-t`, 0 to 1, set by JourneyScroller), in three
// layers at different speeds, and small things in it move on their own (waves, steam, flags, beams).
// Which world: the look's sound world (journey-style.ts), so what the visitor sees and hears agree.
// "plain" is the business's own world. Decoration only: aria-hidden, no words, no facts.

const W = 4800; // the strip's width; the window shows 1600 of it
const H = 900;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
/** A wavy line across the whole strip. */
const wave = (y: number, amp: number, len: number) => `M-200 ${y} ${range(Math.ceil((W + 600) / len)).map(() => `q ${len / 4} ${-amp} ${len / 2} 0 t ${len / 2} 0`).join(" ")} L ${W + 400} ${H} L -200 ${H} Z`;

function Layer({ speed, children }: { speed: "far" | "mid" | "near"; children: ReactNode }) {
  return <g className={w[speed]}>{children}</g>;
}

function Sea() {
  return <>
    <Layer speed="far">
      {range(70).map((i) => <circle key={i} className={w.star} cx={(i * 337) % W} cy={40 + ((i * 151) % 360)} r={i % 5 ? 1.6 : 2.6} style={{ animationDelay: `${(i % 9) * 0.4}s` }} />)}
      <circle className={w.moon} cx="1250" cy="170" r="54" />
      {/* The harbour: a lighthouse and its beam, then open water, then a far coast. */}
      <path className={w.line} d="M180 560 L210 380 L250 380 L280 560 Z M195 470 H265 M200 420 H260" />
      <path className={w.accentLine} d="M215 380 H245 V350 H215 Z" />
      <g className={w.beam}><path className={w.beamFill} d="M230 365 L-140 300 L-140 430 Z" /></g>
      <path className={w.line} d="M0 560 Q120 520 300 560 T600 556" />
      <path className={w.line} d="M3900 560 Q4050 470 4200 500 T4520 470 T4800 520" />
      <path className={w.line} d="M4300 500 L4300 430 M4290 440 H4310" />
    </Layer>
    <Layer speed="mid">
      {range(9).map((i) => <g key={i} className={w.bob} style={{ animationDelay: `${i * 0.7}s` }} transform={`translate(${520 + i * 480} 600)`}>
        <path className={w.line} d="M-14 0 L0 -40 L14 0 Z" /><circle className={w.accentDot} cx="0" cy="-46" r="5" />
      </g>)}
      {range(7).map((i) => <path key={i} className={w.line} d={`M${700 + i * 610} ${250 + (i % 3) * 40} q14 -14 28 0 q14 -14 28 0`} />)}
    </Layer>
    <Layer speed="near">
      <g className={w.drift}><path className={w.waterFar} d={wave(640, 18, 220)} /></g>
      <g className={w.driftSlow}><path className={w.water} d={wave(700, 26, 300)} /></g>
      <g className={w.drift}><path className={w.waterNear} d={wave(780, 32, 380)} /></g>
    </Layer>
    {/* The ship stays with the visitor. */}
    <g className={w.bob} transform="translate(800 690)">
      <path className={w.solid} d="M-120 0 H120 L90 44 H-90 Z" />
      <path className={w.line} d="M0 0 V-170 M-6 -160 H6" />
      <path className={w.sail} d="M6 -160 Q90 -100 6 -20 Z" />
      <path className={w.sail} d="M-6 -140 Q-70 -90 -6 -30 Z" />
      <path className={w.accentLine} d="M0 -170 l30 8 l-30 8" />
    </g>
  </>;
}

function Studio() {
  return <>
    <Layer speed="far">
      {range(7).map((i) => <g key={i} transform={`translate(${200 + i * 640} 0)`}>
        <path className={w.line} d="M0 600 V330 Q180 250 360 330 V600" />
        <path className={w.line} d="M140 600 V480 H220 V600" />
        <text className={w.mark} x="180" y="410" textAnchor="middle">{i + 1}</text>
      </g>)}
      <path className={w.line} d="M3160 600 V360 M3240 600 V360 M3130 360 H3270 V290 Q3200 250 3130 290 Z" />
      {range(40).map((i) => <circle key={i} className={w.star} cx={(i * 419) % W} cy={50 + ((i * 97) % 220)} r="1.6" style={{ animationDelay: `${(i % 7) * 0.5}s` }} />)}
    </Layer>
    <Layer speed="mid">
      {range(9).map((i) => <g key={i} transform={`translate(${420 + i * 520} 640)`}>
        <path className={w.line} d="M0 0 V-220 M-40 0 L0 -60 L40 0" />
        <rect className={w.accentLine} x="-22" y="-252" width="44" height="32" rx="6" />
        <g className={w.sweep} style={{ animationDelay: `${i * 0.9}s` }}><path className={w.beamFill} d="M0 -236 L-150 -560 L150 -560 Z" /></g>
      </g>)}
    </Layer>
    <Layer speed="near">
      <path className={w.line} d={`M0 790 H${W} M0 820 H${W}`} />
      {range(160).map((i) => <path key={i} className={w.line} d={`M${i * 30} 790 v30`} />)}
      <g className={w.reel}>{range(90).map((i) => <rect key={i} className={w.frame} x={i * 60} y="840" width="44" height="30" rx="4" />)}</g>
    </Layer>
    {/* The camera rides the dolly with the visitor. */}
    <g transform="translate(800 760)">
      <rect className={w.solid} x="-70" y="-90" width="120" height="70" rx="12" />
      <circle className={w.accentLine} cx="-36" cy="-104" r="22" /><circle className={w.accentLine} cx="16" cy="-104" r="22" />
      <path className={w.solid} d="M50 -72 L100 -92 V-18 L50 -38 Z" />
      <path className={w.line} d="M-10 -20 V20 M-60 20 H40" />
      <circle className={w.wheel} cx="-50" cy="28" r="10" /><circle className={w.wheel} cx="30" cy="28" r="10" />
    </g>
  </>;
}

function Kitchen() {
  return <>
    <Layer speed="far">
      {/* Market, prep, the stove, the pass. */}
      {range(4).map((i) => <g key={i} transform={`translate(${120 + i * 300} 0)`}>
        <path className={w.line} d={`M0 360 ${range(5).map(() => "q 26 34 52 0").join(" ")} M0 360 H260 M10 360 V600 M250 360 V600`} />
        {range(4).map((k) => <circle key={k} className={w.accentDot} cx={40 + k * 60} cy="560" r="14" />)}
      </g>)}
      <path className={w.line} d="M1500 250 H3400" />
      {range(14).map((i) => <path key={i} className={w.line} d={`M${1560 + i * 130} 250 v40 m-26 0 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0`} />)}
      <path className={w.line} d="M2600 120 H3500 L3420 260 H2680 Z" />
      <path className={w.line} d="M3800 420 H4700 M3800 470 H4700" />
    </Layer>
    <Layer speed="mid">
      {range(6).map((i) => <g key={i} transform={`translate(${2300 + i * 260} 640)`}>
        <path className={w.solid} d="M-70 0 H70 V-70 Q0 -90 -70 -70 Z" />
        {range(3).map((k) => <path key={k} className={w.steam} style={{ animationDelay: `${(i + k) * 0.6}s` }} d={`M${-30 + k * 30} -96 q-16 -30 0 -60 q16 -30 0 -60`} />)}
      </g>)}
      <path className={w.line} d="M3800 330 H4700" />
      {range(7).map((i) => <g key={i} className={w.swing} style={{ animationDelay: `${i * 0.4}s` }} transform={`translate(${3860 + i * 120} 330)`}>
        <rect className={w.ticket} x="-34" y="6" width="68" height="96" rx="4" />
        <path className={w.line} d="M-20 34 H20 M-20 54 H14 M-20 74 H18" />
      </g>)}
    </Layer>
    <Layer speed="near">
      <path className={w.counter} d={`M-100 760 H${W + 100} V${H} H-100 Z`} />
      <path className={w.accentLine} d={`M-100 760 H${W + 100}`} />
      {range(24).map((i) => <circle key={i} className={w.line} cx={300 + i * 200} cy="800" r={i % 3 ? 22 : 34} />)}
    </Layer>
    {/* The bell stays on the pass with the visitor. */}
    <g transform="translate(800 740)"><path className={w.solid} d="M-56 0 Q-56 -60 0 -62 Q56 -60 56 0 Z" /><path className={w.accentLine} d="M-70 0 H70 M0 -62 V-76" /><circle className={w.accentDot} cx="0" cy="-80" r="7" /></g>
  </>;
}

function Track() {
  return <>
    <Layer speed="far">
      {/* Garage, pit lane, the grandstand, the finish. */}
      {range(5).map((i) => <path key={i} className={w.line} d={`M${80 + i * 220} 600 V420 H${260 + i * 220} V600 M${110 + i * 220} 600 V470 H${230 + i * 220} V600`} />)}
      <path className={w.line} d="M1300 600 L1500 380 H3300 L3500 600" />
      {range(120).map((i) => <circle key={i} className={w.crowd} cx={1540 + (i % 40) * 45} cy={430 + Math.floor(i / 40) * 50} r="7" style={{ animationDelay: `${(i % 11) * 0.3}s` }} />)}
      {range(4).map((i) => <path key={i} className={w.line} d={`M${1700 + i * 520} 380 V200 M${1660 + i * 520} 200 H${1740 + i * 520}`} />)}
      <path className={w.line} d="M4100 640 V300 M4600 640 V300 M4100 300 H4600 V360 H4100 Z" />
      {range(10).map((i) => <rect key={i} className={i % 2 ? w.solid : w.accentFill} x={4100 + i * 50} y="300" width="50" height="30" />)}
    </Layer>
    <Layer speed="mid">
      {range(70).map((i) => <path key={i} className={w.line} d={`M${i * 70} 680 V620`} />)}
      <path className={w.line} d={`M0 630 H${W} M0 660 H${W}`} />
      {range(8).map((i) => <g key={i} transform={`translate(${500 + i * 560} 560)`}><path className={w.line} d="M0 60 V-60" /><path className={w.flag} style={{ animationDelay: `${i * 0.3}s` }} d="M0 -60 q30 -12 60 0 q-30 12 0 0 v36 q30 -12 60 0 V-60" /></g>)}
    </Layer>
    <Layer speed="near">
      <path className={w.counter} d={`M-100 700 H${W + 100} V${H} H-100 Z`} />
      {range(60).map((i) => <rect key={i} className={i % 2 ? w.solid : w.accentFill} x={i * 80} y="700" width="80" height="14" />)}
      <g className={w.dashes}><path className={w.lane} d={`M-200 800 H${W + 200}`} /></g>
    </Layer>
    {/* The car stays with the visitor. */}
    <g transform="translate(800 790)">
      <path className={w.solid} d="M-130 0 Q-120 -40 -40 -46 L20 -76 H70 L120 -40 Q150 -30 150 0 Z" />
      <path className={w.accentLine} d="M-130 -10 H150" />
      <circle className={w.wheel} cx="-80" cy="2" r="24" /><circle className={w.wheel} cx="100" cy="2" r="24" />
    </g>
  </>;
}

function Smile() {
  // The dental business's own world: a day across a smile, from morning light through the meal,
  // the plaque clouds, the check-up lamp, and back to a clean, sparkling shore.
  return <>
    <Layer speed="far">
      <circle className={w.moon} cx="300" cy="200" r="70" />
      {range(12).map((i) => <path key={i} className={w.line} d={`M300 200 m${Math.cos(i / 1.91) * 92} ${Math.sin(i / 1.91) * 92} l${Math.cos(i / 1.91) * 28} ${Math.sin(i / 1.91) * 28}`} />)}
      {range(6).map((i) => <g key={i} className={w.cloud} style={{ animationDelay: `${i * 0.8}s` }} transform={`translate(${1700 + i * 260} ${180 + (i % 2) * 70})`}>
        <path className={w.plaque} d="M0 0 q20 -40 60 -20 q30 -30 60 0 q30 0 20 30 H0 q-20 -10 0 -10 Z" />
      </g>)}
      <g transform="translate(3150 120)"><path className={w.line} d="M0 0 V80" /><path className={w.accentLine} d="M-90 80 H90 L60 130 H-60 Z" /><g className={w.sweep}><path className={w.beamFill} d="M-60 130 L-220 520 H220 L60 130 Z" /></g></g>
      {range(26).map((i) => <path key={i} className={w.sparkle} style={{ animationDelay: `${(i % 8) * 0.35}s` }} d={`M${3700 + (i * 173) % 1050} ${120 + (i * 89) % 380} m0 -14 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z`} />)}
    </Layer>
    <Layer speed="mid">
      {range(30).map((i) => <circle key={i} className={w.bubble} style={{ animationDelay: `${(i % 10) * 0.6}s` }} cx={(i * 163) % W} cy={420 + (i * 47) % 200} r={6 + (i % 4) * 4} />)}
      {range(10).map((i) => <circle key={i} className={w.accentDot} cx={1000 + i * 70} cy={560 + (i % 3) * 14} r="6" />)}
    </Layer>
    <Layer speed="near">
      {/* The gum line, and a row of teeth like hills along it. */}
      <path className={w.counter} d={`M-100 780 H${W + 100} V${H} H-100 Z`} />
      {range(26).map((i) => <path key={i} className={w.tooth} d={`M${i * 190 - 20} 790 q-6 -120 30 -130 q30 -8 50 14 q20 -22 50 -14 q36 10 30 130 Z`} />)}
      <path className={w.accentLine} d={`M-100 790 ${range(40).map(() => "q 60 18 120 0").join(" ")}`} />
    </Layer>
  </>;
}

const worlds: Record<SoundWorld, () => ReactNode> = { "ships-crew": Sea, "film-crew": Studio, "kitchen-brigade": Kitchen, "pit-crew": Track, plain: Smile };

/** The world behind a story. `world` is the look's sound world; "plain" draws the business's own world.
 *  `places` (one location per chapter, see JourneyPlaces.tsx) sit in front: the story's own settings come
 *  first, and a costume world then only shows faintly behind them, as the horizon of the journey. */
export function JourneyWorld({ world, places }: { world: SoundWorld; places?: ReactNode }) {
  const Draw = worlds[world];
  return <div className={w.world} aria-hidden="true" data-world={world} data-places={places ? "" : undefined}>
    <div className={w.window}>
      <svg viewBox={`0 0 1600 ${H}`} preserveAspectRatio="xMidYMax slice" className={w.svg}>
        {places && world === "plain" ? null : <g className={w.horizon}><Draw /></g>}
        {places ? <g className={w.places}>{places}</g> : null}
      </svg>
    </div>
  </div>;
}
