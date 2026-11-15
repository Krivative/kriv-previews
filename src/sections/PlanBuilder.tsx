"use client";

import { useEffect, useState } from "react";
import { MAX_BUNDLE_SAVING, TRIAL_DAYS, addOns, annualPlans, bundleQuote, bundleTiers, crm, decisionWindows, percent, php } from "@/offers/ph-local";
import o from "./offer.module.css";

// Interactive parts of KRIV's own pages. Everything here is arithmetic on the
// page's own figures in the visitor's browser: buttons only, no form, no input,
// nothing stored and nothing sent anywhere.

const choices = annualPlans.filter((p) => p.name !== "All three together");
const kit = addOns[0];
const freeWindows = decisionWindows.filter((w) => w.freeMonths > 0);

/** Pick services and a way to pay; the total and the saving update as you tap. */
export function PlanBuilder() {
  const [picked, setPicked] = useState<string[]>(["Website"]);
  const [multi, setMulti] = useState(false);
  const [withKit, setWithKit] = useState(false);
  const [annual, setAnnual] = useState(true);
  const [windowIndex, setWindowIndex] = useState(0);

  const plans = choices.filter((p) => picked.includes(p.name));
  const monthly = plans.reduce((sum, p) => sum + p.monthly, 0);
  const regular = plans.reduce((sum, p) => sum + p.regular, 0);
  const { months, worth, rate, pay, capped, bundleSaving, saving, savingRate } = bundleQuote(plans, freeWindows[windowIndex]);
  const best = bundleQuote(plans, freeWindows[0]);
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
          <p className={o.resultNote}>On the annual plan, services taken together get a bundle discount, up to {percent(MAX_BUNDLE_SAVING)} off the month by month total.</p>
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
        <p className={o.tag}>2. Choose how to pay</p>
        <div className={o.segments} role="group" aria-label="How to pay">
          <button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)}>Monthly</button>
          <button type="button" aria-pressed={annual} onClick={() => setAnnual(true)}>Annual, extra months free</button>
        </div>
      </div>
      {annual ? <div>
        <p className={o.tag}>3. When would you decide?</p>
        <div className={o.segments} role="group" aria-label="When you decide after the trial">
          {freeWindows.map((win, i) => <button key={win.fromDay} type="button" aria-pressed={i === windowIndex} onClick={() => setWindowIndex(i)}>
            Days {win.fromDay} to {win.toDay}<small>{win.freeMonths} {win.freeMonths === 1 ? "month" : "months"} free</small>
          </button>)}
        </div>
      </div> : null}
    </div>

    <div className={o.builderResult} aria-live="polite">
      <p className={o.tag}>Your plan</p>
      {!plans.length ? <p className={o.resultNote}>Choose at least one monthly service to see a total.</p> : annual ? <>
        <p className={o.resultLabel}>You pay for the year</p>
        <p className={o.total} key={`a-${pay}`}>{php(pay)}</p>
        <dl className={o.resultLines}>
          <div><dt>You get</dt><dd><s>{crm.baseMonths}</s> {months} months</dd></div>
          <div><dt>Month by month</dt><dd><s>{php(worth)}</s></dd></div>
          {bundleSaving > 0 ? <div className={o.resultSave}><dt>Bundle discount, {plans.length} services</dt><dd>{capped ? php(bundleSaving) : `${percent(rate)} off, ${php(bundleSaving)}`}</dd></div> : null}
          <div className={o.resultSave}><dt>You save</dt><dd key={`s-${saving}`}>{php(saving)} ({percent(savingRate)} off)</dd></div>
          <div><dt>Works out to</dt><dd>about {php(pay / months)} a month</dd></div>
        </dl>
      </> : <>
        <p className={o.resultLabel}>You pay each month</p>
        <p className={o.total} key={`m-${monthly}`}>{php(monthly)}</p>
        <dl className={o.resultLines}>
          <div><dt>12 months, month by month</dt><dd>{php(monthly * crm.baseMonths)}</dd></div>
          {regular > monthly ? <div className={o.resultSave}><dt>CRM promo saves</dt><dd>{php(regular - monthly)} a month</dd></div> : null}
          <div><dt>Go annual and save</dt><dd>up to {php(best.saving)} ({percent(best.savingRate)} off)</dd></div>
        </dl>
      </>}
      {annual && capped ? <p className={o.resultNote}>The total saving stops at {percent(MAX_BUNDLE_SAVING)} of the month by month price.</p> : null}
      {withKit ? <p className={o.resultNote}>Plus the {kit.name.toLowerCase()}: {php(kit.price)}, paid once.</p> : null}
      <p className={o.resultNote}>First {TRIAL_DAYS} days free. No setup fee.</p>
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
