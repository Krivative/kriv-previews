import Link from "next/link";
import type { SiteData } from "@/lib/site-schema";
import type { TemplateDef } from "@/lib/templates";
import { guideFor, pageHref, sitePages, type SitePage } from "@/lib/site-pages";
import { Ribbon, Footer } from "./Chrome";
import { PageContent } from "./Pages";
import { Photo, photoSources } from "./Photo";
import { Rich } from "./Rich";
import { ServiceDetails } from "./SignatureSections";
import { inert } from "./inert";
import s from "./sections.module.css";
import { addressText, phoneText } from "@/lib/us-format";
import c from "./compositions.module.css";

type Props = { site: SiteData };
const number = (n: number) => String(n + 1).padStart(2, "0");

function Navigation({ site, path = "" }: Props & { path?: string }) {
  const pages = sitePages(site).filter((p) => p.kind !== "service");
  const links = pages.map((p) => <Link key={p.path} href={pageHref(site, p.path)} prefetch={false} aria-current={path === p.path || (p.kind === "services" && path.startsWith("services/")) ? "page" : undefined}>{p.title}</Link>);
  return <header className={c.navigation}>
    <Link className={c.wordmark} href={pageHref(site)} prefetch={false}>{site.brand.logo ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={site.brand.logo} alt="" />
    </> : null}{site.business.name}</Link>
    <nav className={c.desktopNav} aria-label="Main navigation">{links}</nav>
    <details key={path} className={c.menu}><summary>Menu <span aria-hidden="true">＋</span></summary><nav aria-label="Mobile navigation">{links}</nav></details>
    <p className={c.navFoot}>{[site.business.category, site.business.address.city].filter(Boolean).join(" · ")}</p>
  </header>;
}

function Explore({ site }: Props) {
  return <div className={c.actions}>{site.services?.items.length ? <Link href="#services" prefetch={false}>Explore {guideFor(site).label.toLowerCase()} <span aria-hidden="true">↓</span></Link> : null}<Link href={pageHref(site, "contact")} prefetch={false}>Contact details <span aria-hidden="true">↗</span></Link></div>;
}

function Facts({ site }: Props) {
  const b = site.business;
  const address = addressText(b.address);
  return <div className={c.facts}>
    {address ? <div><p className={c.label}>Location</p><p>{address}</p></div> : null}
    {phoneText(b) || b.email ? <div><p className={c.label}>Get in touch</p>{phoneText(b) ? <p><a {...inert}>{phoneText(b)}</a></p> : null}{b.email ? <p><a {...inert}>{b.email}</a></p> : null}</div> : null}
    {b.hours.length ? <div><p className={c.label}>Published hours</p><dl>{b.hours.map((h) => <div key={h.days}><dt>{h.days}</dt><dd>{h.time}</dd></div>)}</dl></div> : null}
    <p className={c.previewNote}>Concept preview. Calls, booking and outbound business actions are disabled. No information is collected.</p>
  </div>;
}

function Questions({ site }: Props) {
  if (!site.faqs.length) return null;
  return <section id="faq" className={c.questions}><div><p className={c.label}>Good to know</p><h2>Questions, considered.</h2></div><div>{site.faqs.map((f) => <details key={f.q}><summary>{f.q}<span aria-hidden="true">＋</span></summary><p>{f.a}</p></details>)}</div></section>;
}

function CustomNote({ site }: Props) {
  if (!site.custom) return null;
  return <aside id="custom" className={c.customNote}><h3><Rich text={site.custom.title} /></h3>{site.custom.body ? <p>{site.custom.body}</p> : null}{site.custom.items.map((item) => <p key={item.name}><strong>{item.name}</strong>{item.blurb ? ` — ${item.blurb}` : ""}</p>)}</aside>;
}

function Contact({ site }: Props) {
  return <section id="visit" className={c.contact}><div><p className={c.label}>The next conversation</p><h2><Rich text={site.close?.headline ?? "Let’s start with the details."} /></h2>{site.close?.sub ? <p>{site.close.sub}</p> : null}<Link className={c.contactLink} href={pageHref(site, "contact")} prefetch={false}>All contact information <span aria-hidden="true">↗</span></Link></div><Facts site={site} /></section>;
}

