import { useId } from "react";

// Code-drawn dental graphics for the PCO whole-site directions (23 Nov 2026). No photos of people, no stock,
// no paid generation: the same four subjects drawn in three art styles the randomizer can pick.
//   line:      fine single-weight line drawing, navy with a teal accent;
//   glass:     soft translucent gradients with highlights, like the ceramic molar;
//   blueprint: technical drawing with a grid, guide lines and anatomy labels.
export type ArtStyle = "line" | "glass" | "blueprint";
export type ArtSubject = "braces" | "implant" | "crown" | "plan";

const NAVY = "#1c2e44", TEAL = "#087759", SAGE = "#9fd3c9";

// One front tooth, centred on 0,0, about 34 wide and 52 tall.
const TOOTH = "M-15 -24 Q-17 6 -11 22 Q0 30 11 22 Q17 6 15 -24 Q0 -30 -15 -24 Z";
const MOLAR = "M-34 -20 Q-38 6 -28 18 Q-22 46 -14 50 Q-8 34 0 26 Q8 34 14 50 Q22 46 28 18 Q38 6 34 -20 Q24 -34 12 -26 Q0 -34 -12 -26 Q-24 -34 -34 -20 Z";

function Defs({ id, style }: { id: string; style: ArtStyle }) {
  return <defs>
    <linearGradient id={`${id}g`} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".55" stopColor="#e9f5f0" /><stop offset="1" stopColor={SAGE} /></linearGradient>
    <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#dfe7ee" /><stop offset="1" stopColor="#8fa3b6" /></linearGradient>
    <radialGradient id={`${id}h`}><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
    <filter id={`${id}s`} x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor={TEAL} floodOpacity=".18" /></filter>
    {style === "blueprint" && <pattern id={`${id}p`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke={TEAL} strokeOpacity=".14" strokeWidth="1" /></pattern>}
  </defs>;
}

// Paint for a solid part (tooth, crown) and a metal part (bracket, screw) in each style.
function paint(style: ArtStyle, id: string, part: "solid" | "metal" | "accent") {
  if (style === "line") return part === "accent" ? { fill: "none", stroke: TEAL, strokeWidth: 2.4 } : { fill: part === "metal" ? NAVY : "#fff", stroke: NAVY, strokeWidth: 2, fillOpacity: part === "metal" ? 0.9 : 1 };
  if (style === "glass") return part === "accent" ? { fill: "none", stroke: TEAL, strokeWidth: 3, strokeLinecap: "round" as const } : { fill: `url(#${id}${part === "metal" ? "m" : "g"})`, stroke: part === "metal" ? "#6d8296" : "#cfe3da", strokeWidth: 1, filter: `url(#${id}s)` };
  return part === "accent" ? { fill: "none", stroke: TEAL, strokeWidth: 1.6 } : { fill: part === "metal" ? "#dff0ea" : "#f4faf7", stroke: TEAL, strokeWidth: 1.3 };
}

function Label({ style, x, y, children, anchor = "start" }: { style: ArtStyle; x: number; y: number; children: string; anchor?: "start" | "end" | "middle" }) {
  if (style !== "blueprint") return null;
  return <text x={x} y={y} textAnchor={anchor} fontFamily="'Courier New', monospace" fontSize="10" letterSpacing="1.5" fill={TEAL}>{children.toUpperCase()}</text>;
}

function Braces({ style, id }: { style: ArtStyle; id: string }) {
  const teeth = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((k) => ({ x: 200 + k * 30, y: 118 + 3.2 * k * k, r: k * 3.4, s: 1 - Math.abs(k) * 0.045 }));
  const wire = teeth.map((t, i) => `${i ? "L" : "M"}${t.x} ${t.y + 4}`).join(" ");
  return <g>
    <path d="M40 92 Q200 40 360 92" {...paint(style, id, "accent")} strokeOpacity={style === "glass" ? 0.35 : 0.6} />
    {teeth.map((t, i) => <g key={i} transform={`translate(${t.x} ${t.y}) rotate(${t.r}) scale(${t.s})`}>
      <path d={TOOTH} {...paint(style, id, "solid")} />
      {style === "glass" && <ellipse cx="-5" cy="-12" rx="5" ry="9" fill={`url(#${id}h)`} />}
      <rect x="-6" y="-2" width="12" height="11" rx="2.5" {...paint(style, id, "metal")} />
    </g>)}
    <path d={wire} {...paint(style, id, "accent")} />
    <Label style={style} x={44} y={250}>bracket</Label><Label style={style} x={356} y={250} anchor="end">archwire</Label>
    {style === "blueprint" && <><path d="M80 236 L118 170 M320 236 L262 140" stroke={TEAL} strokeWidth="1" strokeDasharray="3 3" fill="none" /><circle cx="118" cy="170" r="3" fill={TEAL} /><circle cx="262" cy="140" r="3" fill={TEAL} /></>}
  </g>;
}

function Implant({ style, id }: { style: ArtStyle; id: string }) {
  const threads = Array.from({ length: 7 }, (_, i) => `M178 ${170 + i * 14} L222 ${176 + i * 14}`).join(" ");
  return <g>
    <rect x="60" y="150" width="280" height="130" rx={style === "line" ? 0 : 18} fill={style === "glass" ? "#eaf5f0" : style === "blueprint" ? "none" : "none"} stroke={style === "line" ? NAVY : TEAL} strokeOpacity={style === "line" ? 0.35 : 0.3} strokeDasharray={style === "blueprint" ? "5 5" : undefined} />
    <path d="M60 150 Q200 128 340 150" fill="none" stroke={TEAL} strokeWidth="2" strokeOpacity=".5" />
    <g transform="translate(200 88) scale(1.15)"><path d={MOLAR} {...paint(style, id, "solid")} />{style === "glass" && <ellipse cx="-14" cy="-10" rx="10" ry="14" fill={`url(#${id}h)`} />}</g>
    <rect x="186" y="140" width="28" height="22" rx="4" {...paint(style, id, "metal")} />
    <path d="M176 164 H224 L214 266 Q200 276 186 266 Z" {...paint(style, id, "metal")} />
    <path d={threads} stroke={style === "glass" ? "#6d8296" : style === "blueprint" ? TEAL : "#fff"} strokeWidth="1.6" fill="none" />
    <Label style={style} x={250} y={70}>crown</Label><Label style={style} x={236} y={152}>abutment</Label><Label style={style} x={236} y={226}>implant</Label>
    {style === "blueprint" && <path d="M240 66 H262 M226 148 H232 M226 222 H232" stroke={TEAL} strokeWidth="1" />}
  </g>;
}

function Crown({ style, id }: { style: ArtStyle; id: string }) {
  return <g>
    <g transform="translate(200 196) scale(1.25)"><path d={MOLAR} {...paint(style, id, "solid")} opacity={style === "line" ? 1 : 0.85} /></g>
    <g transform="translate(200 108) scale(1.3)">
      <path d="M-36 6 Q-40 -18 -24 -28 Q-12 -36 0 -28 Q12 -36 24 -28 Q40 -18 36 6 Q0 16 -36 6 Z" {...paint(style, id, "solid")} />
      {style === "glass" && <ellipse cx="-14" cy="-16" rx="10" ry="7" fill={`url(#${id}h)`} />}
    </g>
    <path d="M200 140 V166" {...paint(style, id, "accent")} strokeDasharray="4 5" />
    <path d="M192 158 L200 168 L208 158" {...paint(style, id, "accent")} />
    <Label style={style} x={268} y={100}>crown</Label><Label style={style} x={268} y={200}>prepared tooth</Label>
  </g>;
}

function Plan({ style, id }: { style: ArtStyle; id: string }) {
  const pts = [[70, 210], [150, 120], [250, 170], [330, 80]];
  const labels = ["consult", "written plan", "visits", "follow-up"];
  return <g>
    <path d={`M${pts[0][0]} ${pts[0][1]} C110 120 120 110 ${pts[1][0]} ${pts[1][1]} S220 190 ${pts[2][0]} ${pts[2][1]} S300 70 ${pts[3][0]} ${pts[3][1]}`} {...paint(style, id, "accent")} strokeDasharray={style === "blueprint" ? "6 5" : undefined} />
    {pts.map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>
      <circle r={i === 3 ? 22 : 16} {...paint(style, id, i === 3 ? "solid" : "metal")} />
      {i === 3 ? <path d="M-8 0 L-2 7 L9 -7" fill="none" stroke={TEAL} strokeWidth="3" strokeLinecap="round" /> : <text y="5" textAnchor="middle" fontSize="13" fontWeight="700" fontFamily="'Pco Sans', Arial, sans-serif" fill={style === "line" ? "#fff" : NAVY}>{i + 1}</text>}
    </g>)}
    {pts.map(([x, y], i) => <Label key={labels[i]} style={style} x={x} y={y + 40} anchor="middle">{labels[i]}</Label>)}
  </g>;
}

export function PcoArt({ subject, style, className, title }: { subject: ArtSubject; style: ArtStyle; className?: string; title: string }) {
  const id = useId().replace(/:/g, "");
  return <svg className={className} viewBox="0 0 400 300" role="img" aria-label={title} data-art={style}>
    <Defs id={id} style={style} />
    {style === "blueprint" && <rect width="400" height="300" fill={`url(#${id}p)`} />}
    {subject === "braces" && <Braces style={style} id={id} />}
    {subject === "implant" && <Implant style={style} id={id} />}
    {subject === "crown" && <Crown style={style} id={id} />}
    {subject === "plan" && <Plan style={style} id={id} />}
  </svg>;
}
