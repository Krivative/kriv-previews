import type { CSSProperties } from "react";
import { TRIAL_DAYS, annualPay, annualPlans, annualWorth, bundleTiers, crm, decisionWindows, monthlyServices, addOns, percent, php } from "@/offers/ph-local";
import { ratesJourney } from "@/stories/rates-journey";
import { buildCast } from "@/stories/casts";
import { ratesCast } from "@/stories/casts/rates";
import { journeyLores, ratesLook } from "@/stories/journey-style";
import { JourneyScroller } from "./JourneyScroller";
import o from "./offer.module.css";
import j from "./journey.module.css";
import r from "./rates-journey.module.css";
import { beatEffects, soundRoom } from "@/stories/story-sound";

// The scroll story at the top of the Philippine rates page (preview-only): the
// same journey format as a lead's story. One picture per chapter stays in view
// while the narration scrolls past. Figures come from src/offers/ph-local.ts.

const i = (n: number) => ({ "--i": n }) as CSSProperties;
const on = (cx: number, cy: number, radius: number, n: number, of: number) => {
  const a = (n / of) * Math.PI * 2 - Math.PI / 2;
  return { cx: cx + Math.cos(a) * radius, cy: cy + Math.sin(a) * radius };
};
const website = annualPlans[0];
const best = decisionWindows[0];
const services = [...monthlyServices.map((s) => ({ name: s.name, price: s.monthly })), { name: "CRM and system", price: crm.promoMonthly }, { name: addOns[1].name, price: addOns[1].price }];
// Which free-month window a trial day falls in: the earlier, the brighter.
const zone = (day: number) => `w${decisionWindows.find((w) => day >= w.fromDay && day <= (w.toDay ?? Infinity))?.freeMonths ?? 0}`;

function Stage() {
  return <div className={j.stage} aria-hidden="true">
    <svg viewBox="0 0 400 400" className={`${j.art} ${r.art}`}>
      <circle className={j.orbit} cx="200" cy="200" r="184" />
      <circle className={j.orbit2} cx="200" cy="200" r="160" />

      <g className={r.scene} data-journey-scene="">
        {/* The hero: Kriv, the founder, who built the system this page sells (his own photo, from kriv.agency). */}
        <defs><clipPath id="rates-hero-clip"><circle cx="200" cy="168" r="132" /></clipPath></defs>
        <circle className={r.heroRing} cx="200" cy="168" r="138" />
        <image href="/for/kriv-portrait-cutout.webp" x="40" y="22" width="320" height="320" clipPath="url(#rates-hero-clip)" preserveAspectRatio="xMidYMax slice" />
        <text className={r.wordmark} x="192" y="358" textAnchor="middle" style={{ fontSize: 52, letterSpacing: -3 }}>kriv</text>
        <text className={r.cross} x="256" y="356" textAnchor="middle" style={{ fontSize: 36 }}>×</text>
        <text className={r.small} x="200" y="388" textAnchor="middle">the brains behind the system</text>
      </g>

      <g className={r.scene} data-journey-scene="">
        {Array.from({ length: TRIAL_DAYS }, (_, n) => <circle key={n} className={r.day} r="11" {...on(200, 200, 120, n, TRIAL_DAYS)} style={i(n)} />)}
        <text className={r.big} x="200" y="212" textAnchor="middle">{TRIAL_DAYS}</text>
        <text className={r.small} x="200" y="240" textAnchor="middle">days free</text>
      </g>

      <g className={r.scene} data-journey-scene="">
        {services.map((s, n) => <g key={s.name} className={r.pop} style={i(n)}>
          <rect className={r.pill} x="56" y={74 + n * 54} width="288" height="42" rx="21" />
          <text className={r.label} x="78" y={100 + n * 54}>{s.name}</text>
          <text className={r.value} x="322" y={100 + n * 54} textAnchor="end">{php(s.price).replace("PHP ", "")}</text>
        </g>)}
      </g>

      <g className={r.scene} data-journey-scene="">
        <path className={r.path} d="M200 70 V170" pathLength={100} />
        <path className={r.path} d="M200 170 C200 230 110 220 110 270" pathLength={100} />
        <path className={`${r.path} ${r.pathWin}`} d="M200 170 C200 230 290 220 290 270" pathLength={100} />
        <circle className={r.node} cx="200" cy="66" r="9" />
        <g className={r.pop} style={i(4)}><rect className={r.pill} x="46" y="272" width="128" height="44" rx="22" /><text className={r.label} x="110" y="299" textAnchor="middle">Stop</text></g>
        <g className={r.pop} style={i(7)}><rect className={`${r.pill} ${r.pillWin}`} x="226" y="272" width="128" height="44" rx="22" /><text className={`${r.label} ${r.labelWin}`} x="290" y="299" textAnchor="middle">Annual</text></g>
      </g>

      <g className={r.scene} data-journey-scene="">
        {Array.from({ length: 15 }, (_, n) => <rect key={n} className={`${r.tile} ${n >= crm.baseMonths ? r.tileFree : ""} ${r.pop}`} x={62 + (n % 5) * 58} y={84 + Math.floor(n / 5) * 58} width="46" height="46" rx="10" style={i(n)} />)}
        <text className={r.struck} x="200" y="296" textAnchor="middle">{php(annualWorth(website, best))}</text>
        <text className={r.big} x="200" y="340" textAnchor="middle">{php(annualPay(website))}</text>
      </g>

      <g className={r.scene} data-journey-scene="">
        {Array.from({ length: TRIAL_DAYS }, (_, n) => <circle key={n} className={`${r.day} ${r[zone(n + 1)]}`} r="12" {...on(200, 200, 132, n, TRIAL_DAYS)} style={i(n)} />)}
        <text className={r.small} x="200" y="184" textAnchor="middle">decide by</text>
        <text className={r.big} x="200" y="226" textAnchor="middle">Day {best.toDay}</text>
      </g>

      <g className={r.scene} data-journey-scene="">
        {bundleTiers.map((tier, n) => { const h = tier.rate * 720; return <g key={tier.services} className={r.pop} style={i(n * 2)}>
          <rect className={`${r.bar} ${n === bundleTiers.length - 1 ? r.barWin : ""}`} x={74 + n * 68} y={300 - h} width="48" height={h} rx="10" />
          <text className={r.value} x={98 + n * 68} y={288 - h} textAnchor="middle">{percent(tier.rate)}</text>
          <text className={r.small} x={98 + n * 68} y="326" textAnchor="middle">{tier.services}</text>
        </g>; })}
        <text className={r.small} x="200" y="352" textAnchor="middle">services together</text>
      </g>

      <g className={r.scene} data-journey-scene="">
        {Array.from({ length: 6 }, (_, n) => <rect key={n} className={`${r.tile} ${n ? r.tileOpen : r.tileFree} ${r.pop}`} x={38 + n * 56} y="150" width="44" height="44" rx="10" style={i(n * 2)} />)}
        <text className={r.big} x="200" y="252" textAnchor="middle">One, or a stack</text>
        <text className={r.small} x="200" y="280" textAnchor="middle">your call, any time</text>
      </g>

      <g className={r.scene} data-journey-scene="">
        {["Domain", "Accounts", "Content"].map((name, n) => <g key={name} className={r.pop} style={i(n * 3)}>
          <circle className={r.own} cx={96 + n * 104} cy="186" r="40" />
          <path className={r.tick} d={`M${80 + n * 104} 187 l11 11 l21 -23`} />
          <text className={r.small} x={96 + n * 104} y="254" textAnchor="middle">{name}</text>
        </g>)}
        <text className={r.big} x="200" y="308" textAnchor="middle">Yours</text>
      </g>

      <g className={r.scene} data-journey-scene="">
        {[`Day ${best.toDay}`, `Day ${TRIAL_DAYS}`, "Any time"].map((when, n) => <g key={when} className={r.pop} style={i(n * 3)}>
          <rect className={r.pill} x="70" y={104 + n * 70} width="260" height="52" rx="26" />
          <path className={r.tick} d={`M92 ${131 + n * 70} l9 9 l17 -19`} />
          <text className={r.label} x="136" y={136 + n * 70}>{when}</text>
        </g>)}
      </g>
    </svg>
  </div>;
}

