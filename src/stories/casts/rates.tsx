import type { CSSProperties } from "react";
import { MAX_BUNDLE_SAVING, TRIAL_DAYS, annualPay, annualPlans, annualWorth, crm, decisionWindows, monthlyServices, percent, php, totalMonths } from "@/offers/ph-local";
import { Face, Figure } from "@/sections/CastParts";
import type { CastFile } from "./types";

// The cast of the rates story. Original characters; none is based on any
// existing anime, game or mascot character.
//
// The host is an adult cat-eared presenter (Kriv's pick, 2026-11-16): a grown
// professional in a blazer in the page's theme colours. Her charm is in
// expression, pose and wording only. Outfit and poses are for a business
// pricing page that clients and their staff open at work.
//
// DRAFT LINES: Kriv approves them before they are final. Every figure comes
// from src/offers/ph-local.ts. The heckler teases the scene and the other
// characters, never the visitor.

const line = { fill: "none", stroke: "var(--ink)", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const body = { fill: "var(--surface)", stroke: "var(--ink)", strokeWidth: 3, strokeLinejoin: "round" } as const;
const website = annualPlans[0];
const best = decisionWindows[0];

/** The host: an adult presenter with cat ears and a tail, in a blazer. */
const host = <Figure label="The host, a presenter with cat ears, in a blazer">
  <path d="M84 132 C112 132 116 104 104 92 C98 86 104 78 110 80" fill="none" stroke="var(--ink)" strokeWidth={6} strokeLinecap="round" />
  <path d="M26 140 L30 92 Q33 76 50 72 L70 72 Q87 76 90 92 L94 140 Z" fill="var(--accent)" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />
  <path d="M50 72 L60 96 L70 72 Z" {...body} />
  <path d="M50 72 L60 96 L48 110 L42 82 Z M70 72 L60 96 L72 110 L78 82 Z" fill="var(--accent)" stroke="var(--accent-ink)" strokeWidth={1.6} strokeLinejoin="round" />
  <circle cx="74" cy="104" r="2.6" fill="var(--accent-ink)" />
  <path d="M30 96 Q20 108 24 124" {...line} stroke="var(--accent)" strokeWidth={9} />
  <g data-part="arm">
    <path d="M90 94 Q106 88 108 68" {...line} stroke="var(--accent)" strokeWidth={9} />
    <circle cx="109" cy="62" r="6.5" {...body} strokeWidth={2.4} />
  </g>
  <rect x="54" y="58" width="12" height="18" rx="5" {...body} strokeWidth={2.4} />
  <path d="M41 30 L39 8 L55 21 Z M79 30 L81 8 L65 21 Z" fill="var(--ink)" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />
  <path d="M44 25 L43 15 L51 22 Z M76 25 L77 15 L69 22 Z" fill="var(--accent)" />
  <path d="M38 42 Q38 20 60 20 Q82 20 82 42 Q82 60 60 68 Q38 60 38 42 Z" {...body} />
  <path d="M37 44 Q33 18 60 16 Q88 18 83 46 Q80 30 62 27 Q46 32 37 44 Z" fill="var(--ink)" />
  <Face x={60} y={46} size={0.68} />
</Figure>;

/** The price pill. */
const pill = <Figure label="The price, a small cartoon expert">
  <rect x="8" y="46" width="104" height="58" rx="29" {...body} />
  <circle cx="92" cy="40" r="13" fill="var(--accent)" stroke="var(--ink)" strokeWidth={3} />
  <path d="M88 40 h8 M92 35 v10" stroke="var(--accent-ink)" strokeWidth={2.6} strokeLinecap="round" />
  <g data-part="arm"><path d="M110 82 Q120 76 116 62" {...line} /></g>
  <path d="M40 104 v14 M80 104 v14" {...line} />
  <Face x={60} y={76} />
</Figure>;

/** The crossed-out price. */
const struck = <Figure label="The old price, a small cartoon heckler">
  <rect x="14" y="42" width="92" height="62" rx="12" fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} strokeDasharray="7 6" strokeLinejoin="round" />
  <g data-part="arm"><path d="M104 88 Q116 92 114 106" {...line} /></g>
  <path d="M38 104 v14 M82 104 v14" {...line} />
  <Face x={60} y={72} />
  <path d="M6 96 L114 48" stroke="var(--strike, #c8322b)" strokeWidth={5} strokeLinecap="round" />
