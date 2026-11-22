"use client";

import { useEffect, useRef, useState } from "react";
import type { Market } from "@/offers/pricing";
import { menuGroups, money, packageSavings, quoteWindow, selectionTotal } from "@/offers/pricing-math";
import s from "./pricing.module.css";

type Trial = {
  paidMonths: number;
  annualDiscount: number;
  windows: readonly { fromDay: number; toDay?: number; freeMonths: number }[];
  allIn: readonly string[];
};

function Odometer({ value, currency }: { value: number; currency: Market["currency"] }) {
  const [shown, setShown] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    const initial = current.current;
    if (initial === value) return;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = motion.matches ? 1 : Math.min(1, (now - start) / 550);
      current.current = progress === 1 ? value : Math.round(initial + (value - initial) * (1 - (1 - progress) ** 3));
      setShown(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>
    <span className={s.sr}>{money(value, currency)}</span>
    <span aria-hidden="true" className={s.rolling}>{money(shown, currency)}</span>
    <span aria-hidden="true" className={s.static}>{money(value, currency)}</span>
  </>;
}

export function PricingCalculator({ market, trial }: { market: Market; trial?: Trial }) {
  const [selection, setSelection] = useState<string[]>([]);
  const [packageId, setPackageId] = useState(market.packages.find((p) => p.recommended)?.id ?? market.packages[0].id);
  const [windowIndex, setWindow] = useState(0);
  const [departing, setDeparting] = useState(0);
  const menu = useRef<HTMLDetailsElement>(null);
  const quote = useRef<HTMLElement>(null);
  const plan = market.packages.find((p) => p.id === packageId);
  const total = plan ? { monthly: plan.monthly, setup: plan.setup ?? 0 } : selectionTotal(market, selection);
  const suggestion = plan ? undefined : packageSavings(market, selection, total);
  const window = trial?.windows[windowIndex];
  const terms = trial && window ? quoteWindow(total.monthly, trial.paidMonths, window.freeMonths, trial.annualDiscount) : null;
  const fmt = (n: number) => money(n, market.currency);

  const switchSavings = suggestion ? [
    total.monthly > suggestion.monthly ? `${fmt(total.monthly - suggestion.monthly)} / mo` : null,
    total.setup > (suggestion.setup ?? 0) ? `${fmt(total.setup - (suggestion.setup ?? 0))} on setup` : null,
  ].filter(Boolean).join(" and ") : "";

  function toggle(id: string) {
    setPackageId("");
    setSelection((items) => {
      const required = market.items[id].requires;
      if (items.includes(id)) return items.filter((item) => item !== id && market.items[item].requires !== id);
      return required && !items.includes(required) ? [...items, required, id] : [...items, id];
    });
  }

  return <>
    <section className={s.section} aria-labelledby="packages">
      <div className={s.eyebrow}>Packages</div>
      <h2 id="packages">Choose your level.</h2>
      <div className={s.cards}>
        {market.packages.map((item) => <article key={item.id} className={s.card} data-recommended={item.recommended || undefined}>
          {item.recommended && <p className={s.badge}>Recommended</p>}
          <h3>{item.label}</h3>
          <p>Worth <s>{fmt(item.worth)}</s> per month</p>
          <p className={s.cardPrice}>Yours for <strong>{fmt(item.monthly)}</strong><span> / mo</span></p>
          {item.setup !== undefined && <p>{item.setupWorth !== undefined && <>Setup worth <s>{fmt(item.setupWorth)}</s>. </>}{item.setup ? `${fmt(item.setup)} one-time setup.` : "No setup fee."}</p>}
          <ul>{item.includes.map((id) => <li key={id}>{market.items[id].label}{market.items[id].upgrades?.includes("community") && " (community management included)"}</li>)}</ul>
          <button type="button" aria-pressed={plan?.id === item.id} onClick={() => { setPackageId(item.id); setSelection([]); quote.current?.focus(); }}>{plan?.id === item.id ? "Selected" : `Choose ${item.label}`}</button>
        </article>)}
      </div>
      <details className={s.menu} ref={menu}>
        <summary>View all services</summary>
        <div className={s.menuTotal} aria-live="polite"><strong>{fmt(total.monthly)} / mo</strong>{total.setup > 0 && <> + {fmt(total.setup)} one time</>}</div>
        {menuGroups(market).map((group) => <fieldset className={s.group} key={group.title}>
          <legend>{group.title}</legend>
          <div className={s.items}>
            {group.ids.map((id) => { const item = market.items[id]; const oneTime = item.monthly === 0 && item.setup !== undefined; return <label className={s.item} key={id}>
              <input type="checkbox" checked={selection.includes(id)} onChange={() => toggle(id)} />
              <span><strong>{item.label}</strong><small>{item.detail}</small></span>
              <span>{oneTime ? <>{fmt(item.setup ?? 0)}<small>one time</small></> : <>{fmt(item.monthly)} / mo</>}{item.worth !== undefined && <small>Worth <s>{fmt(item.worth)}</s>{item.setup === undefined ? " / mo" : " setup"}</small>}{!oneTime && item.setup !== undefined && <small>{item.setup ? `${fmt(item.setup)} setup` : "Free setup"}</small>}</span>
            </label>; })}
          </div>
        </fieldset>)}
        {trial && <button type="button" onClick={() => { setSelection([...trial.allIn]); setPackageId(""); }}>Use the all-in example</button>}
        {suggestion && <button type="button" className={s.switch} onClick={() => { setSelection([]); setPackageId(suggestion.id); if (menu.current) menu.current.open = false; quote.current?.focus(); }}>Already in {suggestion.label}, switch and save {switchSavings}</button>}
      </details>
    </section>
    <section className={`${s.section} ${s.quote}`} ref={quote} tabIndex={-1} aria-labelledby="estimate">
      <div className={s.eyebrow}>Your estimate</div>
      <h2 id="estimate">{plan?.label ?? (selection.length ? "Your services" : "Choose a package or service")}</h2>
      {trial && <fieldset className={s.windows}>
        <legend>When do you decide during the trial?</legend>
        {trial.windows.map((w, i) => <label key={w.fromDay}><input type="radio" name="trial-window" checked={windowIndex === i} onChange={() => { setDeparting(Math.max(0, (window?.freeMonths ?? 0) - w.freeMonths)); setWindow(i); }} />{w.toDay ? `Days ${w.fromDay}–${w.toDay}` : `Day ${w.fromDay}+`}</label>)}
      </fieldset>}
      <div aria-live="polite" aria-atomic="true">
        <p className={s.estimate}><Odometer value={terms?.effective ?? total.monthly} currency={market.currency} /><small> / mo{trial && " effective"}</small></p>
        {terms && window && trial ? <>
          <p>Regular <s>{fmt(total.monthly)} / mo</s> · {fmt(terms.annualBaseline)} for {trial.paidMonths} months</p>
          <p>{fmt(terms.payment)} paid once after the trial · {terms.covered} months of service</p>
          {total.setup > 0 && <p>Plus {fmt(total.setup)} one time, not part of the annual discount</p>}
          <div className={s.saving} data-window={windowIndex}>
            <span>{terms.percent}% off</span>
            <div className={s.meter} aria-hidden="true"><i style={{ width: `${terms.percent}%` }} /></div>
            <p>Worth <s>{fmt(terms.equivalent)}</s> · save {fmt(terms.savings)} over {terms.covered} months</p>
            {window.toDay ? <p>Offer ends in {window.toDay - window.fromDay + 1} days from day {window.fromDay}. Choose by day {window.toDay} for this rate.</p> : <p>The standard annual offer applies from day {window.fromDay}.</p>}
          </div>
        </> : total.setup > 0 ? <p>{fmt(total.setup)} one-time setup</p> : null}
      </div>
      {terms && trial && window && <div className={s.calendar} aria-label="Months of service">
        {Array.from({ length: trial.paidMonths }, (_, i) => <span key={i}>Month {i + 1}</span>)}
        {Array.from({ length: window.freeMonths }, (_, i) => <span className={s.gift} key={`gift-${i}`}>Free month<strong>{fmt(total.monthly)}</strong></span>)}
        {Array.from({ length: departing }, (_, i) => <span className={`${s.gift} ${s.fall}`} key={`${windowIndex}-${i}`} aria-hidden="true">Free month<strong>{fmt(total.monthly)}</strong></span>)}
      </div>}
    </section>
  </>;
}
