import Link from "next/link";
import type { SiteData } from "@/lib/site-schema";
import { guideFor, pageHref, sitePages } from "@/lib/site-pages";
import { Photo } from "./Photo";
import { Rich } from "./Rich";
import { GalleryViewer } from "./GalleryViewer";
import { inert } from "./inert";
import c from "./collection.module.css";

export type ContentProps = { site: SiteData };
export const ordinal = (index: number) => String(index + 1).padStart(2, "0");

export function CollectionNavigation({ site, path = "" }: ContentProps & { path?: string }) {
  const pages = sitePages(site).filter((page) => page.kind !== "service");
  const links = pages.map((page) => <Link key={page.path} href={pageHref(site, page.path)} prefetch={false}
    aria-current={path === page.path || (page.kind === "services" && path.startsWith("services/")) ? "page" : undefined}>{page.title}</Link>);
  return <header className={c.navigation}>
    <Link className={c.identity} href={pageHref(site)} prefetch={false}>
      {site.brand.logo ? <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={site.brand.logo} alt="" />
      </> : null}<span>{site.business.name}</span>
    </Link>
    <nav className={c.desktopNav} aria-label="Main navigation">{links}</nav>
    <details key={path} className={c.menu}><summary>Menu <span aria-hidden="true">＋</span></summary>
      <nav aria-label="Mobile navigation">{links}</nav>
    </details>
    <span className={c.navLocation}>{site.business.address.city}</span>
  </header>;
}

export function Eyebrow({ site }: ContentProps) {
  const text = site.hero.eyebrow || site.business.category;
  return text ? <p className={c.eyebrow}>{text}</p> : null;
}
export function Headline({ site }: ContentProps) {
  return <h1><Rich text={site.hero.headline} /></h1>;
}
export function Actions({ site }: ContentProps) {
  return <div className={c.actions}>
    {site.services?.items.length ? <Link href="#services" prefetch={false}>Explore {guideFor(site).label.toLowerCase()} <span aria-hidden="true">↘</span></Link> : null}
    <Link href={pageHref(site, "contact")} prefetch={false}>Contact details <span aria-hidden="true">↗</span></Link>
  </div>;
}
export function Introduction({ site }: ContentProps) {
  return <div className={c.introduction}>{site.hero.sub ? <p>{site.hero.sub}</p> : null}<Actions site={site} /></div>;
}
export function Scene({ site, caption = false }: ContentProps & { caption?: boolean }) {
  const photo = site.brand.photos[0];
  const label = site.gallery?.labels[0] ?? "Illustrative photography";
  return <figure className={c.scene}>
    {photo ? <Photo priority src={photo} label={label} sizes="(max-width:720px) 94vw, 65vw" className={c.scenePhoto} /> : <div className={c.emptyScene} aria-hidden="true" />}
    {caption && photo ? <figcaption>{label}</figcaption> : null}
  </figure>;
}
export function Location({ site }: ContentProps) {
  return site.business.address.city ? <p className={c.location}>{site.business.address.city}</p> : null;
}

/** A real content index. It never suggests unsupplied services or an invented process. */
export function OfferingIndex({ site, limit = 4 }: ContentProps & { limit?: number }) {
  const items = site.services?.items.slice(0, limit) ?? [];
  if (!items.length) return null;
  return <nav className={c.offeringIndex} aria-label="Explore offerings">
    <p className={c.eyebrow}>Explore {guideFor(site).label.toLowerCase()}</p>
    {items.map((item, index) => <Link key={index} href={`#offering-${index}`} prefetch={false}>
      <span>{ordinal(index)}</span><span>{item.name}</span><span aria-hidden="true">↓</span>
    </Link>)}
  </nav>;
}

export type OfferingStyle = "panels" | "matrix" | "curtains" | "classifieds" | "folds" | "menuCards" | "bands" | "specimens" | "lookbook" | "pools" | "vaults" | "schematic" | "orbits" | "rungs" | "casefiles" | "horizons" | "islands" | "paths" | "console" | "chapters" | "axisRows" | "ripples" | "tickets";
export function Offerings({ site, treatment }: ContentProps & { treatment: OfferingStyle }) {
  if (!site.services?.items.length) return null;
  const pages = sitePages(site).filter((page) => page.kind === "service");
  return <section id="services" className={`${c.offerings} ${c[treatment]}`} data-offering-layout={treatment}>
    <div className={c.sectionTitle}><p className={c.eyebrow}>Explore the possibilities</p><h2><Rich text={site.services.title} /></h2>
      {site.services.intro ? <p>{site.services.intro}</p> : null}
    </div>
    <div className={c.offeringList}>{site.services.items.map((item, index) => <details id={`offering-${index}`} key={index} className={c.offering} data-interaction="offering-detail">
      <summary><span className={c.number}>{ordinal(index)}</span><h3>{item.name}</h3><span className={c.toggle} aria-hidden="true">＋</span></summary>
      <div className={c.offeringBody}><p>{item.detail?.startsWith(item.blurb) ? item.detail : item.blurb}</p>
        {item.detail && !item.detail.startsWith(item.blurb) ? <p>{item.detail}</p> : null}
        {item.includes?.length ? <ul>{item.includes.map((line, i) => <li key={i}>{line}</li>)}</ul> : null}
        {pages[index] ? <Link href={pageHref(site, pages[index].path)} prefetch={false}>Explore {item.name.toLowerCase()} <span aria-hidden="true">↗</span></Link> : null}
      </div>
    </details>)}</div>
  </section>;
}

