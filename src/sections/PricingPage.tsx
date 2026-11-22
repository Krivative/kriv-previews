import type { SiteData } from "@/lib/site-schema";
import { markets, pricingRules } from "@/offers/pricing";
import { money } from "@/offers/pricing-math";
import { Ribbon } from "./Chrome";
import { inert } from "./inert";
import { PricingCalculator } from "./PricingCalculator";
import s from "./pricing.module.css";

export function PricingPage({ region, site }: { region: keyof typeof markets; site?: SiteData }) {
  const ph = region === "ph";
  const market = markets[region];
  const fmt = (n: number, decimals = 0) => money(n, market.currency, decimals);
  const { contact } = pricingRules;
  const free = pricingRules.us.freeWebsite;
  const booking = site ? inert : { href: contact.booking };
  const email = site ? inert : { href: `mailto:${contact.email}` };
  return <div className={s.root} data-market={region} lang={ph ? "en-PH" : "en-US"}>
    <a className={s.skip} href="#pricing-main">Skip to pricing</a>
    {site && <Ribbon site={site} />}
    <header className={s.header}>
      {site ? <span className={s.mark}>kriv<span>×</span></span> : <a className={s.mark} href="https://kriv.agency/" aria-label="KRIV homepage">kriv<span aria-hidden="true">×</span></a>}
      <a href="#pricing-contact">Contact</a>
    </header>
    <main id="pricing-main">
      <section className={`${s.section} ${s.hero}`}>
        <p className={s.eyebrow}>{ph ? "Philippine pricing · PHP" : "US pricing · USD"}</p>
        <h1>{site ? `Pricing for ${site.business.name}` : ph ? "KRIV pricing." : free.headline}</h1>
        {!ph && <p className={s.lede}>{free.subline}</p>}
        <p className={s.prose}>{ph ? `Choose a package or build your own. Try it for ${pricingRules.ph.trialDays} days, then pay annually or stop.` : `${free.condition} Choose a package or build your own, and see setup and monthly management separately before we talk.`}</p>
        {site?.offer && <p className={s.prose}>Quote {site.offer.quoteNumber} · Valid through <time dateTime={site.offer.validUntil}>{site.offer.validUntil}</time></p>}
      </section>
      <PricingCalculator market={market} trial={ph ? { paidMonths: pricingRules.ph.paidMonths, annualDiscount: pricingRules.ph.annualDiscount, windows: pricingRules.ph.windows, allIn: pricingRules.ph.allIn } : undefined} />
      {ph && <section className={s.section} aria-labelledby="trial">
        <p className={s.eyebrow}>The trial</p>
        <h2 id="trial">Two weeks to try it.</h2>
        <ol className={s.cards}>{pricingRules.ph.trial.map(({ days, label }) => <li className={s.card} key={days}><h3>{days}</h3><p>{label}</p></li>)}</ol>
        <p className={s.prose}>{pricingRules.ph.postingGuidance}</p>
        <p>{pricingRules.ph.customVideoThreshold}+ videos a month: ask for a custom quote.</p>
      </section>}
      <section className={s.section} aria-labelledby="terms">
        <p className={s.eyebrow}>Plan details</p>
        <h2 id="terms">What to budget for.</h2>
        <details className={s.fold}>
        <summary>Read the plan details and fine print</summary>
        {ph ? <ul className={s.rules}>
          <li>{pricingRules.ph.eligibility}</li>
          <li>Annual base price is the regular monthly total × {pricingRules.ph.paidMonths}. The annual offer is paid once after the trial. It includes {pricingRules.ph.annualDiscount * 100}% off that base price, plus any free months in your decision window.</li>
          <li>Extra inbox platforms cost {fmt(pricingRules.ph.extraPlatformMonthly)} / mo each. Options: {[...pricingRules.ph.platforms, pricingRules.ph.conditionalPlatform].join(", ")}.</li>
          <li>One prepaid credit wallet per client covers extra caller minutes and live-seller messages. Wallet usage is priced at cost + {pricingRules.ph.walletMarkup * 100}%. The caller line above shows the per-minute overage rate.</li>
          <li>Monthly agent fee paid directly to the agent: {pricingRules.ph.agentFees.map((fee, i) => `${fmt(fee)} for ${["one service", "two services", "three or more services (cap)"][i]}`).join(", ")}. KRIV takes nothing.</li>
        </ul> : <ul className={s.rules}>
          <li>Single-service management is {fmt(pricingRules.us.managementMonthly)} / mo per service with no cap. The agent receives {pricingRules.us.agentShare * 100}% of the fee.</li>
          <li>Heavy services count as {pricingRules.us.heavyUnits} management units. Scope is agreed before quoting.</li>
          <li>Caller usage is {fmt(pricingRules.us.callPerMinute, 2)} per minute from prepaid credits.</li>
          <li>{free.condition} {free.shopify}</li>
          <li>{free.leaving}</li>
          <li>{pricingRules.linkedin}</li>
        </ul>}
        {ph && <p className={s.prose}>{pricingRules.linkedin}</p>}
        </details>
      </section>
      <section className={`${s.section} ${s.contact}`} aria-labelledby="pricing-contact">
        <h2 id="pricing-contact">Let’s talk about your business.</h2>
        <p className={s.prose}>Tell us what you’re looking for and which package or services you want to discuss.</p>
      </section>
    </main>
    <footer className={s.actions} aria-label="Contact KRIV">
      <a {...email}>Message us</a>
      <a {...booking}>Book a call</a>
    </footer>
  </div>;
}
