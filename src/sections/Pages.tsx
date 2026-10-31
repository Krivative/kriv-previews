import Link from "next/link";
import type { SiteData } from "@/lib/site-schema";
import { guideFor, pageHref, sitePages, type SitePage } from "@/lib/site-pages";
import { Custom, Faq, Gallery, Services } from "./Sections";
import { Photo } from "./Photo";
import { Rich } from "./Rich";
import { inert } from "./inert";
import { addressText, phoneText } from "@/lib/us-format";
import s from "./sections.module.css";

type Props = { site: SiteData };

export function Orientation({ site }: Props) {
  const b = site.business;
  return <div className={s.orientation}><div className={s.wrap}>
    <span>{b.category || b.name}</span>
    {b.address.city ? <span>{b.address.city}</span> : null}
    {b.hours[0] ? <span>{b.hours[0].days} · {b.hours[0].time}</span> : null}
    <Link href={pageHref(site, "contact")} prefetch={false}>Contact & details <span aria-hidden="true">↗</span></Link>
  </div></div>;
}

export function Planning({ site }: Props) {
  const guide = guideFor(site);
  return <section className={`${s.section} ${s.planning}`}><div className={`${s.wrap} ${s.planningGrid}`}>
    <div><p className={s.eyebrow}>Before you decide</p><h2 className={s.h2}>{guide.heading}</h2><p>{guide.prepare}</p><Link className={s.textLink} href={pageHref(site, "contact")} prefetch={false}>Find contact information <span aria-hidden="true">↗</span></Link></div>
    <ol className={s.questionList}>{guide.questions.map((q, i) => <li key={q}><span aria-hidden="true">0{i + 1}</span><h3>{q}</h3></li>)}</ol>
  </div></section>;
}

export function PageDirectory({ site }: Props) {
  const pages = sitePages(site).filter((p) => ["services", "about", "contact"].includes(p.kind));
  const descriptions: Record<string, string> = { services: "Take a closer look at the options and details.", about: `Get to know ${site.business.name}.`, contact: "Find contact details, location and published hours." };
  return <section className={`${s.section} ${s.pageAlt}`}><div className={s.wrap}>
    <div className={s.sectionHead}><h2 className={s.h2}>A little more to explore.</h2><p>Find the details that matter to you.</p></div>
    <div className={s.directory}>{pages.map((p, i) => <Link key={p.path} href={pageHref(site, p.path)} prefetch={false}><span className={s.eyebrow}>0{i + 1}</span><h3>{p.title}</h3><p>{descriptions[p.kind]}</p><span className={s.textLink}>Explore <span aria-hidden="true">↗</span></span></Link>)}</div>
  </div></section>;
}

export function ContactDetails({ site }: Props) {
  const b = site.business;
  const address = addressText(b.address);
  return <section id="visit" className={`${s.section} ${s.pageAlt}`}><div className={`${s.wrap} ${s.contactGrid}`}>
    <div><p className={s.eyebrow}>Get in touch</p><h2 className={s.h2}>Let’s start with the details.</h2><p>{guideFor(site).prepare}</p><p className={s.previewNote}>Concept preview only. Calls, messages and booking actions are disabled. No information is collected.</p></div>
    <div className={s.contactPanel}><dl>
      {phoneText(b) ? <div><dt>Phone</dt><dd><a {...inert}>{phoneText(b)}</a></dd></div> : null}
      {b.email ? <div><dt>Email</dt><dd><a {...inert}>{b.email}</a></dd></div> : null}
      {address ? <div><dt>Location</dt><dd>{address}</dd></div> : null}
      {b.hours.length ? <div><dt>Opening hours</dt><dd>{b.hours.map((h) => <span className={s.hoursLine} key={`${h.days}-${h.time}`}><span>{h.days}</span><span>{h.time}</span></span>)}</dd></div> : null}
    </dl>{!phoneText(b) && !b.email ? <p>Contact information has not been supplied for this concept.</p> : null}</div>
  </div></section>;
}

