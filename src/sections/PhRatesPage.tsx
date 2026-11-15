import type { CSSProperties } from "react";
import { PH_ELIGIBILITY, TRIAL_DAYS, audiences } from "@/offers/ph-local";
import { templates } from "@/templates";
import { OfferSections } from "./OfferPage";
import s from "./sections.module.css";
import o from "./offer.module.css";

// KRIV's general Philippine rates, served at /ph-rates. Same figures as a
// lead's quotation (src/offers/ph-local.ts) with no client named. It is KRIV's
// own page, not a preview of anyone's business, so it carries no concept
// banner. It keeps the rest: noindex (layout and headers), no forms, no
// outbound links, nothing collected.

// Borrows the look of one existing design; no new tokens.
const LOOK = "office-calm";

export function PhRatesPage() {
  const template = templates[LOOK];
  const t = template.tokens;
  const vars = {
    "--bg": t.bg, "--surface": t.surface, "--ink": t.ink, "--muted": t.muted, "--line": t.line,
    "--accent": t.accent, "--accent-ink": t.accentInk, "--radius": t.radius, "--button-radius": t.buttonRadius,
    "--display-weight": t.displayWeight, "--display-tracking": t.displayTracking, "--display-case": t.displayCase,
    "--font-display": template.fonts.display, "--font-body": template.fonts.body,
    "--font-accent": template.fonts.accent ?? template.fonts.display,
  } as CSSProperties;
  return <div className={s.site} style={vars} lang="en-PH">
    <link rel="stylesheet" href={template.fonts.googleCss} precedence="fonts" />
    <div className={o.root}>
      <a className={s.skipLink} href="#main-content">Skip to content</a>
      <header className={o.top}>
        <span className={o.kriv}>KRIV Agency</span>
        <span>Philippine rates</span>
      </header>
      <main id="main-content" className={o.main}>
        <section className={o.intro}>
          <p className={o.eyebrow}>Philippine rates</p>
          <h1>Simple monthly rates <em>for Philippine businesses.</em></h1>
          <p className={o.lead}>Try any service free for {TRIAL_DAYS} days, each one personally managed by KRIV staff. Decide afterwards, with no setup fee.</p>
          <p className={o.notice} role="note"><strong>Draft rates.</strong> Every price on this page is a draft, pending Kriv&rsquo;s approval. Items in [BRACKETS] are still to be confirmed.</p>
        </section>

        <OfferSections audience={audiences.general} />

        <section className={o.block} aria-labelledby="offer-next">
          <p className={o.eyebrow}>Next step</p>
          <h2 id="offer-next">Start with a conversation</h2>
          <p>To start a free trial or ask a question, message KRIV. This page has no form and collects no information.</p>
          <p className={o.small}>[HOW TO REACH KRIV: contact link to be confirmed by Kriv]</p>
        </section>
      </main>
      <footer className={o.foot}>
        <p>KRIV Agency. Philippine rates, draft.</p>
        <p>{PH_ELIGIBILITY}</p>
      </footer>
    </div>
  </div>;
}
