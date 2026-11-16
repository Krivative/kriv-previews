"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { TRIAL_DAYS, annualPay, annualPlans, annualSaving, annualWorth, crm, decisionWindows, fill, php, totalMonths, type Audience } from "@/offers/ph-local";
import st from "./story.module.css";

// "The two timelines": an animated walk through why the annual plan is worth it,
// told with the Website's own figures. One business, two timelines that split
// when the free trial ends. Every number comes from src/offers/ph-local.ts.
//
// The page is complete without scripts: every chapter is plain content. The
// script only arms the animations and plays each chapter as it scrolls into
// view. No form, no input, nothing stored or sent.

const plan = annualPlans[0]; // Website
const [best, ...laterWindows] = decisionWindows;
const pay = annualPay(plan);
const months = totalMonths(best);
const worth = annualWorth(plan, best);
const saving = annualSaving(plan, best);
const step = (i: number) => ({ "--i": i }) as CSSProperties;

function Months({ paid, free = 0 }: { paid: number; free?: number }) {
  return <ol className={st.months} aria-label={free ? `${paid} paid months and ${free} free months` : `${paid} paid months`}>
    {Array.from({ length: paid + free }, (_, i) => <li key={i} style={step(i)} data-free={i >= paid ? "" : undefined}>
      <span>{i + 1}</span><small>{i >= paid ? "Free" : php(plan.monthly).replace("PHP ", "")}</small>
    </li>)}
  </ol>;
}