export function PageContent({ site, page, bold }: Props & { page: SitePage; bold: boolean }) {
  const services = sitePages(site).filter((p) => p.kind === "service");
  const item = page.serviceIndex === undefined ? undefined : site.services?.items[page.serviceIndex];
  const intro = item ? site.services?.intro : (page.kind === "about" ? site.about?.body : page.kind === "services" ? site.services?.intro : undefined);
  return <>
    <section id="top" className={`${s.wrap} ${s.pageHero}`}>
      <nav className={s.breadcrumb} aria-label="Breadcrumb"><Link href={pageHref(site)} prefetch={false}>Home</Link><span aria-hidden="true">/</span>{item ? <><Link href={pageHref(site, "services")} prefetch={false}>{guideFor(site).label}</Link><span aria-hidden="true">/</span></> : null}<span aria-current="page">{page.title}</span></nav>
      <div className={s.pageHeroGrid}><div><p className={s.eyebrow}>{site.business.name}</p><h1 className={s.h1}><Rich text={page.kind === "about" ? site.about?.title ?? `About ${site.business.name}` : page.title} /></h1>{intro ? <p className={s.pageLead}>{intro}</p> : null}</div><Photo src={site.brand.photos[page.kind === "about" ? 1 : 0] ?? site.brand.photos[0]} label={item?.name ?? site.business.category ?? page.title} className={s.pageHeroPhoto} /></div>
    </section>
    {page.kind === "services" ? <Services site={site} variant={bold ? "editorial" : "grid"} /> : null}
    {item ? <section className={`${s.section} ${s.pageAlt}`}><div className={`${s.wrap} ${s.serviceBody}`}><article><p className={s.eyebrow}>A closer look</p><h2 className={s.h2}>{item.name}</h2>{item.detail ? item.detail.split(/\n+/).map((p, i) => <p key={i}>{p}</p>) : <p>{item.blurb}</p>}{item.includes?.length ? <><h3>What’s included</h3><ul className={s.detailList}>{item.includes.map((line) => <li key={line}>{line}</li>)}</ul></> : null}</article><aside className={s.serviceAside}><p className={s.eyebrow}>Your next step</p><h3>Have a question?</h3><p>{guideFor(site).prepare}</p><Link className={s.btnPrimary} href={pageHref(site, "contact")} prefetch={false}>Contact details <span aria-hidden="true">↗</span></Link><Link className={s.textLink} href={pageHref(site, "services")} prefetch={false}>Explore all {guideFor(site).label.toLowerCase()}</Link></aside></div></section> : null}
    {page.kind === "about" ? <>{site.about?.sections?.length ? <section className={`${s.section} ${s.pageAlt}`}><div className={`${s.wrap} ${s.aboutChapters}`}>{site.about.sections.map((chapter, i) => <article key={`${chapter.title}-${i}`}><span className={s.eyebrow}>0{i + 1}</span><h2 className={s.h2}>{chapter.title}</h2><p>{chapter.body}</p></article>)}</div></section> : site.custom ? <Custom site={site} variant="steps" /> : null}</> : null}
    {page.kind === "contact" ? <ContactDetails site={site} /> : null}
    {page.kind === "faq" ? <Faq site={site} variant="list" /> : null}
    {page.kind === "gallery" ? <Gallery site={site} variant="mosaic" /> : null}
    {["service", "services", "contact"].includes(page.kind) ? <Planning site={site} /> : null}
    {item && services.length > 1 ? <ServiceDirectory site={site} pages={services.filter((p) => p.path !== page.path)} /> : null}
    <PageDirectory site={site} />
  </>;
}

function ServiceDirectory({ site, pages }: Props & { pages: SitePage[] }) {
  return <section className={s.section}><div className={s.wrap}><div className={s.sectionHead}><h2 className={s.h2}>Explore {guideFor(site).label.toLowerCase()}.</h2></div><div className={s.serviceDirectory}>{pages.map((p) => <Link key={p.path} href={pageHref(site, p.path)} prefetch={false}><span>{p.title}</span><span aria-hidden="true">↗</span></Link>)}</div></div></section>;
}