function OfferingCopy({ site, index }: Props & { index: number }) {
  const item = site.services!.items[index];
  const page = sitePages(site).find((p) => p.kind === "service" && p.serviceIndex === index);
  return <div className={c.offeringCopy}><p>{item.detail ?? item.blurb}</p>{item.includes?.length ? <ul>{item.includes.map((line) => <li key={line}>{line}</li>)}</ul> : null}{page ? <Link href={pageHref(site, page.path)} prefetch={false}>Explore {item.name.toLowerCase()} <span aria-hidden="true">↗</span></Link> : null}</div>;
}

function CanvasHome({ site }: Props) {
  return <>
    <section id="top" className={c.canvasHero}><div className={c.heroCopy}><p className={c.label}>{site.hero.eyebrow ?? site.business.category}</p><h1><Rich text={site.hero.headline} /></h1><p className={c.intro}>{site.hero.sub}</p><Explore site={site} /></div>{site.brand.photos[0] ? <p className={c.sceneCaption}>{site.gallery?.labels[0] ?? "An illustrative image study"}</p> : null}<div className={c.canvasFoot}>{site.business.address.city ? <span>{site.business.address.city}</span> : null}{site.business.category ? <span>{site.business.category}</span> : null}</div></section>
    {site.about ? <section id="about" className={c.canvasEssay}><p className={c.label}>A closer introduction</p><h2><Rich text={site.about.title ?? `About ${site.business.name}`} /></h2><p>{site.about.body}</p><Link href={pageHref(site, "about")} prefetch={false}>Read the story <span aria-hidden="true">↗</span></Link></section> : null}
    {site.services?.items.length ? <section id="services" className={c.canvasOfferings}><div className={c.sectionHeading}><p className={c.label}>Explore at your own pace</p><h2><Rich text={site.services.title} /></h2>{site.services.intro ? <p>{site.services.intro}</p> : null}</div><div>{site.services.items.map((item, i) => <details key={item.name} name={`${site.slug}-canvas-options`} open={i === 0}><summary><span className={c.itemNumber}>{number(i)}</span><h3>{item.name}</h3><span className={c.plus} aria-hidden="true">＋</span></summary><OfferingCopy site={site} index={i} /></details>)}</div></section> : null}
    <div className={c.canvasLower}><CustomNote site={site} /><Questions site={site} /><Contact site={site} /></div>
  </>;
}

function IndexHome({ site }: Props) {
  const services = sitePages(site).filter((p) => p.kind === "service");
  return <>
    <section id="top" className={c.indexHero}><p className={c.label}>{site.hero.eyebrow ?? site.business.category}</p><h1><Rich text={site.hero.headline} /></h1><div className={c.indexOpening}><div><p className={c.intro}>{site.hero.sub}</p><Explore site={site} /></div>{site.brand.photos[0] ? <figure><Photo priority sizes="(max-width:720px) 60vw, 25vw" src={site.brand.photos[0]} label={site.gallery?.labels[0] ?? "Illustrative photography"} /><figcaption>01 / {site.business.name}</figcaption></figure> : null}</div></section>
    {site.services?.items.length ? <section id="services" className={c.indexOfferings}><div className={c.indexSectionTitle}><span className={c.label}>01 / Explore</span><h2><Rich text={site.services.title} /></h2></div>{site.services.intro ? <p>{site.services.intro}</p> : null}<ol>{site.services.items.map((item, i) => <li key={item.name}><span className={c.itemNumber}>{number(i)}</span><h3><Link href={pageHref(site, services[i].path)} prefetch={false}>{item.name} <span aria-hidden="true">↗</span></Link></h3><div><p>{item.blurb}</p><ServiceDetails item={item} /></div></li>)}</ol></section> : null}
    {site.about ? <section id="about" className={c.indexEssay}><p className={c.label}>02 / Introduction</p><h2><Rich text={site.about.title ?? `About ${site.business.name}`} /></h2><div><p>{site.about.body}</p>{site.about.sections?.map((chapter) => <article key={chapter.title}><h3>{chapter.title}</h3><p>{chapter.body}</p></article>)}<Link href={pageHref(site, "about")} prefetch={false}>More about {site.business.name} <span aria-hidden="true">↗</span></Link></div></section> : null}
    <CustomNote site={site} /><Questions site={site} /><Contact site={site} />
  </>;
}

