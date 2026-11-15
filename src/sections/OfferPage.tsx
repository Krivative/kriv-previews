import Link from "next/link";
import type { SiteData } from "@/lib/site-schema";
import { pageHref } from "@/lib/site-pages";
import {
  DRAFT_MARK, PH_ELIGIBILITY, TRIAL_DAYS, VA_PLACEHOLDERS, aiTrialIdeas, allThreeMonthly, annualCrm, decisionWindows,
  effectiveMonthly, exclusions, monthlyServices, php, terms, totalMonths, vaTrials,
} from "@/offers/ph-local";
import { Ribbon, conceptNotice } from "./Chrome";
import { inert } from "./inert";
import s from "./sections.module.css";
import o from "./offer.module.css";

// KRIV's offer and quotation for one lead, served at /<slug>/offer. It is KRIV's
// own page, so it is not part of the concept site's navigation. Same guardrails
// as every preview: concept banner, noindex (layout and headers), no live
// outbound links, no forms, nothing collected.

const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const Draft = () => <span className={o.draft}>{DRAFT_MARK}</span>;

export function OfferPage({ site }: { site: SiteData }) {
  const offer = site.offer;
  if (!offer) return null;
  const name = site.business.name;
  return <div className={o.root}>
    <Ribbon site={site} />
    <a className={s.skipLink} href="#main-content">Skip to content</a>
    <header className={o.top}>
      <span className={o.kriv}>KRIV Agency</span>
      <Link href={pageHref(site)} prefetch={false}>Back to the concept website <span aria-hidden="true">↗</span></Link>
    </header>
    <main id="main-content" className={o.main}>
      <section className={o.intro}>
        <p className={o.eyebrow}>Offer and quotation</p>
        <h1>A simple way to start, <em>prepared for {name}.</em></h1>
        <p className={o.lead}>Try any service free for {TRIAL_DAYS} days, each one personally managed by KRIV staff. Decide afterwards, with no setup fee.</p>
        <p className={o.notice} role="note"><strong>Draft quotation.</strong> Every price on this page is a draft, pending Kriv&rsquo;s approval. Items in [BRACKETS] are still to be confirmed.</p>
        <dl className={o.meta}>
          <div><dt>Quote number</dt><dd>{offer.quoteNumber}</dd></div>
          <div><dt>Date</dt><dd>{longDate(offer.quoteDate)}</dd></div>
          <div><dt>Prepared for</dt><dd>{name}</dd></div>
          <div><dt>Valid until</dt><dd>{longDate(offer.validUntil)}</dd></div>
        </dl>
      </section>

      <section className={o.block} aria-labelledby="offer-trial">
        <p className={o.eyebrow}>Step one</p>
        <h2 id="offer-trial">{TRIAL_DAYS}-day free trial</h2>
        <p>Choose any service below and try it free for {TRIAL_DAYS} days. A KRIV team member personally manages each trial and stays your point of contact throughout.</p>
        <p className={o.small}>{PH_ELIGIBILITY}</p>
      </section>

      <section className={o.block} aria-labelledby="offer-monthly">
        <p className={o.eyebrow}>Monthly rates</p>
        <h2 id="offer-monthly">Pay month to month</h2>
        <ul className={o.cards}>
          {monthlyServices.map((item) => <li key={item.name}>
            <h3>{item.name}</h3>
            <p className={o.price}>{php(item.monthly)} <span>per month</span></p>
            <Draft />
            <p>{item.note}</p>
          </li>)}
          <li className={o.feature}>
            <h3>All three services</h3>
            <p className={o.price}>{php(allThreeMonthly)} <span>per month</span></p>
            <Draft />
            <p>Website, content creation and AI live seller together.</p>
          </li>
        </ul>
        <p className={o.small}>No setup fee. <Draft /></p>
        <p className={o.small}>Branding kit: [BRANDING KIT PRICE: to be confirmed by Kriv]</p>
      </section>

      <section className={o.block} aria-labelledby="offer-annual">
        <p className={o.eyebrow}>Annual plan</p>
        <h2 id="offer-annual">Annual CRM: {php(annualCrm.price)} for {annualCrm.baseMonths} months</h2>
        <Draft />
        <p>Decide soon after your trial and KRIV adds free months on top of the {annualCrm.baseMonths}. Day 1 is the first day of your trial, and the trial ends on day {TRIAL_DAYS}.</p>
        <ul className={o.windows}>
          {decisionWindows.map((w) => <li key={w.fromDay}>
            <h3>{w.toDay ? `Days ${w.fromDay} to ${w.toDay}` : `From day ${w.fromDay}`}</h3>
            {w.freeMonths ? <>
              <p className={o.price}>{w.freeMonths} {w.freeMonths === 1 ? "month" : "months"} free</p>
              <p>{totalMonths(w)} months in total for {php(annualCrm.price)}, about {php(effectiveMonthly(w))} per month.</p>
            </> : <>
              <p className={o.price}>Monthly rates</p>
              <p>The annual plan with free months is no longer available. The monthly rates above apply.</p>
            </>}
            <Draft />
          </li>)}
        </ul>
      </section>

      <section className={o.block} aria-labelledby="offer-va">
        <p className={o.eyebrow}>Also free to try</p>
        <h2 id="offer-va">Virtual assistant trial, two ways</h2>
        <ul className={o.cards}>
          {vaTrials.map((item) => <li key={item.name}><h3>{item.name}</h3><p>{item.body}</p>{VA_PLACEHOLDERS.map((line) => <p key={line} className={o.small}>{line}</p>)}</li>)}
        </ul>
      </section>

      <section className={o.block} aria-labelledby="offer-ai">
        <p className={o.eyebrow}>For a dental clinic</p>
        <h2 id="offer-ai">Complementary AI trials</h2>
        <p>Draft ideas for Kriv to approve. Each one would be set up and supervised by KRIV staff and would use only information and wording the clinic approves.</p>
        <ul className={o.cards}>
          {aiTrialIdeas.map((item) => <li key={item.name}><h3>{item.name}</h3><p>{item.body}</p><span className={o.draft}>Draft idea</span></li>)}
        </ul>
      </section>

      <section className={o.block} aria-labelledby="offer-referral">
        <p className={o.eyebrow}>Referrals</p>
        <h2 id="offer-referral">Referral program</h2>
        <p>[REFERRAL PROGRAM: reward and rules to be confirmed by Kriv]</p>
      </section>

      <section className={o.block} aria-labelledby="offer-terms">
        <p className={o.eyebrow}>The fine print, in plain words</p>
        <h2 id="offer-terms">Scope and terms</h2>
        <div className={o.terms}>
          <div><h3>Not included</h3><ul>{exclusions.map((line) => <li key={line}>{line}</li>)}</ul></div>
          {terms.map((item) => <div key={item.name}><h3>{item.name}</h3><p>{item.body}</p></div>)}
          <div><h3>What KRIV does not promise</h3><p>KRIV does not promise specific results, search rankings, numbers of leads or bookings, uptime figures or round-the-clock coverage. KRIV commits to the work described here and to honest reporting on it.</p></div>
        </div>
        <span className={o.draft}>Draft terms, pending Kriv&rsquo;s approval</span>
      </section>

      <section className={o.block} aria-labelledby="offer-next">
        <p className={o.eyebrow}>Next step</p>
        <h2 id="offer-next">Start with a conversation</h2>
        <p>To start a free trial or ask a question, reply to Kriv directly. This page has no form and collects no information.</p>
        <p><a className={o.button} {...inert}>Start my free trial</a></p>
        <p className={o.small}>The button is disabled in this draft.</p>
      </section>
    </main>
    <footer className={o.foot}>
      <p>Prepared by KRIV Agency for {name}. Quote {offer.quoteNumber}, valid until {longDate(offer.validUntil)}.</p>
      <p>{conceptNotice(name)}</p>
    </footer>
  </div>;
}

/** The concept site's only pointer to KRIV's offer: one line beneath the footer. */
export function OfferPointer({ site }: { site: SiteData }) {
  if (!site.offer) return null;
  return <p className={o.pointer}>From KRIV: <Link href={pageHref(site, "offer")} prefetch={false}>see the draft offer and quotation for {site.business.name} <span aria-hidden="true">↗</span></Link></p>;
}
