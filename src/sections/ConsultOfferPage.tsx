import Link from "next/link";
import type { SiteData } from "@/lib/site-schema";
import { pageHref } from "@/lib/site-pages";
import { journeyStyle, themeVars } from "@/stories/journey-style";
import { KRIV_EMAIL } from "@/offers/ph-local";
import { consultDivisions, consultIntro, consultNoPrice, consultNoPromise, consultSite, consultSteps, consultYours } from "@/offers/consult-first";
import { Ribbon, conceptNotice } from "./Chrome";
import { inert } from "./inert";
import { KrivMark } from "./OfferPage";
import { SectionNav, type NavItem } from "./PlanBuilder";
import s from "./sections.module.css";
import o from "./offer.module.css";

// KRIV's "consult first" offer for one lead, served at /<slug>/offer when the record's
// offer plan is "consult-first". For any business in any market: no prices, no promised
// results, the same guardrails as every preview (concept banner, noindex, inert links,
// no form, nothing collected). A story lead's page wears that lead's own theme.

const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const nav: NavItem[] = [{ id: "consult-start", label: "How it starts" }, { id: "consult-work", label: "The work" }, { id: "consult-yours", label: "What stays yours" }, { id: "consult-price", label: "Why no price" }, { id: "consult-next", label: "Next step" }];

export function ConsultOfferPage({ site }: { site: SiteData }) {
  const offer = site.offer;
  if (!offer) return null;
  const name = site.business.name;
  const t = (text: string) => text.replaceAll("{client}", name);
  const theme = site.story ? journeyStyle(site).theme : undefined;
  return <div className={o.root} style={theme ? themeVars(theme) : undefined} data-theme-name={theme?.name} data-offer-plan="consult-first">
    {theme ? <link rel="stylesheet" href={theme.googleCss} precedence="fonts" /> : null}
    <Ribbon site={site} />
    <a className={s.skipLink} href="#main-content">Skip to content</a>
    <header className={o.top}>
      <KrivMark />
      <Link href={pageHref(site)} prefetch={false}>Back to the concept website <span aria-hidden="true">↗</span></Link>
    </header>
    <SectionNav items={nav} />
    <main id="main-content" className={o.main}>
      <section className={o.intro}>
        <p className={o.eyebrow}>How working with KRIV starts</p>
        <h1>First a conversation, <em>prepared for {name}.</em></h1>
        <p className={o.lead}>{consultIntro}</p>
        <dl className={o.meta}>
          <div><dt>Reference</dt><dd>{offer.quoteNumber}</dd></div>
          <div><dt>Date</dt><dd>{longDate(offer.quoteDate)}</dd></div>
          <div><dt>Prepared for</dt><dd>{name}</dd></div>
          <div><dt>Open until</dt><dd>{longDate(offer.validUntil)}</dd></div>
        </dl>
      </section>

      <section className={o.block} aria-labelledby="consult-start">
        <p className={o.eyebrow}>In order</p>
        <h2 id="consult-start">How it starts</h2>
        <ul className={o.cards}>{consultSteps.map((step, n) => <li key={step.name}><p className={o.eyebrow}>Step {n + 1}</p><h3>{step.name}</h3><p>{step.body}</p></li>)}</ul>
      </section>

      <section className={o.block} aria-labelledby="consult-work">
        <p className={o.eyebrow}>Three kinds of work</p>
        <h2 id="consult-work">What KRIV does</h2>
        <ul className={o.cards}>{consultDivisions.map((d) => <li key={d.name}><h3>{d.name}</h3><p>{d.body}</p></li>)}</ul>
      </section>

      <section className={o.block} aria-labelledby="consult-yours">
        <p className={o.eyebrow}>Whatever happens</p>
        <h2 id="consult-yours">What stays yours</h2>
        <div className={o.terms}>{consultYours.map((item) => <div key={item.name}><h3>{item.name}</h3><p>{item.body}</p></div>)}</div>
      </section>

      <section className={o.block} aria-labelledby="consult-price">
        <p className={o.eyebrow}>In plain words</p>
        <h2 id="consult-price">Why there is no price here</h2>
        <p>{t(consultNoPrice)}</p>
        <div className={o.terms}>
          <div><h3>What KRIV does not promise</h3><p>{consultNoPromise}</p></div>
          <div><h3>About the concept website</h3><p>{t(consultSite)}</p></div>
        </div>
      </section>

      <section className={o.block} aria-labelledby="consult-next">
        <p className={o.eyebrow}>Next step</p>
        <h2 id="consult-next">Start with a conversation.</h2>
        <p>To ask a question or request a Systems Diagnostic, reply to Kriv directly or write to {KRIV_EMAIL}. This page has no form and collects no information.</p>
        <p><a className={o.button} {...inert}>Request a Systems Diagnostic <span aria-hidden="true">+</span></a></p>
        <p className={o.small}>The button is disabled in this concept preview.</p>
      </section>
    </main>
    <footer className={o.foot}>
      <p>Prepared by KRIV for {name}. Reference {offer.quoteNumber}, open until {longDate(offer.validUntil)}.</p>
      <p>{conceptNotice(name)}</p>
    </footer>
  </div>;
}
