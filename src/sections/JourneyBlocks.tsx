import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteData } from "@/lib/site-schema";
import { pageHref, sitePages } from "@/lib/site-pages";
import { addressText, phoneText } from "@/lib/us-format";
import { journeyStyle, lookAttributes, themeVars } from "@/stories/journey-style";
import { Ribbon, conceptNotice } from "./Chrome";
import { inert } from "./inert";
import { JourneyLogo, logoWords } from "./JourneyLogo";
import { DvLogo, dvLogoStyle } from "./DvLogo";
import s from "./sections.module.css";
import o from "./offer.module.css";
import j from "./journey.module.css";

// The parts every page of a story site shares (preview-only): the frame in the
// site's own look with the concept logo, and the clinic's details as blocks.
// The home page (JourneySite) puts them under the story; the inner pages
// (JourneyInnerPage) show them one page at a time. Same guardrails throughout.

type Props = { site: SiteData };

/** *word* in a lead's titles marks the phrase the heading sets in grey. */
export function mark(text: string): ReactNode {
  return text.split("*").map((part, n) => (n % 2 ? <em key={n}>{part}</em> : part));
}

export function BookButton({ site }: Props) {
  const cta = site.hero.primary;
  return cta ? <a className={o.button} {...inert}>{cta.label} <span aria-hidden="true">+</span></a> : null;
}

/** Banner, header with the concept logo, the page, and a footer that carries the badge. */
export function JourneyFrame({ site, nav, children }: Props & { nav: ReactNode; children: ReactNode }) {
  const { business } = site;
  const { letters, ring } = logoWords(site);
  const look = journeyStyle(site);
  const sneaker = site.story === "sneaker-journey";
  const mark = sneaker ? <DvLogo style={dvLogoStyle(look.seed)} compact /> : <JourneyLogo letters={letters} compact />;
  return <div className={`${s.site} ${o.root} ${j.root}`} lang={site.lang} style={themeVars(look.theme)} {...lookAttributes(look)}>
    <link rel="stylesheet" href={look.theme.googleCss} precedence="fonts" />
    <Ribbon site={site} />
    <a className={s.skipLink} href="#main-content">Skip to content</a>
    <header className={`${o.top} ${j.top}`}>
      <Link href={pageHref(site)} prefetch={false} className={j.name}>{mark}{business.name}</Link>
      <nav aria-label="Main navigation" className={j.nav}>{nav}</nav>
    </header>
    <main id="main-content">{children}</main>
    <footer className={`${o.foot} ${j.foot}`}>
      {sneaker ? <DvLogo style={dvLogoStyle(look.seed)} /> : <JourneyLogo letters={letters} ring={ring} />}
      <div>
        <p>{business.name}</p>
        <p>{conceptNotice(business.name)}</p>
        <p>{sneaker
          ? "The logo is a concept revamp by KRIV for the DV Shop team to approve. Facts, photos, products and prices come from DV Shop Cebu's own public pages."
          : "The logo is a concept redraw by KRIV for the clinic to approve. The story of the tooth uses general dental knowledge. It is not medical advice and makes no claims about the clinic."}</p>
      </div>
    </footer>
  </div>;
}

/** Links to the site's own pages, for the inner pages' header. */
export function PageLinks({ site, current }: Props & { current?: string }) {
  return <>
    {sitePages(site).filter((p) => p.kind !== "service").map((p) => <Link key={p.path} href={pageHref(site, p.path)} prefetch={false} aria-current={current === p.path || (p.kind === "services" && current?.startsWith("services/")) ? "page" : undefined}>{p.kind === "home" ? "The story" : p.title}</Link>)}
    <Link href={pageHref(site, "brand-kit")} prefetch={false} aria-current={current === "brand-kit" ? "page" : undefined}>Brand kit</Link>
  </>;
}

export function ServicesBlock({ site, linked = false }: Props & { linked?: boolean }) {
  if (!site.services) return null;
  const pages = sitePages(site).filter((p) => p.kind === "service");
  return <section className={o.block} aria-labelledby="services">
    <p className={o.eyebrow}>Services</p>
    <h2 id="services">{mark(site.services.title ?? "Our *services*")}</h2>
    {site.services.intro ? <p>{site.services.intro}</p> : null}
    <ul className={o.cards}>
      {site.services.items.map((item, n) => <li key={item.name}>
        <h3>{linked && pages[n] ? <Link href={pageHref(site, pages[n].path)} prefetch={false}>{item.name}</Link> : item.name}</h3>
        {item.blurb ? <p>{item.blurb}</p> : null}
      </li>)}
    </ul>
  </section>;
}

export function AboutBlock({ site }: Props) {
  if (!site.about) return null;
  return <section className={o.block} aria-labelledby="about">
    <p className={o.eyebrow}>About</p>
    <h2 id="about">{mark(site.about.title ?? `About *${site.business.name}*`)}</h2>
    <p>{site.about.body}</p>
    {site.about.sections?.length ? <ul className={o.cards}>
      {site.about.sections.map((part) => <li key={part.title}><h3>{part.title}</h3><p>{part.body}</p></li>)}
    </ul> : null}
  </section>;
}

export function BookBlock({ site }: Props) {
  if (!site.custom) return null;
  return <section className={o.block} aria-labelledby="book">
    <p className={o.eyebrow}>Booking</p>
    <h2 id="book">{mark(site.custom.title)}</h2>
    {site.custom.body ? <p>{site.custom.body}</p> : null}
    <ol className={`${o.cards} ${j.numbered}`}>
      {site.custom.items.map((item) => <li key={item.name}><h3>{item.name}</h3>{item.blurb ? <p>{item.blurb}</p> : null}</li>)}
    </ol>
  </section>;
}

export function VisitBlock({ site }: Props) {
  const { business } = site;
  return <section className={o.block} aria-labelledby="visit">
    <p className={o.eyebrow}>Visit</p>
    <h2 id="visit">{mark(site.close?.headline ?? "Plan your *visit*")}</h2>
    {site.close?.sub ? <p>{site.close.sub}</p> : null}
    <dl className={o.meta}>
      <div><dt>Address</dt><dd>{addressText(business.address)}</dd></div>
      <div><dt>Phone</dt><dd>{phoneText(business)}</dd></div>
      {business.email ? <div><dt>Email</dt><dd>{business.email}</dd></div> : null}
      {business.socials.facebook ? <div><dt>Facebook</dt><dd><a {...inert}>The clinic&apos;s Facebook page</a></dd></div> : null}
      {business.hours.map((h) => <div key={h.days}><dt>{h.days}</dt><dd>{h.time}</dd></div>)}
    </dl>
    <p className={o.actions}><BookButton site={site} /></p>
  </section>;
}

export function FaqBlock({ site }: Props) {
  if (!site.faqs?.length) return null;
  return <section className={o.block} aria-labelledby="faq">
    <p className={o.eyebrow}>Questions</p>
    <h2 id="faq">Good to <em>know</em></h2>
    <div className={j.faq}>
      {site.faqs.map((f) => <details key={f.q}><summary>{f.q}<span aria-hidden="true">+</span></summary><p>{f.a}</p></details>)}
    </div>
  </section>;
}