export function RatesJourney() {
  const look = ratesLook();
  const label = journeyLores[look.lore];
  // KRIV's own page runs the full cast: host, price, old price and day counter.
  const cast = buildCast(ratesCast, ratesJourney.map((step) => step.id), "full", "ph-rates", look);
  return <JourneyScroller id="ph-rates" className={j.journey} voiceClassName={j.voice} cueClassName={j.cue} cast={cast} sound={soundRoom(look.sound, "rates")}>
    <ol className={j.dots} aria-label="Chapters of the story">
      {ratesJourney.map((step, n) => <li key={step.id}><a href={`#journey-${step.id}`} aria-label={`${label(n + 1, ratesJourney.length, step.chapter).lead}: ${step.chapter}`} /></li>)}
    </ol>
    <Stage />
    <div className={j.steps}>
      {ratesJourney.map((step, n) => <section key={step.id} id={`journey-${step.id}`} className={j.step} data-journey-step="" data-audio={step.audio} data-sfx={beatEffects.rates[step.id]} aria-labelledby={`journey-${step.id}-title`}>
        <div className={j.words}>
          <p className={o.eyebrow}><b>{label(n + 1, ratesJourney.length, step.chapter).lead}</b> / {step.chapter}</p>
          {n === 0 ? <h1 id={`journey-${step.id}-title`}>{step.title}</h1> : <h2 id={`journey-${step.id}-title`}>{step.title}</h2>}
          <p className={j.narration} data-narration="">{step.narration}</p>
          {n === 0 ? <p className={j.hint}>Scroll to begin <span aria-hidden="true">↓</span> Each chapter is read aloud. Tap anywhere to start the sound.</p> : null}
          {n === ratesJourney.length - 1 ? <p className={o.actions}><a className={o.button} href="#offer-builder">Build your plan <span aria-hidden="true">+</span></a></p> : null}
        </div>
      </section>)}
    </div>
  </JourneyScroller>;
}
