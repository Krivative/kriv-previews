import Link from "next/link";
import type { SiteData } from "@/lib/site-schema";
import { pageHref } from "@/lib/site-pages";
import {
  KRIV_EMAIL, PH_ELIGIBILITY, REFERRAL, TRIAL_DAYS, VA_NOTE, addOns, aiTrialIdeas, allThreeMonthly, annualPrice, audiences, contentTiers, crm, crmIncludes,
  decisionWindows, effectiveMonthly, everyPlan, exclusions, fill, monthlyServices, php, regularCost, terms, totalMonths, vaTrials, type Audience,
} from "@/offers/ph-local";
import { Ribbon, conceptNotice } from "./Chrome";
import { inert } from "./inert";
import s from "./sections.module.css";
import o from "./offer.module.css";

// KRIV's offer and quotation for one lead, served at /<slug>/offer. It is KRIV's
// own page, so it is not part of the concept site's navigation and it wears
// KRIV's own look (offer.module.css), not the lead's template. Same guardrails
// as every preview: concept banner, noindex (layout and headers), no live
// outbound links, no forms, nothing collected.
//
// OfferSections is the shared body. The general Philippine rates page
// (PhRatesPage.tsx) renders the same sections for any business.

const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** The kriv.agency wordmark: lowercase name and the lime cross. */
export function KrivMark() {
  return <span className={o.kriv}>kriv<span aria-hidden="true">×</span></span>;
}

/** The audience a lead's quotation is written for. */
export function audienceFor(site: SiteData): Audience {
  return site.contentNiche === "dental" ? audiences.clinic : audiences.general;
}

/** Trial, rates, CRM plan, add-ons, VA and AI trials, referral and terms: identical figures on every page. */
export function OfferSections({ audience }: { audience: Audience }) {
  const t = (text: string) => fill(text, audience);
  return <>
    <section className={o.block} aria-labelledby="offer-trial">
      <p className={o.eyebrow}>01 / With every plan</p>
      <h2 id="offer-trial">Start free. <em>Stay because it works for you.</em></h2>
      <ul className={o.facts}>
        {everyPlan.map((item) => <li key={item.name}><h3>{item.name}</h3><p>{t(item.body)}</p></li>)}
      </ul>
      <p className={o.small}>{PH_ELIGIBILITY}</p>
    </section>

    <section className={o.block} aria-labelledby="offer-monthly">
      <p className={o.eyebrow}>02 / Monthly services</p>
      <h2 id="offer-monthly">Pay month to month. <em>No setup fee.</em></h2>
      <ul className={o.cards}>
        {monthlyServices.map((item) => <li key={item.name}>
          <h3>{item.name}</h3>
          <p className={o.price}>{php(item.monthly)} <span>per month</span></p>
          <p>{t(item.note)}</p>
          <ul className={o.ticks}>{item.includes.map((line) => <li key={line}>{t(line)}</li>)}</ul>
        </li>)}
        <li className={o.feature}>
          <h3>All three together</h3>
          <p className={o.price}>{php(allThreeMonthly)} <span>per month</span></p>
          <p>Website, content creation and AI live seller, run by one KRIV team.</p>
        </li>
      </ul>
    </section>

    <section className={o.block} aria-labelledby="offer-content">
      <p className={o.eyebrow}>03 / Content packages</p>
      <h2 id="offer-content">From posts <em>to full social media management.</em></h2>
      <p>Start with posts and grow into a managed presence: someone who posts daily, answers {t("{your}")} audience and studies {t("{your}")} niche.</p>
      <ul className={o.cards}>
        {contentTiers.map((tier) => <li key={tier.name}>
          <h3>{tier.name}</h3>
          <p className={o.price}>{tier.monthly ? <>{php(tier.monthly)} <span>per month</span></> : <span>Quoted for {t("{client}")}</span>}</p>
          <ul className={o.ticks}>{tier.includes.map((line) => <li key={line}>{t(line)}</li>)}</ul>
        </li>)}
      </ul>
    </section>

    <section className={o.block} aria-labelledby="offer-annual">
      <p className={o.eyebrow}>04 / CRM and system with automations</p>
      <h2 id="offer-annual">One organised place for every inquiry. <em>Follow-ups that send themselves.</em></h2>
      <div className={o.split}>
        <ul className={o.ticks}>{crmIncludes.map((line) => <li key={line}>{t(line)}</li>)}</ul>
        <div className={o.promo}>
          <p className={o.tag}>Promo rate</p>
          <p className={o.price}>{php(crm.promoMonthly)} <span>per month</span></p>
          <p className={o.small}>Regular rate <s>{php(crm.regularMonthly)}</s> per month. No setup fee.</p>
          <p>Go annual and the promo stacks: pay {crm.baseMonths} months at the promo rate, {php(annualPrice)}, and KRIV adds extra months free.</p>
        </div>
      </div>
      <h3 className={o.subhead}>Extra months on the annual plan</h3>
      <p>The sooner you decide after your trial, the more months you get. Day 1 is the first day of your trial, and the trial ends on day {TRIAL_DAYS}.</p>
      <ul className={o.windows}>
        {decisionWindows.map((w) => <li key={w.fromDay}>
          <h3>{w.toDay ? `Days ${w.fromDay} to ${w.toDay}` : `From day ${w.fromDay}`}</h3>
          {w.freeMonths ? <>
            <p className={o.price}>{w.freeMonths} {w.freeMonths === 1 ? "month" : "months"} free</p>
            <p>{totalMonths(w)} months for {php(annualPrice)}, about {php(effectiveMonthly(w))} per month.</p>
            <p className={o.small}>{totalMonths(w)} months at the regular rate: {php(regularCost(w))}.</p>
          </> : <>
            <p className={o.price}>Monthly</p>
            <p>The extra months have passed. The promo rate of {php(crm.promoMonthly)} per month still applies.</p>
          </>}
        </li>)}
      </ul>
    </section>

    <section className={o.block} aria-labelledby="offer-addons">
      <p className={o.eyebrow}>05 / Add-ons</p>
      <h2 id="offer-addons">Add to any plan, <em>whenever you are ready.</em></h2>
      <ul className={o.cards}>
        {addOns.map((item) => <li key={item.name}>
          <h3>{item.name}</h3>
          <p className={o.price}>{php(item.price)} <span>{item.unit}</span></p>
          <ul className={o.ticks}>{item.includes.map((line) => <li key={line}>{t(line)}</li>)}</ul>
        </li>)}
      </ul>
    </section>

    <section className={o.block} aria-labelledby="offer-va">
      <p className={o.eyebrow}>06 / Also free to try</p>
      <h2 id="offer-va">A virtual assistant trial, <em>two ways.</em></h2>
      <ul className={o.cards}>
        {vaTrials.map((item) => <li key={item.name}><h3>{item.name}</h3><p>{t(item.body)}</p></li>)}
      </ul>
      <p className={o.small}>{VA_NOTE}</p>
    </section>

    <section className={o.block} aria-labelledby="offer-ai">
      <p className={o.eyebrow}>07 / {audience.aiEyebrow}</p>
      <h2 id="offer-ai">AI trials <em>on the house.</em></h2>
      <p>{t("Try the AI agent on real work before adding it. Each trial is set up and supervised by KRIV staff and uses only information and wording {client} approves.")}</p>
      <ul className={o.cards}>
        {aiTrialIdeas.map((item) => <li key={item.name}><h3>{item.name}</h3><p>{t(item.body)}</p></li>)}
      </ul>
    </section>

    <section className={o.block} aria-labelledby="offer-referral">
      <p className={o.eyebrow}>08 / Referrals</p>
      <h2 id="offer-referral">Referral program</h2>
      <p>{REFERRAL}</p>
    </section>

    <section className={o.block} aria-labelledby="offer-terms">
      <p className={o.eyebrow}>09 / The fine print, in plain words</p>
      <h2 id="offer-terms">Scope and terms</h2>
      <div className={o.terms}>
        <div><h3>Not included</h3><ul>{exclusions.map((line) => <li key={line}>{t(line)}</li>)}</ul></div>
        {terms.map((item) => <div key={item.name}><h3>{item.name}</h3><p>{t(item.body)}</p></div>)}
        <div><h3>What KRIV does not promise</h3><p>KRIV does not promise specific results, search rankings, numbers of leads or bookings, uptime figures or round-the-clock coverage. KRIV commits to the work described here and to honest reporting on it.</p></div>
      </div>
      <p className={o.small}>All prices in Philippine pesos (PHP).</p>
    </section>
  </>;
}

