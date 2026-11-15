import Link from "next/link";
import type { SiteData } from "@/lib/site-schema";
import { pageHref, type SitePage } from "@/lib/site-pages";
import { AboutBlock, BookBlock, BookButton, FaqBlock, JourneyFrame, PageLinks, ServicesBlock, VisitBlock } from "./JourneyBlocks";
import o from "./offer.module.css";

// The inner pages of a story site (services, one service, about, questions,
// contact), in the same look and with the same concept logo as its home page.
// Preview-only. Placeholders stay placeholders; nothing is claimed for the clinic.

export function JourneyInnerPage({ site, page }: { site: SiteData; page: SitePage }) {
  const { business } = site;
  const item = page.kind === "service" && page.serviceIndex !== undefined ? site.services?.items[page.serviceIndex] : undefined;
  return <JourneyFrame site={site} nav={<PageLinks site={site} current={page.path} />}>
    <div className={o.main}>
      <section className={o.intro}>
        <p className={o.eyebrow}>{business.name}</p>
        <h1>{item ? item.name : page.title}</h1>
        {item ? <>
          {item.blurb ? <p className={o.lead}>{item.blurb}</p> : null}
          {item.detail ? <p>{item.detail}</p> : null}
          {item.includes?.length ? <ul className={o.ticks}>{item.includes.map((line) => <li key={line}>{line}</li>)}</ul> : null}
          <p className={o.actions}><BookButton site={site} /><Link href={pageHref(site, "services")} prefetch={false}>All services</Link></p>
        </> : null}
      </section>
      {page.kind === "services" ? <><ServicesBlock site={site} linked /><BookBlock site={site} /></> : null}
      {page.kind === "about" ? <><AboutBlock site={site} /><VisitBlock site={site} /></> : null}
      {page.kind === "faq" ? <><FaqBlock site={site} /><VisitBlock site={site} /></> : null}
      {page.kind === "contact" ? <><VisitBlock site={site} /><BookBlock site={site} /></> : null}
      {page.kind === "service" ? <VisitBlock site={site} /> : null}
    </div>
  </JourneyFrame>;
}
