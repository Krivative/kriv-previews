import type { CSSProperties } from "react";
import { markets, pricingRules } from "@/offers/pricing";
import { money, quoteWindow } from "@/offers/pricing-math";
import { PhBackdrop } from "./PhBackdrop";
import { PhEffects } from "./PhEffects";
import { PhLogoPlay, type LogoPlay } from "./PhLogoPlay";
import { PhSea } from "./PhSea";
import { PhStory, type StoryStep } from "./PhStory";
import { PricingCalculator } from "./PricingCalculator";
import type { PhDesign } from "./ph-rates-seed";
import s from "./pricing.module.css";
import p from "./ph-rates.module.css";

// The public /ph-rates page, designed by a seed (see ph-rates-seed.ts). Lead quotes keep using PricingPage.
// Every figure is computed from src/offers/pricing.ts.
const FONTS = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600;700&display=swap";

export function PhRatesSeeded({ design }: { design: PhDesign }) {
  const market = markets.ph;
  const rules = pricingRules.ph;
  const fmt = (n: number) => money(n, "PHP");
  const growth = market.packages.find((x) => x.recommended)!;
  const label = (id: string) => market.items[id as keyof typeof market.items].label;
  const best = rules.windows.reduce((a, b) => (b.freeMonths > a.freeMonths ? b : a));
  const standard = rules.windows.find((w) => !w.toDay)!;
  const early = quoteWindow(growth.monthly, rules.paidMonths, best.freeMonths, rules.annualDiscount);
  const late = quoteWindow(growth.monthly, rules.paidMonths, standard.freeMonths, rules.annualDiscount);
  const off = `${rules.annualDiscount * 100}%`;
  const serviceCount = Object.keys(market.items).length;
  const { contact } = pricingRules;

  const steps: StoryStep[] = [
    { when: "Day 1", title: `Start the ${rules.trialDays}-day free trial.`, body: `Try any service before paying anything. ${rules.trial[0].days}: ${rules.trial[0].label}`,
      card: { tag: `Free trial · ${rules.trial[0].days}`, title: "Starter level", price: "Nothing to pay yet", note: market.items.starter.detail, chips: [label("website"), label("starter"), label("inbox")] } },
    { when: rules.trial[1].days, title: `Try the recommended ${growth.label} level.`, body: `${growth.label} is ${fmt(growth.monthly)} a month at the regular rate, worth ${fmt(growth.worth)}. ${rules.postingGuidance}`,
      card: { tag: `Free trial · ${rules.trial[1].days}`, title: `${growth.label} level`, price: `${fmt(growth.monthly)} / mo regular`, note: `Worth ${fmt(growth.worth)} a month`, chips: growth.includes.map(label) } },
    { when: `Days ${best.fromDay}–${best.toDay}`, title: "Decide early, get more months.", body: `Decide by day ${best.toDay} and the annual plan pays for ${rules.paidMonths} months at ${off} off, then adds ${best.freeMonths} free months: ${fmt(early.payment)} once for ${early.covered} months of ${growth.label}, ${fmt(early.effective)} a month effective.`,
      card: { tag: `Decide by day ${best.toDay}`, title: `${growth.label}, annual`, price: `${fmt(early.effective)} / mo effective`, note: `${fmt(early.payment)} paid once · ${early.covered} months`, chips: [`${off} off`, `${best.freeMonths} free months`], months: rules.paidMonths, gifts: best.freeMonths } },
    { when: `Day ${standard.fromDay}`, title: rules.trial[2].label, body: `From day ${standard.fromDay} the standard annual offer applies: ${off} off the annual base, ${standard.freeMonths ? `${standard.freeMonths} free months` : "no free months"}. ${fmt(late.payment)} once for ${late.covered} months. Or stop.`,
      card: { tag: `Day ${standard.fromDay}+`, title: `${growth.label}, annual`, price: `${fmt(late.effective)} / mo effective`, note: `${fmt(late.payment)} paid once · ${late.covered} months`, chips: [`${off} off`, "Standard offer"], months: rules.paidMonths, gifts: standard.freeMonths } },
  ];

  const figures = [
    { big: String(rules.trialDays), unit: "days", text: "Free trial. Try any service before paying anything." },
    { big: off, unit: "off", text: "The annual base price, every plan, after the trial." },
    { big: String(best.freeMonths), unit: "free months", text: `Added when you decide by day ${best.toDay}.` },
    { big: fmt(0), unit: "to KRIV", text: "From the agent fee. You pay the agent directly." },
  ];

  const spec: [string, string][] = [
    ["Who it is for", rules.eligibility],
    ["Trial", rules.trial.map((t) => `${t.days}: ${t.label}`).join(" ")],
    ["Annual plan", `Annual base price is the regular monthly total × ${rules.paidMonths}, paid once after the trial, with ${off} off. Free months by decision day: ${rules.windows.map((w) => `${w.toDay ? `days ${w.fromDay}–${w.toDay}` : `day ${w.fromDay}+`}: ${w.freeMonths}`).join(", ")}.`],
    ["Extra inbox platforms", `${fmt(rules.extraPlatformMonthly)} / mo each. Options: ${[...rules.platforms, rules.conditionalPlatform].join(", ")}.`],
    ["Credit wallet", `One prepaid wallet per client covers extra caller minutes and live-seller messages, priced at cost + ${rules.walletMarkup * 100}%.`],
    ["Agent fee", `Paid directly to the agent each month: ${rules.agentFees.map((fee, i) => `${fmt(fee)} for ${["one service", "two services", "three or more (cap)"][i]}`).join(", ")}. KRIV takes nothing.`],
    ["Posting", `${rules.postingGuidance} ${rules.customVideoThreshold}+ videos a month: ask for a custom quote.`],
    ["LinkedIn", pricingRules.linkedin],
  ];

  const style = { ...design.colorway.vars, "--radius": `${design.radius}px` } as CSSProperties;
  const heroTone = design.colorway.dark ? "dark" : "light";
  const h1 = design.headline === "mixed"
    ? <h1 className={p.h1}><span>Pricing for Philippine businesses.</span> <em>Try it free for {rules.trialDays} days.</em></h1>
    : <h1 className={p.h1} data-serif="">Philippine pricing, <em>{rules.trialDays} days free.</em></h1>;

  const statement = design.hero === "statement";
  const backdrop = statement && design.backdrop !== "glow" ? design.backdrop : undefined;
  const under = design.under === "mixed";
  const play: LogoPlay | undefined = ({ lime: "repel", care: "wave", sand: "drag" } as Record<string, LogoPlay>)[design.footer];
  const cardsAt = design.hero === "floating" ? p.float : statement && design.cards === "corners" ? p.corners : undefined;

  return <div className={`${s.root} ${p.root}`} style={style} lang="en-PH" data-market="ph" data-colorway={design.colorway.id} data-dark={design.colorway.dark || undefined} data-hero={design.hero} data-seed={design.seed}
    data-backdrop={backdrop} data-motion={design.motion} data-touch={design.touch} data-footer={design.footer} data-under={under || undefined}>
    <PhEffects />
    <link rel="stylesheet" href={FONTS} precedence="fonts" />
    <a className={s.skip} href="#pricing-main">Skip to pricing</a>
    <header className={p.header}>
      <a className={s.mark} href="https://kriv.agency/" aria-label="KRIV homepage">kriv<span aria-hidden="true">×</span></a>
      <nav aria-label="On this page"><a href="#packages">Packages</a><a href="#how">How it works</a><a href="#details">Details</a></nav>
      <a className={p.pill} href="#pricing-contact" data-magnet="">Contact</a>
    </header>
    <main id="pricing-main">
      <section className={p.hero} aria-labelledby="ph-title">
        {design.hero === "sea" && <PhSea tone={heroTone} className={p.sea} />}
        {backdrop && <PhBackdrop kind={backdrop} />}
        {statement && backdrop !== "halftone" && <span className={p.wordmark} aria-hidden="true">kriv</span>}
        <div className={p.heroText} id="ph-title">
          <p className={p.kicker}><span>PH</span> Philippine pricing · PHP</p>
          {h1}
          <p className={p.lede}>Choose a package or build your own. Try it for {rules.trialDays} days, then pay annually or stop.</p>
          <div className={p.ctas}><a className={p.cta} href="#packages" data-magnet="">See packages <span aria-hidden="true">→</span></a><a className={p.ghost} href={contact.booking} data-magnet="">Book a call</a></div>
        </div>
        {cardsAt && <div className={cardsAt} aria-hidden="true">
          <div className={`${p.fcard} ${p.f1}`}><p className={p.tag}>Recommended</p><b>{growth.label}</b><span className={p.fprice}>{fmt(growth.monthly)}<small> / mo</small></span><small>Worth <s>{fmt(growth.worth)}</s></small></div>
          <div className={`${p.fcard} ${p.f2}`}><p className={p.tag}>Decide by day {best.toDay}</p><span className={p.fprice}>{fmt(early.effective)}<small> / mo effective</small></span><div className={p.months}>{Array.from({ length: rules.paidMonths }, (_, i) => <i key={i} />)}{Array.from({ length: best.freeMonths }, (_, i) => <i key={`g${i}`} className={p.giftDot} />)}</div></div>
          <div className={`${p.fcard} ${p.f3}`}><p className={p.tag}>Free trial</p><b>{rules.trialDays} days</b><small>Try any service first</small></div>
          <div className={`${p.fcard} ${p.f4}`}><ul className={p.chips}>{growth.includes.map((id) => <li key={id}>{label(id)}</li>)}</ul></div>
          <div className={`${p.fcard} ${p.f5}`}><b>{serviceCount}</b><small>services and add-ons</small></div>
        </div>}
      </section>

      {design.figures === "figures" && <section className={p.figures} aria-label="The offer in numbers" data-bg={under || undefined}>
        {under && <PhBackdrop kind="halftone" word={false} />}
        {figures.map((f, i) => <div key={f.unit} data-reveal="" style={{ "--d": i } as CSSProperties}><p className={p.big}><span data-count={f.big}>{f.big}</span><small>{f.unit}</small></p><p>{f.text}</p></div>)}
      </section>}

      <PricingCalculator market={market} trial={{ paidMonths: rules.paidMonths, annualDiscount: rules.annualDiscount, windows: rules.windows, allIn: rules.allIn }} />

      <section className={p.section} aria-labelledby="how" data-bg={under || undefined}>
        {under && <PhBackdrop kind="veil" />}
        <p className={s.eyebrow} data-reveal="">How it works</p>
        <h2 id="how" data-reveal="">How your plan <em>builds.</em></h2>
        <p className={p.sub} data-reveal="">Example: the recommended {growth.label} package, from the first day of the trial to the annual plan.</p>
        <PhStory steps={steps} mode={design.story} />
      </section>

      <section className={p.section} aria-labelledby="details">
        <p className={s.eyebrow} data-reveal="">Plan details</p>
        <h2 id="details" data-reveal="">What to budget for.</h2>
        {design.fine === "spec"
          ? <dl className={p.spec}>{spec.map(([k, v]) => <div key={k} data-reveal=""><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          : <details className={s.fold}><summary>Read the plan details and fine print</summary><ul className={s.rules}>{spec.map(([k, v]) => <li key={k}><b>{k}.</b> {v}</li>)}</ul></details>}
      </section>

      <section className={`${s.section} ${s.contact} ${p.contact}`} aria-labelledby="pricing-contact">
        <h2 id="pricing-contact" data-reveal="">Let’s talk about your business.</h2>
        <p className={s.prose}>Tell us what you’re looking for and which package or services you want to discuss.</p>
      </section>
    </main>
    <footer className={p.footer} data-style={design.footer}>
      <nav aria-label="KRIV"><a href="https://kriv.agency/">kriv.agency</a><a href="https://kriv.agency/pricing">US pricing</a><a href={`mailto:${contact.email}`}>{contact.email}</a></nav>
      {play && <PhLogoPlay mode={play} />}
      {(design.footer === "wordmark" || design.footer === "inkfill") && <p className={p.giant} aria-hidden="true" data-progress={design.footer === "inkfill" ? "end" : undefined}>kriv<span>×</span></p>}
      <p className={p.credit}>Page look chosen by the KRIV design randomizer, seed {design.seed}.</p>
    </footer>
    <footer className={s.actions} aria-label="Contact KRIV">
      <a href={`mailto:${contact.email}`}>Message us</a>
      <a href={contact.booking}>Book a call</a>
    </footer>
  </div>;
}