export function OfferPage({ site }: { site: SiteData }) {
  const offer = site.offer;
  if (!offer) return null;
  const name = site.business.name;
  return <div className={o.root}>
    <Ribbon site={site} />
    <a className={s.skipLink} href="#main-content">Skip to content</a>
    <header className={o.top}>
      <KrivMark />
      <Link href={pageHref(site)} prefetch={false}>Back to the concept website <span aria-hidden="true">↗</span></Link>
    </header>
    <main id="main-content" className={o.main}>
      <section className={o.intro}>
        <p className={o.eyebrow}>Offer and quotation</p>
        <h1>A simple way to start, <em>prepared for {name}.</em></h1>
        <p className={o.lead}>Try any service free for {TRIAL_DAYS} days, each one personally managed by KRIV staff. Decide afterwards, with no setup fee.</p>
        <dl className={o.meta}>
          <div><dt>Quote number</dt><dd>{offer.quoteNumber}</dd></div>
          <div><dt>Date</dt><dd>{longDate(offer.quoteDate)}</dd></div>
          <div><dt>Prepared for</dt><dd>{name}</dd></div>
          <div><dt>Valid until</dt><dd>{longDate(offer.validUntil)}</dd></div>
        </dl>
      </section>

      <OfferSections audience={audienceFor(site)} />

      <section className={o.block} aria-labelledby="offer-next">
        <p className={o.eyebrow}>10 / Next step</p>
        <h2 id="offer-next">Start with a conversation.</h2>
        <p>To start a free trial or ask a question, reply to Kriv directly or write to {KRIV_EMAIL}. This page has no form and collects no information.</p>
        <p><a className={o.button} {...inert}>Start my free trial <span aria-hidden="true">+</span></a></p>
        <p className={o.small}>The button is disabled in this concept preview.</p>
      </section>
    </main>
    <footer className={o.foot}>
      <p>Prepared by KRIV for {name}. Quote {offer.quoteNumber}, valid until {longDate(offer.validUntil)}.</p>
      <p>{conceptNotice(name)}</p>
    </footer>
  </div>;
}

/** The concept site's only pointer to KRIV's offer: one line beneath the footer. */
export function OfferPointer({ site }: { site: SiteData }) {
  if (!site.offer) return null;
  return <p className={o.pointer}>From KRIV: <Link href={pageHref(site, "offer")} prefetch={false}>see the offer and quotation for {site.business.name} <span aria-hidden="true">↗</span></Link></p>;
}
