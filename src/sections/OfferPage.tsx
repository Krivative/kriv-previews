import { journeyStyle, themeVars } from "@/stories/journey-style";
import Link from "next/link";
import type { SiteData } from "@/lib/site-schema";
import { pageHref } from "@/lib/site-pages";
import {
  KRIV_EMAIL, PH_ELIGIBILITY, REFERRAL, TRIAL_DAYS, VA_NOTE, addOns, aiTrialIdeas, allThreeMonthly, annualPay, annualPlans, annualPrice, annualSaving, annualWorth,
  audiences, contentTiers, crm, crmIncludes, decisionWindows, everyPlan, exclusions, fill, monthlyServices, liveSeller, LIVE_SELLER_COMMISSION_NOTE, yearly, php, terms, totalMonths, vaTrials, type Audience,
} from "@/offers/ph-local";
import { Ribbon, conceptNotice } from "./Chrome";
import { inert } from "./inert";
import { PlanBuilder, SectionNav, type NavItem } from "./PlanBuilder";
import { AnnualStory } from "./AnnualStory";
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

/** Web fonts for KRIV's own pages: a wide display face, a plain body face and a mono for labels. */
export const OFFER_FONTS = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Lexend+Zetta:wght@200;300;400&family=Manrope:wght@400;500;600;700&display=swap";

/** The kriv.agency wordmark: lowercase name and the lime cross. */
export function KrivMark() {
  return <span className={o.kriv}>kriv<span aria-hidden="true">×</span></span>;
}

/** The sections of OfferSections plus the closing one, for the sticky menu. */
export const offerNav: NavItem[] = [
  { id: "offer-builder", label: "Build your plan" },
  { id: "offer-monthly", label: "Services" },
  { id: "offer-content", label: "Content" },
  { id: "offer-annual", label: "CRM" },
  { id: "offer-addons", label: "Add-ons" },
  { id: "offer-story", label: "The story" },
  { id: "offer-annual-plans", label: "Annual savings" },
  { id: "offer-va", label: "Free trials" },
  { id: "offer-terms", label: "Terms" },
  { id: "offer-next", label: "Start" },
];

/** The audience a lead's quotation is written for. */
export function audienceFor(site: SiteData): Audience {
  return site.contentNiche === "dental" ? audiences.clinic : audiences.general;
}

