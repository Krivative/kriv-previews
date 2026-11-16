import { KRIV_BOOKING, KRIV_EMAIL, PH_ELIGIBILITY, TRIAL_DAYS, audiences } from "@/offers/ph-local";
import { KrivMark, OfferSections, offerNav } from "./OfferPage";
import { SectionNav } from "./PlanBuilder";
import { RatesJourney } from "./RatesJourney";
import j from "./journey.module.css";
import { lookAttributes, ratesLook, themeVars } from "@/stories/journey-style";
import s from "./sections.module.css";
import o from "./offer.module.css";

// KRIV's general Philippine rates, served at /ph-rates. Same figures as a
// lead's quotation (src/offers/ph-local.ts) with no client named. It is KRIV's
// own page in KRIV's own look, not a preview of anyone's business, so it
// carries no concept banner and its two contact links (KRIV's booking page and
// email) are live. It keeps the rest: noindex (layout and headers), no forms,
// nothing collected. Its only scripts are the plan builder and the section menu.

export function PhRatesPage() {
  const look = ratesLook();
  return <div className={`${s.site} ${o.root} ${j.root}`} lang="en-PH" style={themeVars(look.theme)} {...lookAttributes(look)}>
    <link rel="stylesheet" href={look.theme.googleCss} precedence="fonts" />
    <a className={s.skipLink} href="#main-content">Skip to content</a>
    <header className={o.top}>
      <KrivMark />
      <span className={o.eyebrow}>Philippine rates</span>
    </header>
    <main id="main-content">
      <RatesJourney />
      <SectionNav items={offerNav} />
      <div className={o.main}>
      <section className={o.intro}>
        <p className={o.eyebrow}>Philippine rates</p>
        <h2>Fourteen days free. <em>Then one yearly decision.</em></h2>
        <p className={o.lead}>Try any service free for {TRIAL_DAYS} days, each one personally managed by KRIV staff. Then go annual, with free months if you decide early and a bundle discount if you stack services, or stop. No month to month plan, no setup fee.</p>
      </section>

      <OfferSections audience={audiences.general} />

      <section className={o.block} aria-labelledby="offer-next">
        <p className={o.eyebrow}>Next step</p>
        <h2 id="offer-next">Start with a conversation.</h2>
        <p>Tell KRIV about your business and which service you would like to try first. This page has no form and collects no information.</p>
        <p className={o.actions}>
          <a className={o.button} href={KRIV_BOOKING}>Book a call with KRIV <span aria-hidden="true">+</span></a>
          <a href={`mailto:${KRIV_EMAIL}`}>{KRIV_EMAIL}</a>
        </p>
      </section>
      </div>
    </main>
    <footer className={o.foot}>
      <p>KRIV. Philippine rates.</p>
      <p>{PH_ELIGIBILITY}</p>
    </footer>
  </div>;
}
