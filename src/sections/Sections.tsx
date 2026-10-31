import { Fragment } from "react";
import Link from "next/link";
import { pageHref, sitePages } from "@/lib/site-pages";
import type { SiteData, SectionRef } from "@/lib/site-schema";
import { Photo } from "./Photo";
import { Rich } from "./Rich";
import { defaultCtas } from "./ctas";
import { inert } from "./inert";
import s from "./sections.module.css";
import { ServiceExplorer, EditorialGallery, VisitJourney, ServiceDetails } from "./SignatureSections";
import { GalleryViewer } from "./GalleryViewer";
import { cityLine, phoneText } from "@/lib/us-format";
import m from "./signature.module.css";

type Props = { site: SiteData };

function Ctas({ site, invert }: Props & { invert?: boolean }) {
  const { primary, secondary } = defaultCtas(site);
  if (!primary) return null;
  return (
    <div className={s.btnRow}>
      <a className={s.btnPrimary} {...inert}>
        {primary.label}
      </a>
      {secondary ? (
        <a className={invert ? s.btnGhostLight : s.btnGhost} {...inert}>
          {secondary.label}
        </a>
      ) : null}
    </div>
  );
}

/* ---------------- Hero ---------------- */

export function Hero({ site, variant }: Props & { variant: Extract<SectionRef, { type: "hero" }>["variant"] }) {
  const h = site.hero;
  const photo = site.brand.photos[0];
  if (variant === "cinematic") {
    // Full-screen photo with a tinted scrim, copy anchored low on the left, scroll cue.
    return (
      <section id="top" className={s.heroCine}>
        <Photo priority src={photo} label="Main photo" className={s.heroCineMedia} />
        <div className={s.heroCineScrim} />
        <div className={`${s.wrap} ${s.heroCineCopy}`}>
          {h.eyebrow ? <p className={s.eyebrow}>{h.eyebrow}</p> : null}
          <h1 className={s.h1}>
            <Rich text={h.headline} />
          </h1>
          <p className={s.lead}>{h.sub}</p>
          <Ctas site={site} invert />
        </div>
        <span className={s.scrollCue} aria-hidden="true" />
      </section>
    );
  }
  if (variant === "poster") {
    return (
      <section id="top" className={`${s.wrap} ${s.heroPoster}`}>
        {h.eyebrow ? <p className={s.eyebrow}>{h.eyebrow}</p> : null}
        <h1 className={s.h1}>
          <Rich text={h.headline} />
        </h1>
        <div className={s.heroPosterRow}>
          <p className={s.lead}>{h.sub}</p>
          <Ctas site={site} />
        </div>
        <Photo priority src={photo} label="Main photo" />
      </section>
    );
  }
  if (variant === "centered") {
    const strip = site.brand.photos.length ? site.brand.photos.slice(0, 3) : [undefined, undefined, undefined];
    return (
      <section id="top" className={s.wrap}>
        <div className={s.heroCentered}>
          {h.eyebrow ? <p className={s.eyebrow}>{h.eyebrow}</p> : null}
          <h1 className={s.h1}>
          <Rich text={h.headline} />
        </h1>
          <p className={s.lead}>{h.sub}</p>
          <Ctas site={site} />
        </div>
        <div className={s.heroStrip}>
          {strip.map((src, i) => (
            <Photo key={i} src={src} label={`Photo ${i + 1}`} priority={i === 0} />
          ))}
        </div>
      </section>
    );
  }
  if (variant === "stacked") {
    return (
      <section id="top" className={`${s.wrap} ${s.heroStacked}`}>
        {h.eyebrow ? <p className={s.eyebrow}>{h.eyebrow}</p> : null}
        <h1 className={s.h1}>
          <Rich text={h.headline} />
        </h1>
        <Photo priority src={photo} label="Main photo" />
        <div className={s.heroStackedRow}>
          <p className={s.lead}>{h.sub}</p>
          <Ctas site={site} />
        </div>
      </section>
    );
  }
  if (variant === "banner") {
    return (
      <section id="top" className={s.heroBanner}>
        <Photo priority src={photo} label="Full-width photo" />
        <div className={s.heroBannerScrim} />
        <div className={s.wrap} style={{ width: "100%" }}>
          <div className={s.heroBannerCopy}>
            {h.eyebrow ? <p className={s.eyebrow}>{h.eyebrow}</p> : null}
            <h1 className={s.h1}>
          <Rich text={h.headline} />
        </h1>
            <p className={s.lead}>{h.sub}</p>
            <Ctas site={site} />
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="top" className={`${s.wrap} ${s.heroSplit}`}>
      <div>
        {h.eyebrow ? <p className={s.eyebrow}>{h.eyebrow}</p> : null}
        <h1 className={s.h1}>
          <Rich text={h.headline} />
        </h1>
        <p className={s.lead}>{h.sub}</p>
        <Ctas site={site} />
      </div>
      <Photo priority src={photo} label="Main photo" />
    </section>
  );
}

/* ---------------- Services ---------------- */

export function Services({ site, variant }: Props & { variant: Extract<SectionRef, { type: "services" }>["variant"] }) {
  if (variant === "explorer") return <ServiceExplorer site={site} />;
  const sv = site.services;
  if (!sv || !sv.items.length) return null;
  const items = sv.items;
  const pages = sitePages(site).filter((p) => p.kind === "service");
  const name = (it: typeof items[number]) => <Link href={pageHref(site, pages[items.indexOf(it)].path)} prefetch={false}>{it.name}<span className={s.serviceArrow} aria-hidden="true"> ↗</span></Link>;
  const body =
    variant === "grid" ? (
      <div className={s.grid}>
        {items.map((it) => (
          <div key={it.name} className={s.cell}>
            <strong>{name(it)}</strong>
            <span>{it.blurb}</span>
            <ServiceDetails item={it} />
          </div>
        ))}
      </div>
    ) : variant === "columns" ? (
      <div className={s.columns}>
        {items.map((it) => (
          <div key={it.name}>
            <strong>{name(it)}</strong>
            <span>{it.blurb}</span>
            <ServiceDetails item={it} />
          </div>
        ))}
      </div>
    ) : variant === "tiles" ? (
      <div className={s.tiles}>
        {items.map((it) => (
          <div key={it.name} className={s.tile}>
            <strong>{name(it)}</strong>
            <span>{it.blurb}</span>
            <ServiceDetails item={it} />
          </div>
        ))}
      </div>
    ) : variant === "editorial" ? (
      <ol className={s.editorial}>
        {items.map((it, i) => (
          <li key={it.name} className={s.edRow}>
            <span className={s.edNum}>{String(i + 1).padStart(2, "0")}</span>
            <strong>{name(it)}</strong>
            <span>{it.blurb}</span>
            <ServiceDetails item={it} />
          </li>
        ))}
      </ol>
    ) : variant === "menu" ? (
      <div className={s.menu}>
        {items.map((it) => (
          <div key={it.name} className={s.menuItem}>
            <strong>{name(it)}</strong>
            <span>{it.blurb}</span>
            <ServiceDetails item={it} />
          </div>
        ))}
      </div>
    ) : (
      <div className={s.rows}>
        {items.map((it) => (
          <div key={it.name} className={s.row}>
            <strong>{name(it)}</strong>
            <span>{it.blurb}</span>
            <ServiceDetails item={it} />
          </div>
        ))}
      </div>
    );
  return (
    <section id="services" data-service-layout={variant} className={`${s.section} ${m.root} ${variant === "rows" || variant === "grid" ? s.alt : ""}`}>
      <div className={s.wrap}>
        <div className={s.sectionHead}>
          <h2 className={s.h2} data-label="Services">
            <Rich text={sv.title} />
          </h2>
          {sv.intro ? <p>{sv.intro}</p> : null}
        </div>
        {body}
      </div>
    </section>
  );
}

/* ---------------- About ---------------- */

export function About({ site, variant }: Props & { variant: Extract<SectionRef, { type: "about" }>["variant"] }) {
  const a = site.about;
  if (!a) return null;
  if (variant === "cards") {
    // Copy beside two overlapping, slightly tilted photo cards.
    const [p1, p2] = [site.brand.photos[1] ?? site.brand.photos[0], site.brand.photos[2]];
    return (
      <section id="about" className={s.section}>
        <div className={`${s.wrap} ${s.cards}`}>
          <div>
            <h2 className={s.h2} data-label="About">
              <Rich text={a.title ?? "About us"} />
            </h2>
            <p className={s.cardsBody}>{a.body}</p>
          </div>
          <div className={s.cardStack}>
            <Photo src={p1} label="Photo" className={s.cardA} />
            {p2 ? <Photo src={p2} label="Photo" className={s.cardB} /> : null}
          </div>
        </div>
      </section>
    );
  }
  if (variant === "split") {
    return (
      <section id="about" className={s.section}>
        <div className={`${s.wrap} ${s.split}`}>
          <Photo src={site.brand.photos[1] ?? site.brand.photos[0]} label="Illustrative photo" />
          <div>
            <h2 className={s.h2} data-label="About">
              <Rich text={a.title ?? "About us"} />
            </h2>
            <p>{a.body}</p>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="about" className={s.section}>
      <div className={`${s.wrap} ${s.quote}`}>
        {a.title ? <p className={s.eyebrow}>{a.title}</p> : null}
        <p>{a.body}</p>
      </div>
    </section>
  );
}

/* ---------------- Gallery ---------------- */

export function Gallery({ site, variant }: Props & { variant: Extract<SectionRef, { type: "gallery" }>["variant"] }) {
  if (variant === "editorial" && site.brand.photos.length) return <EditorialGallery site={site} />;
  const g = site.gallery;
  if (!g) return null;
  const photos = site.brand.photos.length > 1 ? site.brand.photos.slice(1) : site.brand.photos;
  const count = Math.max(g.labels.length, photos.length);
  if (!count) return null;
  const tiles = Array.from({ length: count }, (_, i) => ({ src: photos[i], label: g.labels[i] ?? `Photo ${i + 1}` }));
  return (
    <section id="gallery" className={`${s.section} ${m.root}`}>
      <div className={s.wrap}>
        {g.title ? (
          <div className={s.sectionHead}>
            <h2 className={s.h2} data-label="Gallery">
              <Rich text={g.title} />
            </h2>
          </div>
        ) : null}
        {photos.length ? <GalleryViewer businessName={site.business.name} photos={tiles} layout={variant === "strip" ? "strip" : "mosaic"} /> : <div className={variant === "strip" ? s.strip : s.mosaic}>
          {tiles.map((t, i) => (
            <Photo key={i} src={t.src} label={t.label} />
          ))}
        </div>}
      </div>
    </section>
  );
}

/* ---------------- Custom (the one lead-specific section) ---------------- */

export function Custom({ site, variant }: Props & { variant: Extract<SectionRef, { type: "custom" }>["variant"] }) {
  if (variant === "journey") return <VisitJourney site={site} />;
  const c = site.custom;
  if (!c) return null;
  if (variant === "strip") {
    return (
      <section id="custom" className={`${s.section} ${s.customStrip}`}>
        <div className={s.wrap}>
          <h2 className={s.h2} data-label="Details">
            <Rich text={c.title} />
          </h2>
          {c.body ? <p className={s.muted} style={{ marginTop: 12, maxWidth: "52ch" }}>{c.body}</p> : null}
          {c.items.length ? (
            <div className={s.customItems}>
              {c.items.map((it) => (
                <div key={it.name}>
                  <strong>{it.name}</strong>
                  {it.blurb ? <span>{it.blurb}</span> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    );
  }
  if (variant === "steps") {
    return (
      <section id="custom" className={s.section}>
        <div className={s.wrap}>
          <div className={s.sectionHead}>
            <h2 className={s.h2} data-label="Details">
            <Rich text={c.title} />
          </h2>
            {c.body ? <p>{c.body}</p> : null}
          </div>
          <div className={`${s.steps} ${m.stepGrid}`} data-interaction="process-steps">
            {c.items.map((it, i) => it.blurb ? (
              <details key={it.name} className={m.processStep} open={i === 0}>
                <summary><strong>{it.name}</strong><span aria-hidden="true">＋</span></summary>
                <p>{it.blurb}</p>
              </details>
            ) : <div key={it.name}><strong>{it.name}</strong></div>)}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="custom" className={s.section}>
      <div className={`${s.wrap}`}>
        <div className={s.note}>
          <h2 className={s.h2} style={{ fontSize: "1.6rem" }}>
            {c.title}
          </h2>
          {c.body ? <p>{c.body}</p> : null}
          {c.items.map((it) => (
            <p key={it.name}>
              <strong style={{ color: "var(--ink)" }}>{it.name}</strong>
              {it.blurb ? ` · ${it.blurb}` : ""}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Visit ---------------- */

function Hours({ site }: Props) {
  if (!site.business.hours.length) return null;
  return (
    <dl className={s.hours}>
      {site.business.hours.map((h) => (
        <Fragment key={h.days}>
          <dt>{h.days}</dt>
          <dd>{h.time}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

function AddressBlock({ site }: Props) {
  const a = site.business.address;
  const lines = [a.line1, cityLine(a)].filter(Boolean).join("\n");
  return <p className={s.address}>{lines}</p>;
}

export function Visit({ site, variant }: Props & { variant: Extract<SectionRef, { type: "visit" }>["variant"] }) {
  const b = site.business;
  if (variant === "card") {
    return (
      <section id="visit" className={s.section}>
        <div className={`${s.wrap} ${s.visitCard}`}>
          <div>
            <h2 className={s.h2} data-label="Visit">
              Find us
            </h2>
            <AddressBlock site={site} />
            {b.mapsUrl ? <a {...inert}>Open in Google Maps</a> : null}
          </div>
          <div className={s.visitCardBox}>
            {b.hours.length ? <strong>Opening hours</strong> : <strong>Get in touch</strong>}
            <Hours site={site} />
            {phoneText(b) ? <a {...inert}>{phoneText(b)}</a> : null}
            {b.messenger ? <a {...inert}>Message us on Facebook</a> : null}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="visit" className={`${s.section} ${s.alt}`}>
      <div className={`${s.wrap} ${s.visitSplit}`}>
        <div>
          <h2 className={s.h2} data-label="Visit">
            Visit us
          </h2>
          <AddressBlock site={site} />
          <Hours site={site} />
          {phoneText(b) ? <a {...inert}>{phoneText(b)}</a> : null}
          {b.mapsUrl ? <a {...inert}>Open in Google Maps</a> : null}
        </div>
        <Photo label="Map" />
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */

export function Faq({ site, variant }: Props & { variant: Extract<SectionRef, { type: "faq" }>["variant"] }) {
  if (!site.faqs.length) return null;
  return (
    <section id="faq" className={s.section}>
      <div className={s.wrap}>
        <div className={s.sectionHead}>
          <h2 className={s.h2} data-label="Questions">
            Questions
          </h2>
        </div>
        <div className={variant === "columns" ? s.faqColumns : s.faqList}>
          {site.faqs.map((f) => (
            <details key={f.q} className={s.faq}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Close ---------------- */

export function Close({ site, variant }: Props & { variant: Extract<SectionRef, { type: "close" }>["variant"] }) {
  const c = site.close;
  if (!c) return null;
  if (variant === "card") {
    return (
      <section className={s.section}>
        <div className={`${s.wrap}`}>
          <div className={s.closeCard}>
            <div>
              <h2 className={s.h2}>
            <Rich text={c.headline} />
          </h2>
              {c.sub ? <p>{c.sub}</p> : null}
            </div>
            <Ctas site={site} />
          </div>
        </div>
      </section>
    );
  }
  if (variant === "giant") {
    // Accent-coloured band with oversized type, the page's last word before the footer.
    return (
      <section className={`${s.section} ${s.closeGiant}`}>
        <div className={s.wrap}>
          <h2 className={s.giantType}>
            <Rich text={c.headline} />
          </h2>
          <div className={s.giantRow}>
            {c.sub ? <p>{c.sub}</p> : <span />}
            <Ctas site={site} invert />
          </div>
        </div>
      </section>
    );
  }
  if (variant === "statement") {
    return (
      <section className={`${s.section} ${s.closeStatement}`}>
        <div className={s.wrap}>
          <h2 className={s.h2}>
            <Rich text={c.headline} />
          </h2>
          {c.sub ? <p>{c.sub}</p> : null}
          <Ctas site={site} />
        </div>
      </section>
    );
  }
  return (
    <section className={`${s.section} ${s.closeBand}`}>
      <div className={s.wrap}>
        <h2 className={s.h2}>
            <Rich text={c.headline} />
          </h2>
        {c.sub ? <p>{c.sub}</p> : null}
        <Ctas site={site} invert />
      </div>
    </section>
  );
}