export function AnnualStory({ audience }: { audience: Audience }) {
  const root = useRef<HTMLDivElement>(null);
  const t = (text: string) => fill(text, audience);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.dataset.armed = "";
    const chapters = [...el.querySelectorAll<HTMLElement>("[data-chapter]")];
    // A chapter plays once its top edge is a little way into the window. Measured
    // directly on scroll, which behaves the same on every phone and browser.
    const check = () => {
      const line = window.innerHeight * 0.85;
      for (const chapter of chapters) if (!("seen" in chapter.dataset) && chapter.getBoundingClientRect().top < line) chapter.dataset.seen = "";
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    // Belt and braces: a slow tick, so a missed scroll event can never leave a chapter hidden.
    const tick = window.setInterval(check, 600);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); window.clearInterval(tick); };
  }, []);

  /** Plays every chapter again from the top. */
  const replay = () => {
    const el = root.current;
    if (!el) return;
    const chapters = [...el.querySelectorAll<HTMLElement>("[data-chapter]")];
    chapters.forEach((chapter) => delete chapter.dataset.seen);
    el.scrollIntoView({ block: "start", behavior: "instant" });
    requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new Event("scroll"))));
  };

  return <div ref={root} className={st.story}>
    <article data-chapter className={st.chapter}>
      <p className={st.kicker}>Chapter 1 / The fork</p>
      <h3>One website. <em>Two timelines.</em></h3>
      <p>{t(`Day 1 of the free trial, and the path splits. Both timelines go annual, because after the trial every plan is paid yearly. In one, {client} waits until the trial is over. In the other, it decides in the first ${best.toDay} days. Same website, same KRIV team, same price. Watch what happens to the months.`)}</p>
      <div className={st.fork} aria-hidden="true">
        <span className={st.trunk}>Free trial</span>
        <span className={st.branchA}>Timeline A / decides after day {TRIAL_DAYS}</span>
        <span className={st.branchB}>Timeline B / decides by day {best.toDay}</span>
      </div>
    </article>

    <article data-chapter className={st.chapter}>
      <p className={st.kicker}>Chapter 2 / Timeline A</p>
      <h3>Wait it out, <em>and the year is just a year.</em></h3>
      <p>Nothing is wrong with this timeline: it uses the whole trial to be sure. It pays {php(pay)} for {crm.baseMonths} months, with no free months. To run the website for {months} months it pays {months - crm.baseMonths} more at {php(plan.monthly)} each.</p>
      <Months paid={months} />
      <p className={st.sum}><span>{months} months</span><strong>{php(worth)}</strong></p>
    </article>

    <article data-chapter className={st.chapter}>
      <p className={st.kicker}>Chapter 3 / Timeline B</p>
      <h3>Pay for twelve. <em>Three more appear.</em></h3>
      <p>Here {t("{client}")} pays the same {php(pay)} once. Decide in the first {best.toDay} days of the trial and KRIV adds {best.freeMonths} months free. The same {months} months of website.</p>
      <Months paid={crm.baseMonths} free={best.freeMonths} />
      <p className={st.sum}><span>{months} months</span><strong>{php(pay)}</strong></p>
    </article>

    <article data-chapter className={st.chapter}>
      <p className={st.kicker}>Chapter 4 / Side by side</p>
      <h3>Same {months} months. <em>{php(saving)} apart.</em></h3>
      <div className={st.bars}>
        <div><span>Timeline A</span><i style={{ "--w": "100%" } as CSSProperties} /><b><s>{php(worth)}</s></b></div>
        <div data-win=""><span>Timeline B</span><i style={{ "--w": `${Math.round((pay / worth) * 100)}%` } as CSSProperties} /><b>{php(pay)}</b></div>
      </div>
      <p className={st.punch}>{php(saving)} stays with {t("{client}")}. That is {best.freeMonths} months of website it never pays for.</p>
    </article>

    <article data-chapter className={st.chapter}>
      <p className={st.kicker}>Chapter 5 / You already know this</p>
      <h3>You have seen this <em>before.</em></h3>
      <ul className={st.analogies}>
        <li style={step(0)}><h4>The early bird</h4><p>The first to book the venue gets the extra night free. Same venue, same price, more nights. Deciding early is the early bird.</p></li>
        <li style={step(1)}><h4>The suki price</h4><p>The stall owner keeps the better price for the customer who commits early. Stacking services is the suki price on top.</p></li>
        <li style={step(2)}><h4>A year of rent</h4><p>Imagine paying a year of rent and the landlord hands over {best.freeMonths} extra months. That is exactly this.</p></li>
      </ul>
    </article>

    <article data-chapter className={st.chapter}>
      <p className={st.kicker}>Chapter 6 / More than the discount</p>
      <h3>What Timeline B <em>also gives you.</em></h3>
      <ul className={st.gains}>
        {[
          `One payment, then nothing to renew for ${months} months.`,
          "The price is settled for every month already paid for.",
          "Updates and upkeep continue the whole time.",
          `It still starts with the ${TRIAL_DAYS}-day free trial, with no setup fee.`,
          t("{Client} still owns its domain, accounts and content."),
        ].map((line, i) => <li key={line} style={step(i)}>{line}</li>)}
      </ul>
    </article>

    <article data-chapter className={st.chapter}>
      <p className={st.kicker}>Chapter 7 / The portal closes</p>
      <h3>The sooner you choose, <em>the more months you keep.</em></h3>
      <p>Day 1 is the first day of the trial. Every few days the free months step down. From day {decisionWindows[decisionWindows.length - 1].fromDay} Timeline B is still open, at {crm.baseMonths} months for the price of {crm.baseMonths}.</p>
      <ol className={st.portals}>
        {[best, ...laterWindows].map((w, i) => <li key={w.fromDay} style={step(i)} data-closed={w.freeMonths ? undefined : ""}>
          <span>{w.toDay ? `Days ${w.fromDay} to ${w.toDay}` : `From day ${w.fromDay}`}</span>
          <strong>{totalMonths(w)} months</strong>
          <small>{w.freeMonths ? `Save ${php(annualSaving(plan, w))}` : "No free months"}</small>
        </li>)}
      </ol>
      <p className={st.note}>The story uses the Website at {php(plan.monthly)} a month, paid yearly. The same rule applies to every service.</p>
      <p className={st.controls}>
        <a href="#offer-builder">Build your own timeline <span aria-hidden="true">+</span></a>
        <button type="button" onClick={replay}>Replay the story</button>
      </p>
    </article>
  </div>;
}
