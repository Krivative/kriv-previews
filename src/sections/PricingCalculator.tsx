"use client";

import { useEffect, useRef, useState } from "react";
import type { Market } from "@/offers/pricing";
import { coveredItems, menuGroups, money, packageSavings, quoteTotal, quoteWindow } from "@/offers/pricing-math";
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
  const sheet = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const quote = useRef<HTMLElement>(null);
  const plan = market.packages.find((p) => p.id === packageId);
  const covered = plan ? coveredItems(market, plan) : new Set<string>();
  const addOns = selection.filter((id) => !covered.has(id));
  const total = quoteTotal(market, plan, selection);
  const suggestion = plan ? undefined : packageSavings(market, selection, total);
  const window = trial?.windows[windowIndex];
  const terms = trial && window ? quoteWindow(total.monthly, trial.paidMonths, window.freeMonths, trial.annualDiscount) : null;
  const fmt = (n: number) => money(n, market.currency);
  const groups = menuGroups(market);
  const chosen = plan ? addOns.length : selection.length;

  const switchSavings = suggestion ? [
    total.monthly > suggestion.monthly ? `${fmt(total.monthly - suggestion.monthly)} / mo` : null,
    total.setup > (suggestion.setup ?? 0) ? `${fmt(total.setup - (suggestion.setup ?? 0))} on setup` : null,
  ].filter(Boolean).join(" and ") : "";

  // With a package chosen, ticking a service adds it on top; services the package already covers stay ticked.
  function toggle(id: string) {
    if (covered.has(id)) return;
    setSelection((items) => {
      const required = market.items[id].requires;
      if (items.includes(id)) return items.filter((item) => item !== id && market.items[item].requires !== id);
      return required && !items.includes(required) ? [...items, required, id] : [...items, id];
    });
  }
  function choosePackage(id: string) {
    const next = market.packages.find((p) => p.id === id);
    const keep = next ? coveredItems(market, next) : new Set<string>();
    setPackageId(id);
    setSelection((items) => items.filter((item) => !keep.has(item)));
  }
  function openSheet() { sheet.current?.showModal(); }
  function closeSheet(toQuote = false) {
    sheet.current?.close();
    (toQuote ? quote.current : opener.current)?.focus();
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
          <button type="button" aria-pressed={plan?.id === item.id} onClick={() => { choosePackage(item.id); quote.current?.focus(); }}>{plan?.id === item.id ? "Selected" : `Choose ${item.label}`}</button>
        </article>)}
      </div>
      <div className={s.menuBar}>
        <button type="button" ref={opener} className={s.menuOpen} aria-haspopup="dialog" onClick={openSheet}>View all services<span>{Object.keys(market.items).length} services and add-ons</span></button>
        <p aria-live="polite">{plan ? `${plan.label}${addOns.length ? ` + ${addOns.length} add-on${addOns.length > 1 ? "s" : ""}` : ""}` : selection.length ? `${selection.length} service${selection.length > 1 ? "s" : ""} chosen` : "Nothing chosen yet"} · <strong>{fmt(total.monthly)} / mo</strong>{total.setup > 0 && <> + {fmt(total.setup)} one time</>}</p>
      </div>
      <dialog className={s.sheet} ref={sheet} aria-labelledby="services-title" onClick={(e) => { if (e.target === e.currentTarget) closeSheet(); }} onClose={() => opener.current?.focus()}>
        <div className={s.sheetHead}>
          <h2 id="services-title">All services</h2>
          <button type="button" className={s.close} onClick={() => closeSheet()} aria-label="Close services">×</button>
        </div>
        <p className={s.sheetNote}>{plan ? <>{plan.label} is chosen: its services are ticked. Tick anything else to add it on top. <button type="button" className={s.link} onClick={() => { setPackageId(""); setSelection([]); }}>Build your own instead</button></> : "Tick what you need. We show it when a package already covers your picks for less."}</p>
        <div className={s.sheetBody}>
          {groups.map((group, i) => { const picked = group.ids.filter((id) => covered.has(id) || selection.includes(id)).length; const from = Math.min(...group.ids.map((id) => market.items[id].monthly || market.items[id].setup || Infinity)); return <details className={s.group} name={`services-${market.currency}`} key={group.title} open={i === 0 || undefined}>
            <summary><span>{group.title}</span><small>{picked ? `${picked} of ${group.ids.length} ticked` : `${group.ids.length} service${group.ids.length > 1 ? "s" : ""} · from ${fmt(from)}`}</small></summary>
            <div className={s.items}>
              {group.ids.map((id) => { const item = market.items[id]; const oneTime = item.monthly === 0 && item.setup !== undefined; const inPlan = covered.has(id); return <label className={s.item} key={id} data-in-plan={inPlan || undefined}>
                <input type="checkbox" checked={inPlan || selection.includes(id)} disabled={inPlan} onChange={() => toggle(id)} />
                <span><strong>{item.label}</strong><small>{inPlan ? `Already in ${plan!.label}` : item.detail}</small></span>
                <span>{oneTime ? <>{fmt(item.setup ?? 0)}<small>one time</small></> : <>{fmt(item.monthly)}<small>per month</small></>}{item.worth !== undefined && <small>Worth <s>{fmt(item.worth)}</s>{item.setup === undefined ? "" : " setup"}</small>}{!oneTime && item.setup !== undefined && <small>{item.setup ? `${fmt(item.setup)} setup` : "Free setup"}</small>}</span>
              </label>; })}
            </div>
          </details>; })}
        </div>
        <div className={s.sheetFoot}>
          {suggestion && <button type="button" className={s.switch} onClick={() => { setSelection([]); setPackageId(suggestion.id); }}>Already in {suggestion.label}, switch and save {switchSavings}</button>}
          <div className={s.footRow}>
            <p aria-live="polite"><strong>{fmt(total.monthly)} / mo</strong>{total.setup > 0 && <> + {fmt(total.setup)} one time</>}<small>{plan ? `${plan.label}${addOns.length ? ` + ${addOns.length} add-on${addOns.length > 1 ? "s" : ""}` : ""}` : `${chosen} chosen`}</small></p>
            {trial && !plan && <button type="button" className={s.ghost} onClick={() => setSelection([...trial.allIn])}>All-in example</button>}
            <button type="button" onClick={() => closeSheet(true)}>See my estimate</button>
          </div>
        </div>
      </dialog>
    </section>
    <section className={`${s.section} ${s.quote}`} ref={quote} tabIndex={-1} aria-labelledby="estimate">
      <div className={s.eyebrow}>Your estimate</div>
      <h2 id="estimate">{plan ? `${plan.label}${addOns.length ? ` + ${addOns.length} add-on${addOns.length > 1 ? "s" : ""}` : ""}` : selection.length ? "Your services" : "Choose a package or service"}</h2>
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