</Figure>;

/** The day counter. */
const counter = <Figure label="The day counter, a small cartoon usher">
  <rect x="24" y="30" width="72" height="84" rx="12" {...body} />
  <path d="M24 52 H96" {...line} />
  <rect x="24" y="30" width="72" height="22" rx="12" fill="var(--accent)" stroke="var(--ink)" strokeWidth={3} />
  <path d="M42 22 v16 M78 22 v16" {...line} />
  <g data-part="arm"><path d="M96 86 Q110 82 110 68" {...line} /></g>
  <path d="M44 114 v12 M76 114 v12" {...line} />
  <g style={{ "--cast-face": "var(--ink)" } as CSSProperties}><Face x={60} y={82} size={0.8} /></g>
</Figure>;

export const ratesCast: CastFile = {
  story: "rates-journey",
  draft: true,
  members: {
    guide: { role: "guide", name: "Your host", art: host, lines: {
      start: [{ text: "Welcome in. I'll walk the floor with you.", move: "wave" }],
      trial: [{ text: `${TRIAL_DAYS} days on the house. Good odds.`, face: "cheeky" }],
      services: [{ text: "Five on the menu. One is plenty to start." }],
      paying: [{ text: "One door after the trial. It opens yearly.", face: "cheeky" }],
      annual: [{ text: "The filled tiles are the free months." }],
      dates: [{ text: "The brightest days are the generous ones." }],
      bundles: [{ text: "Taller bar, bigger discount. That simple." }],
      monthly: [{ text: "One or a stack. Both are good calls.", face: "thinking" }],
      yours: [{ text: "This rule is my favourite one.", face: "happy" }],
      decide: [{ text: "That is the tour. The builder is just below.", move: "wave" }],
    } },
    expert: { role: "expert", name: "The price", art: pill, lines: {
      start: [{ text: "Every figure here comes from one price list.", face: "happy" }],
      trial: [{ text: "The trial costs nothing. There is no setup fee." }],
      services: [{ text: `Website and content: ${php(monthlyServices[0].monthly)} a month each, paid yearly.` }],
      paying: [{ text: `Annual is paid once, for ${crm.baseMonths} months.` }],
      annual: [{ text: `${php(annualPay(website))} against ${php(annualWorth(website, best))}. Same ${totalMonths(best)} months.` }],
      dates: [{ text: `Days ${best.fromDay} to ${best.toDay}: ${best.freeMonths} free months.` }],
      bundles: [{ text: `The whole saving stops at ${percent(MAX_BUNDLE_SAVING)}.` }],
      monthly: [{ text: "Stacking lowers the yearly price. One service keeps it simple." }],
      yours: [{ text: "Extra work gets its price before it starts." }],
      decide: [{ text: `The best window closes on day ${best.toDay}.` }],
    } },
    heckler: { role: "heckler", name: "The old price", art: struck, lines: {
      start: [{ text: "Don't mind me. I'm only here to be crossed out." }],
      trial: [{ text: "Free? Nobody ever called me free.", face: "concerned" }],
      services: [{ text: "Five of them, and not one is me." }],
      paying: [{ text: "One plan, and still nobody pays me. Rude." }],
      annual: [{ text: "That red line through me still stings.", face: "concerned" }],
      dates: [{ text: "Tick, tock. Not my problem, mind.", move: "shrug" }],
      bundles: [{ text: "They keep making me smaller.", face: "surprised" }],
      monthly: [{ text: "Stack them and I shrink again. Lovely.", face: "concerned" }],
      yours: [{ text: "At least nobody owns me." }],
      decide: [{ text: "Go on, cross me out. Everyone does." }],
    } },
    usher: { role: "usher", name: "The day counter", art: counter, lines: {} },
  },
  tease: { text: "Going back to see me? Touching.", face: "cheeky", move: "shrug" },
  end: "That was the last stop. The page is yours now.",
};
