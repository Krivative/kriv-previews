import Link from "next/link";
import type { SiteData } from "@/lib/site-schema";
import { pageHref, sitePages } from "@/lib/site-pages";
import { Photo } from "./Photo";
import { Rich } from "./Rich";
import { GalleryViewer } from "./GalleryViewer";
import s from "./sections.module.css";
import m from "./signature.module.css";

// Native disclosure controls keep these two signatures usable without JavaScript.
export function ServiceExplorer({ site }: { site: SiteData }) {
  const services = site.services;
  if (!services?.items.length) return null;
  const pages = sitePages(site).filter((p) => p.kind === "service");
  return <section id="services" className={`${s.section} ${m.root}`} data-signature="service-explorer">
    <div className={s.wrap}>
      <div className={m.sectionIntro}><div><p className={s.eyebrow}>Explore the options</p><h2 className={s.h2}><Rich text={services.title} /></h2></div><p>{services.intro ?? "Take a closer look at the service you have in mind."}</p></div>
      <div className={m.serviceLayout}>
        <div className={m.serviceList}>{services.items.map((item, i) => <details className={m.serviceItem} name={`${site.slug}-services`} open={i === 0} key={item.name}>
          <summary><span className={m.index}>{String(i + 1).padStart(2, "0")}</span><span>{item.name}</span><span className={m.expand} aria-hidden="true">＋</span></summary>
          <div className={m.serviceCopy}><p>{item.detail ?? item.blurb}</p>{item.includes?.length ? <ul>{item.includes.map((line) => <li key={line}>{line}</li>)}</ul> : null}{pages[i] ? <Link href={pageHref(site, pages[i].path)} prefetch={false}>Explore {item.name.toLowerCase()} <span aria-hidden="true">↗</span></Link> : null}</div>
        </details>)}</div>
        {site.brand.photos[0] ? <figure className={m.serviceVisual}><Photo src={site.brand.photos[0]} label="Illustrative service photography" className={m.servicePhoto} /><div className={m.sceneIndex} aria-hidden="true">{services.items.map((_, i) => <span key={i}>{String(i + 1).padStart(2, "0")}</span>)}</div><figcaption>Explore one service at a time.</figcaption></figure> : null}
      </div>
    </div>
  </section>;
}

export function VisitJourney({ site }: { site: SiteData }) {
  const journey = site.custom;
  if (!journey) return null;
  if (!journey.items.length) return <section id="custom" className={`${s.section} ${m.root} ${m.journey}`}><div className={s.wrap}><h2 className={s.h2}><Rich text={journey.title} /></h2>{journey.body ? <p>{journey.body}</p> : null}</div></section>;
  return <section id="custom" className={`${s.section} ${m.root} ${m.journey}`} data-signature="visit-journey"><div className={`${s.wrap} ${m.journeyLayout}`}>
    <div className={m.journeyIntro}><p className={s.eyebrow}>A clear starting point</p><h2 className={s.h2}><Rich text={journey.title} /></h2>{journey.body ? <p>{journey.body}</p> : null}<p className={m.guidance}>Explore each part at your own pace.</p><span className={m.journeyCount} aria-hidden="true">{String(journey.items.length).padStart(2, "0")}<small>parts of the journey</small></span></div>
    <div className={m.journeySteps}>{journey.items.map((item, i) => item.blurb ? <details className={m.journeyStep} name={`${site.slug}-visit`} open={i === 0} key={item.name}><summary><span className={m.stepNumber}>{String(i + 1).padStart(2, "0")}</span><span>{item.name}</span><span className={m.expand} aria-hidden="true">＋</span></summary><div className={m.journeyCopy}><p>{item.blurb}</p><span className={m.stepCaption}>Part {i + 1} of {journey.items.length}</span></div></details> : <div className={m.journeyStep} key={item.name}><div className={m.staticStep}><span className={m.stepNumber}>{String(i + 1).padStart(2, "0")}</span><span>{item.name}</span></div></div>)}</div>
  </div></section>;
}

export function EditorialGallery({ site }: { site: SiteData }) {
  if (!site.gallery || !site.brand.photos.length) return null;
  const photos = site.brand.photos.length > 1 ? site.brand.photos.slice(1) : site.brand.photos;
  return <section id="gallery" className={`${s.section} ${m.root} ${m.editorial}`} data-signature="editorial-gallery"><div className={s.wrap}>
    <div className={m.editorialHeading}><p className={s.eyebrow}>The finer details</p><h2 className={s.h2}><Rich text={site.gallery.title ?? "A closer look"} /></h2><p>Pause on the details. Open an image to explore.</p></div>
    <GalleryViewer businessName={site.business.name} photos={photos.map((src, i) => ({ src, label: site.gallery!.labels[i] ?? `Image ${String(i + 1).padStart(2, "0")}` }))} />
  </div></section>;
}