/** Trial, rates, CRM plan, add-ons, annual plans, VA and AI trials, referral and terms: identical figures on every page. */
export function OfferSections({ audience }: { audience: Audience }) {
  const t = (text: string) => fill(text, audience);
  const freeWindows = decisionWindows.filter((w) => w.freeMonths > 0);
  const days = (w: (typeof decisionWindows)[number]) => (w.toDay ? `Days ${w.fromDay} to ${w.toDay}` : `From day ${w.fromDay}`);
  return <>
    <link rel="stylesheet" href={OFFER_FONTS} precedence="fonts" />
    <section className={o.block} aria-labelledby="offer-trial">
      <p className={o.eyebrow}>With every plan</p>
      <h2 id="offer-trial">Start free. <em>Stay because it works for you.</em></h2>
      <ul className={o.facts}>
        {everyPlan.map((item) => <li key={item.name}><h3>{item.name}</h3><p>{t(item.body)}</p></li>)}
      </ul>
      <p className={o.small}>{PH_ELIGIBILITY}</p>
    </section>

    <section className={o.block} aria-labelledby="offer-builder">
      <p className={o.eyebrow}>Build your plan</p>
      <h2 id="offer-builder">Pick what you need. <em>See the total and the saving.</em></h2>
      <p>Tap a service to see its price. Choose Combine services to add several and see the bundle discount on the annual plan. The figures are worked out on this page only; nothing is saved or sent.</p>
      <PlanBuilder />
    </section>

    <section className={o.block} aria-labelledby="offer-monthly">
      <p className={o.eyebrow}>Services</p>
      <h2 id="offer-monthly">One yearly price <em>for each service.</em></h2>
      <p>After the {TRIAL_DAYS}-day free trial every service is on the annual plan: {crm.baseMonths} months paid at once. There is no month to month plan. No setup fee.</p>
      <ul className={o.cards}>
        {monthlyServices.map((item) => <li key={item.name}>
          <h3>{item.name}</h3>
          <p className={o.price}>{php(yearly(item.monthly))} <span>a year</span></p>
          <p className={o.small}>Works out to {php(item.monthly)} a month.</p>
          {item.name === "AI live seller" ? <p className={o.small}>Want to try it first? A paid {liveSeller.starterMonths}-month starter is {php(liveSeller.starterPrice)}, then annual. {LIVE_SELLER_COMMISSION_NOTE}</p> : null}
          <p>{t(item.note)}</p>
          <ul className={o.ticks}>{item.includes.map((line) => <li key={line}>{t(line)}</li>)}</ul>
        </li>)}
        <li className={o.feature}>
          <h3>All three together</h3>
          <p className={o.price}>{php(yearly(allThreeMonthly))} <span>a year</span></p>
          <p className={o.small}>Works out to {php(allThreeMonthly)} a month, before the bundle discount.</p>
          <p>Website, content creation and AI live seller, run by one KRIV team.</p>
        </li>
      </ul>
    </section>

    <section className={o.block} aria-labelledby="offer-content">
      <p className={o.eyebrow}>Content packages</p>
      <h2 id="offer-content">From posts <em>to full social media management.</em></h2>
      <p>Start with posts and grow into a managed presence: someone who posts daily, answers {t("{your}")} audience and studies {t("{your}")} niche.</p>
      <ul className={o.cards}>
        {contentTiers.map((tier) => <li key={tier.name}>
          <h3>{tier.name}</h3>
          <p className={o.price}>{tier.monthly ? <>{php(yearly(tier.monthly))} <span>a year</span><br /><span className={o.small}>Works out to {php(tier.monthly)} a month.</span></> : <span>Quoted for {t("{client}")}</span>}</p>
          <ul className={o.ticks}>{tier.includes.map((line) => <li key={line}>{t(line)}</li>)}</ul>
        </li>)}
      </ul>
    </section>

    <section className={o.block} aria-labelledby="offer-annual">
      <p className={o.eyebrow}>CRM and system with automations</p>
      <h2 id="offer-annual">One organised place for every inquiry. <em>Follow-ups that send themselves.</em></h2>
      <div className={o.split}>
        <ul className={o.ticks}>{crmIncludes.map((line) => <li key={line}>{t(line)}</li>)}</ul>
        <div className={o.promo}>
          <p className={o.tag}>Promo rate</p>
          <p className={o.price}>{php(annualPrice)} <span>a year</span></p>
          <p className={o.small}>Works out to {php(crm.promoMonthly)} a month. Regular rate <s>{php(crm.regularMonthly)}</s> a month. No setup fee.</p>
          <p>That is {php(crm.regularMonthly - crm.promoMonthly)} saved on every month of the year. The annual plan is {crm.baseMonths} months at the promo rate, {php(annualPrice)}, and deciding early in the trial adds free months on top.</p>
        </div>
      </div>
    </section>

    <section className={o.block} aria-labelledby="offer-addons">
      <p className={o.eyebrow}>Add-ons</p>
      <h2 id="offer-addons">Add to any plan, <em>whenever you are ready.</em></h2>
      <ul className={o.cards}>
        {addOns.map((item) => <li key={item.name}>
          <h3>{item.name}</h3>
          {item.unit === "per month" ? <><p className={o.price}>{php(yearly(item.price))} <span>a year</span></p><p className={o.small}>Works out to {php(item.price)} a month.</p></>
            : <p className={o.price}>{php(item.price)} <span>{item.unit}</span></p>}
          <ul className={o.ticks}>{item.includes.map((line) => <li key={line}>{t(line)}</li>)}</ul>
        </li>)}
      </ul>
    </section>

    <section className={o.block} aria-labelledby="offer-story">
      <p className={o.eyebrow}>Why decide early</p>
      <h2 id="offer-story">The two timelines. <em>A short story about one website.</em></h2>
      <p>Picture the same business in two timelines. Both go annual. One decides in the first days of the trial, the other after it ends. Scroll to watch each one play out.</p>
      <AnnualStory audience={audience} />
    </section>

    <section className={o.block} aria-labelledby="offer-annual-plans">
      <p className={o.eyebrow}>Annual plans</p>
      <h2 id="offer-annual-plans">Pay for twelve months. <em>Get up to fifteen.</em></h2>
      <p>Every service is paid yearly. You pay {crm.baseMonths} months and KRIV adds extra months free. The sooner you decide during your trial, the more months you get. Day 1 is the first day of your trial, and the trial ends on day {TRIAL_DAYS}. After that the annual plan is still open, at {crm.baseMonths} months for the price of {crm.baseMonths}.</p>
      <ul className={o.windows}>
        {decisionWindows.map((w) => <li key={w.fromDay}>
          <h3>{days(w)}</h3>
          {w.freeMonths ? <>
            <p className={o.price}>{w.freeMonths} {w.freeMonths === 1 ? "month" : "months"} free</p>
            <p>{totalMonths(w)} months for the price of {crm.baseMonths}.</p>
          </> : <>
            <p className={o.price}>No free months</p>
            <p>The annual plan is still open: {crm.baseMonths} months for the price of {crm.baseMonths}, with the CRM promo rate and any bundle discount.</p>
          </>}
        </li>)}
      </ul>
      <h3 className={o.subhead}>What you save on each service</h3>
      <p>Open a service to see the regular value of those months, what you pay on the annual plan, and the difference.</p>
      <div className={o.savings}>
        {annualPlans.map((plan, i) => <details key={plan.name} open={i === 0}>
          <summary>
            <strong>{plan.name}</strong>
            <span>save up to {php(annualSaving(plan, freeWindows[0]))}</span>
            <span className={o.toggle} aria-hidden="true">+</span>
          </summary>
          <p className={o.small}>Annual plan: {php(annualPay(plan))}, which works out to {php(plan.monthly)} a month{plan.regular > plan.monthly ? <> (regular <s>{php(plan.regular)}</s>)</> : null}.</p>
          <table>
            <thead><tr><th scope="col">Decide on</th><th scope="col">You get</th><th scope="col">Regular value</th><th scope="col">You pay</th><th scope="col">You save</th></tr></thead>
            <tbody>{freeWindows.map((w) => <tr key={w.fromDay}>
              <th scope="row">{days(w)}</th>
              <td>{totalMonths(w)} months</td>
              <td><s>{php(annualWorth(plan, w))}</s></td>
              <td>{php(annualPay(plan))}</td>
              <td className={o.saved}>{php(annualSaving(plan, w))}</td>
            </tr>)}</tbody>
          </table>
        </details>)}
      </div>
      <p className={o.small}>Regular value means the same number of months at the regular rate. For the CRM that is {php(crm.regularMonthly)} a month, so its saving includes the promo.</p>
    </section>

    <section className={o.block} aria-labelledby="offer-va">
      <p className={o.eyebrow}>Also free to try</p>
      <h2 id="offer-va">A virtual assistant trial, <em>two ways.</em></h2>
      <ul className={o.cards}>
        {vaTrials.map((item) => <li key={item.name}><h3>{item.name}</h3><p>{t(item.body)}</p></li>)}
      </ul>
      <p className={o.small}>{VA_NOTE}</p>
    </section>

    <section className={o.block} aria-labelledby="offer-ai">
      <p className={o.eyebrow}>{audience.aiEyebrow}</p>
      <h2 id="offer-ai">AI trials <em>on the house.</em></h2>
      <p>{t("Try the AI agent on real work before adding it. Each trial is set up and supervised by KRIV staff and uses only information and wording {client} approves.")}</p>
      <ul className={o.cards}>
        {aiTrialIdeas.map((item) => <li key={item.name}><h3>{item.name}</h3><p>{t(item.body)}</p></li>)}
      </ul>
    </section>

    <section className={o.block} aria-labelledby="offer-referral">
      <p className={o.eyebrow}>Referrals</p>
      <h2 id="offer-referral">Referral program</h2>
      <p>{REFERRAL}</p>
    </section>

    <section className={o.block} aria-labelledby="offer-terms">
      <p className={o.eyebrow}>The fine print, in plain words</p>
      <h2 id="offer-terms">Scope and terms</h2>
      <div className={o.terms}>
        <div><h3>Not included</h3><ul>{exclusions.map((line) => <li key={line}>{t(line)}</li>)}</ul></div>
        {terms.map((item) => <div key={item.name}><h3>{item.name}</h3><p>{t(item.body)}</p></div>)}
        <div><h3>What KRIV does not promise</h3><p>KRIV does not promise specific results, search rankings, numbers of leads or bookings, sales figures or uptime figures. KRIV commits to the work described here and to honest reporting on it.</p></div>
      </div>
      <p className={o.small}>All prices in Philippine pesos (PHP).</p>
    </section>
  </>;
}

export function OfferPage({ site }: { site: SiteData }) {
  const offer = site.offer;
  if (!offer) return null;
  const name = site.business.name;
  // A story lead's quotation wears that lead's own theme, so it matches their site.
  const theme = site.story ? journeyStyle(site).theme : undefined;
  return <div className={o.root} style={theme ? themeVars(theme) : undefined} data-theme-name={theme?.name}>
    {theme ? <link rel="stylesheet" href={theme.googleCss} precedence="fonts" /> : null}
    <Ribbon site={site} />
    <a className={s.skipLink} href="#main-content">Skip to content</a>
    <header className={o.top}>
      <KrivMark />
      <Link href={pageHref(site)} prefetch={false}>Back to the concept website <span aria-hidden="true">↗</span></Link>
    </header>
    <SectionNav items={offerNav} />
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
        <p className={o.eyebrow}>Next step</p>
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