export function Story({ site, treatment = "essay" }: ContentProps & { treatment?: "essay" | "spread" | "letter" | "aside" | "manifesto" }) {
  if (!site.about) return null;
  return <section id="about" className={`${c.story} ${c[treatment]}`}>
    <div className={c.storyTitle}><p className={c.eyebrow}>A closer introduction</p><h2><Rich text={site.about.title ?? `About ${site.business.name}`} /></h2></div>
    <div className={c.storyCopy}><p>{site.about.body}</p>
      {site.about.sections?.map((chapter, index) => <details key={index}><summary>{chapter.title}<span aria-hidden="true">＋</span></summary><p>{chapter.body}</p></details>)}
      <Link href={pageHref(site, "about")} prefetch={false}>More about {site.business.name} <span aria-hidden="true">↗</span></Link>
    </div>
  </section>;
}

export function Notes({ site }: ContentProps) {
  if (!site.custom) return null;
  return <section id="custom" className={c.notes}>
    <h2><Rich text={site.custom.title} /></h2>{site.custom.body ? <p>{site.custom.body}</p> : null}
    {site.custom.items.length ? <div className={c.noteList}>{site.custom.items.map((item, index) => item.blurb ? <details key={index}>
      <summary><span>{ordinal(index)}</span>{item.name}<span aria-hidden="true">＋</span></summary><p>{item.blurb}</p>
    </details> : <p key={index}>{item.name}</p>)}</div> : null}
  </section>;
}

export function CollectionGallery({ site }: ContentProps) {
  const photos = site.brand.photos.map((src, index) => ({ src, label: site.gallery?.labels[index] ?? "Illustrative photography" }));
  // One strong scene is enough. Do not manufacture a gallery by repeating it.
  if (new Set(photos.map((photo) => photo.src)).size < 2) return null;
  return <section id="gallery" className={c.gallery}><p className={c.eyebrow}>In pictures</p><h2><Rich text={site.gallery?.title ?? "A closer look."} /></h2>
    <GalleryViewer businessName={site.business.name} photos={photos} layout="editorial" />
  </section>;
}

export function Questions({ site }: ContentProps) {
  if (!site.faqs.length) return null;
  return <section id="faq" className={c.questions}><div><p className={c.eyebrow}>Before you decide</p><h2>Your questions.</h2></div>
    <div>{site.faqs.map((item, index) => <details key={index}><summary>{item.q}<span aria-hidden="true">＋</span></summary><p>{item.a}</p></details>)}</div>
  </section>;
}

export function Contact({ site, treatment = "folio" }: ContentProps & { treatment?: "folio" | "stamp" | "letterClose" | "billboard" | "ribbonClose" }) {
  const business = site.business;
  const address = [business.address.line1, business.address.city, business.address.region, business.address.postalCode].filter(Boolean).join(", ");
  return <section id="visit" className={`${c.contact} ${c[treatment]}`}>
    <div className={c.contactTitle}><p className={c.eyebrow}>Continue the conversation</p><h2><Rich text={site.close?.headline ?? "Start with a conversation."} /></h2>
      {site.close?.sub ? <p>{site.close.sub}</p> : null}<Link href={pageHref(site, "contact")} prefetch={false}>All contact information <span aria-hidden="true">↗</span></Link>
    </div>
    <div className={c.contactFacts}>
      {address ? <div><h3>Find them</h3><p>{address}</p></div> : null}
      {business.phoneDisplay || business.email ? <div><h3>Get in touch</h3>{business.phoneDisplay ? <p><a {...inert}>{business.phoneDisplay}</a></p> : null}{business.email ? <p><a {...inert}>{business.email}</a></p> : null}</div> : null}
      {business.hours.length ? <div><h3>Published hours</h3><dl>{business.hours.map((hour, index) => <div key={index}><dt>{hour.days}</dt><dd>{hour.time}</dd></div>)}</dl></div> : null}
      <p className={c.previewNote}>Concept preview. Calls, booking and outbound business actions are disabled. No information is collected.</p>
    </div>
  </section>;
}