function StageHome({ site }: Props) {
  const paths = sitePages(site).filter((p) => p.kind === "service");
  const picks = paths.length ? paths.slice(0, 3) : sitePages(site).filter((p) => p.kind !== "home").slice(0, 3);
  return <>
    <section id="top" className={c.stageHero}><div className={c.stageMasthead}><p className={c.label}>{site.hero.eyebrow ?? site.business.category}<span>{site.business.address.city}</span></p><h1><Rich text={site.hero.headline} /></h1><div><p className={c.intro}>{site.hero.sub}</p><Explore site={site} /></div></div><div className={c.stageWindow}>{site.brand.photos[0] ? <Photo priority sizes="(max-width:720px) 90vw, 85vw" src={site.brand.photos[0]} label={site.gallery?.labels[0] ?? "Illustrative photography"} className={c.stageImage} /> : <div className={c.stageBlank} aria-hidden="true" />}<div className={c.stageWindowEdge}><span>01 / Overview</span><span>{site.business.name}</span></div><nav className={c.stageContents} aria-label="Explore this concept"><p className={c.label}>Take a closer look</p>{picks.map((p, i) => <Link key={p.path} href={pageHref(site, p.path)} prefetch={false}><span>{number(i)}</span>{p.title}<span aria-hidden="true">↗</span></Link>)}</nav></div></section>
    <CustomNote site={site} />
    {site.services?.items.length ? <section id="services" className={c.stageOfferings}><div className={c.indexSectionTitle}><span className={c.label}>02 / The options</span><h2><Rich text={site.services.title} /></h2></div>{site.services.intro ? <p>{site.services.intro}</p> : null}{site.services.items.map((item, i) => <details key={item.name}><summary><span className={c.itemNumber}>{number(i)}</span><h3>{item.name}</h3><span className={c.plus} aria-hidden="true">＋</span></summary><OfferingCopy site={site} index={i} /></details>)}</section> : null}
    {site.about ? <section id="about" className={c.stageStory}><p className={c.label}>03 / An introduction</p><h2><Rich text={site.about.title ?? `About ${site.business.name}`} /></h2><div><p>{site.about.body}</p><Link href={pageHref(site, "about")} prefetch={false}>Read more <span aria-hidden="true">↗</span></Link></div></section> : null}
    <Questions site={site} /><Contact site={site} />
  </>;
}

export function ComposedSite({ site, template, page }: Props & { template: TemplateDef; page?: SitePage }) {
  const composition = template.composition!;
  const home = !page || page.kind === "home";
  return <div className={`${c.root} ${c[composition]}`} data-composition={composition} data-has-scene={!!site.brand.photos[0]}>
    {composition === "canvas" && site.brand.photos[0] ? <div className={c.scene} aria-hidden="true">
      {/* One credited source image supplies the visual canvas. No video or scroll handler. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={site.brand.photos[0]} srcSet={photoSources(site.brand.photos[0])} sizes="100vw" alt="" loading="eager" fetchPriority="high" decoding="async" />
    </div> : null}
    <Ribbon site={site} />
    <a className={s.skipLink} href="#main-content">Skip to content</a>
    <div className={c.shell}><Navigation site={site} path={page?.path} /><main id="main-content" className={c.main}>
      {!home ? <div className={c.detailSurface}><PageContent site={site} page={page!} bold={template.look === "bold"} /></div> : composition === "canvas" ? <CanvasHome site={site} /> : composition === "index" ? <IndexHome site={site} /> : <StageHome site={site} />}
    </main></div>
    <div className={c.footerSurface}><Footer site={site} /></div>
  </div>;
}
