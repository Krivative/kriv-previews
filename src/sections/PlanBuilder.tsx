"use client";

import { useEffect, useState } from "react";
import { MAX_BUNDLE_SAVING, TRIAL_DAYS, addOns, annualPlans, bundleQuote, bundleTiers, crm, decisionWindows, percent, php } from "@/offers/ph-local";
import o from "./offer.module.css";

// Interactive parts of KRIV's own pages. Everything here is arithmetic on the
// page's own figures in the visitor's browser: buttons only, no form, no input,
// nothing stored and nothing sent anywhere.

const choices = annualPlans.filter((p) => p.name !== "All three together");
const kit = addOns[0];

/** Pick services and when you decide; the yearly total and the saving update as you tap.
 *  Annual only (Kriv, 2026-11-16): after the free trial there is no month to month plan. */
export function PlanBuilder() {
  const [picked, setPicked] = useState<string[]>(["Website"]);
  const [multi, setMulti] = useState(false);
  const [withKit, setWithKit] = useState(false);
  const [windowIndex, setWindowIndex] = useState(0);

  const plans = choices.filter((p) => picked.includes(p.name));
  const { months, worth, rate, pay, capped, bundleSaving, saving, savingRate } = bundleQuote(plans, decisionWindows[windowIndex]);
  // One at a time: tapping a service switches to it. Only "Combine services" lets them add up.
  const toggle = (name: string) => setPicked((now) => (!multi ? [name] : now.includes(name) ? now.filter((n) => n !== name) : [...now, name]));
  const setMode = (next: boolean) => { setMulti(next); if (!next) setPicked((now) => now.slice(0, 1)); };

  return <div className={o.builder}>
    <div className={o.builderSteps}>
      <div>
        <p className={o.tag}>1. Choose {multi ? "services" : "a service"}</p>
        <div className={o.segments} role="group" aria-label="One service or several">
          <button type="button" aria-pressed={!multi} onClick={() => setMode(false)}>One service<small>Tap to switch</small></button>
          <button type="button" aria-pressed={multi} onClick={() => setMode(true)}>Combine services<small>Bundle discount, up to {percent(MAX_BUNDLE_SAVING)} off</small></button>
        </div>
        <div className={o.chips} data-multi={multi ? "" : undefined}>
          {choices.map((p) => <button key={p.name} type="button" aria-pressed={picked.includes(p.name)} onClick={() => toggle(p.name)}>
            <span>{p.name}</span><span>{php(p.monthly)}<small> / month</small></span>
          </button>)}
        </div>
        {multi ? <>
          <p className={o.resultNote}>On the annual plan, services taken together get a bundle discount, up to {percent(MAX_BUNDLE_SAVING)} off the regular value.</p>
          <ol className={o.tiers} aria-label="Bundle discount by number of services">
            {bundleTiers.map((tier) => <li key={tier.services} data-on={plans.length >= tier.services ? "" : undefined} data-now={rate === tier.rate ? "" : undefined}>
              <span>{tier.services} services</span><strong>{percent(tier.rate)} off</strong>
            </li>)}
          </ol>
        </> : null}
        <p className={o.tag}>Optional add-on</p>
        <div className={o.chips} data-multi="">
          <button type="button" aria-pressed={withKit} onClick={() => setWithKit((v) => !v)}>
            <span>{kit.name}</span><span>{php(kit.price)}<small> {kit.unit}</small></span>
          </button>
        </div>
      </div>
      <div>
        <p className={o.tag}>2. When would you decide?</p>
        <div className={o.segments} role="group" aria-label="When you decide, counted from the first day of your trial">
          {decisionWindows.map((win, i) => <button key={win.fromDay} type="button" aria-pressed={i === windowIndex} onClick={() => setWindowIndex(i)}>
            {win.toDay ? `Days ${win.fromDay} to ${win.toDay}` : `From day ${win.fromDay}`}<small>{win.freeMonths ? `${win.freeMonths} ${win.freeMonths === 1 ? "month" : "months"} free` : "no free months"}</small>
          </button>)}
        </div>
      </div>
    </div>

    <div className={o.builderResult} aria-live="polite">
      <p className={o.tag}>Your plan</p>
      {!plans.length ? <p className={o.resultNote}>Choose at least one service to see a total.</p> : <>
        <p className={o.resultLabel}>You pay for the year</p>
        <p className={o.total} key={`a-${pay}`}>{php(pay)}</p>
        <dl className={o.resultLines}>
          <div><dt>You get</dt><dd>{months > crm.baseMonths ? <><s>{crm.baseMonths}</s> </> : null}{months} months</dd></div>
          <div><dt>Regular value</dt><dd>{saving > 0 ? <s>{php(worth)}</s> : php(worth)}</dd></div>
          {bundleSaving > 0 ? <div className={o.resultSave}><dt>Bundle discount, {plans.length} services</dt><dd>{capped ? php(bundleSaving) : `${percent(rate)} off, ${php(bundleSaving)}`}</dd></div> : null}
          {saving > 0 ? <div className={o.resultSave}><dt>You save</dt><dd key={`s-${saving}`}>{php(saving)} ({percent(savingRate)} off)</dd></div>
            : <div><dt>Free months</dt><dd>None after day {TRIAL_DAYS}</dd></div>}
          <div><dt>Works out to</dt><dd>about {php(pay / months)} a month</dd></div>
        </dl>
      </>}
      {capped ? <p className={o.resultNote}>The total saving stops at {percent(MAX_BUNDLE_SAVING)} of the regular value.</p> : null}
      {withKit ? <p className={o.resultNote}>Plus the {kit.name.toLowerCase()}: {php(kit.price)}, paid once.</p> : null}
      <p className={o.resultNote}>First {TRIAL_DAYS} days free, then the annual plan. No setup fee, no month to month plan.</p>
    </div>
  </div>;
}

export type NavItem = { id: string; label: string };

/** Sticky menu of the page's sections; the one in view is marked as you scroll. */
export function SectionNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const targets = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => Boolean(el));
    // The current section is the last heading that has passed the upper third of the window.
    const check = () => {
      const line = window.innerHeight * 0.35;
      const passed = targets.filter((el) => el.getBoundingClientRect().top < line);
      setActive((passed[passed.length - 1] ?? targets[0])?.id);
    };
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [items]);
  return <nav className={o.sectionNav} aria-label="On this page">
    <div>{items.map((item) => <a key={item.id} href={`#${item.id}`} aria-current={item.id === active ? "true" : undefined}>{item.label}</a>)}</div>
    <span className={o.progress} aria-hidden="true" />
  </nav>;
}
