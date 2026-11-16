"use client";

import { useState } from "react";
import { KRIV_BOOKING, TRIAL_DAYS, crm, decisionWindows, php, starterStacks } from "@/offers/ph-local";
import s from "./sneak-peek.module.css";

// The rates hero's sneak peek: pick a kind of business, see a suggested first plan with its real price.
// Arithmetic on the page's own price list, in the visitor's browser. Buttons only; nothing is stored or sent.
export function SneakPeek() {
  const [pick, setPick] = useState(0);
  const stack = pick < starterStacks.length ? starterStacks[pick] : null;
  const best = decisionWindows[0];
  return <div className={s.card}>
    <p className={s.title}>Sneak peek: your first plan</p>
    <div className={s.chips} role="group" aria-label="Your kind of business">
      {starterStacks.map((st, i) => <button key={st.business} type="button" aria-pressed={i === pick} onClick={() => setPick(i)}>{st.business}</button>)}
      <button type="button" aria-pressed={!stack} onClick={() => setPick(starterStacks.length)}>Something else</button>
    </div>
    <div aria-live="polite">
      {stack ? <>
        <p className={s.stack}>A good first stack: <strong>{stack.plans.join(" + ")}</strong></p>
        <p className={s.why}>{stack.why}</p>
        <p className={s.price}><span className={s.big}>{php(stack.quote.pay)}</span> <s>{php(stack.quote.worth)}</s> <span className={s.save}>you keep {php(stack.quote.saving)}</span></p>
        <p className={s.steps}>{TRIAL_DAYS} days free, decide by day {best.toDay}: {stack.quote.months} months for the price of {crm.baseMonths}, with the {stack.plans.length}-service bundle discount.</p>
      </> : <p className={s.why}>Every business is different. Start the free trial with one service, or build your own plan below.</p>}
    </div>
    <p className={s.cta}><a href={KRIV_BOOKING}>Start my {TRIAL_DAYS} free days</a><a href="#journey-trial">See how it works <span aria-hidden="true">↓</span></a></p>
    <p className={s.fine}>A suggested starting point from the price list, not a promise of results.</p>
  </div>;
}
