import type { SiteData, SectionRef } from "@/lib/site-schema";
import { defaultCtas } from "./ctas";
import { inert } from "./inert";
import s from "./sections.module.css";

const navLabels: Partial<Record<SectionRef["type"], string>> = {
  services: "Services",
  about: "About",
  gallery: "Gallery",
  visit: "Visit",
  faq: "FAQ",
};

// Guardrail 2: every preview carries this banner. Do not remove or reword it.
export function conceptNotice(name: string): string {
  return `Concept preview prepared by KRIV for ${name}. Not affiliated with or endorsed by ${name}.`;
}

export function Ribbon({ site }: { site: SiteData }) {
  return (
    <div className={s.ribbon} role="note">
      {conceptNotice(site.business.name)} Buttons and links are disabled.
    </div>
  );
}

export function Header({ site, sections }: { site: SiteData; sections: SectionRef[] }) {
  const { primary } = defaultCtas(site);
  const links = sections.filter((sec) => navLabels[sec.type] && hasContent(site, sec.type));
  return (
    <div className={s.wrap}>
      <header className={s.header}>
        <a href="#top" className={s.brand}>
          {site.business.name}
        </a>
        <nav className={s.nav} aria-label="Sections">
          {links.map((sec) => (
            <a key={sec.type} href={`#${sec.type}`}>
              {navLabels[sec.type]}
            </a>
          ))}
          {primary ? (
            <a className={s.navCta} {...inert}>
              {primary.label}
            </a>
          ) : null}
        </nav>
      </header>
    </div>
  );
}

export function Footer({ site }: { site: SiteData }) {
  const a = site.business.address;
  const place = [a.line1, a.city, a.region].filter(Boolean).join(", ");
  const socials = Object.entries(site.business.socials);
  return (
    <div className={s.wrap}>
      <footer className={s.footer}>
        <span>
          {site.business.name} · {place}
        </span>
        <span>
          {site.business.phoneDisplay ? <a {...inert}>{site.business.phoneDisplay}</a> : null}
          {socials.map(([name]) => (
            <span key={name}>
              {" · "}
              <a {...inert}>{name}</a>
            </span>
          ))}
        </span>
        <span className={s.footerNote}>{conceptNotice(site.business.name)}</span>
      </footer>
    </div>
  );
}

// A section only renders (and appears in the nav) when the site has data for it.
export function hasContent(site: SiteData, type: SectionRef["type"]): boolean {
  switch (type) {
    case "hero":
    case "visit":
      return true;
    case "services":
      return Boolean(site.services && site.services.items.length);
    case "about":
      return Boolean(site.about);
    case "gallery":
      return Boolean(site.gallery && (site.gallery.labels.length || site.brand.photos.length));
    case "custom":
      return Boolean(site.custom);
    case "faq":
      return site.faqs.length > 0;
    case "close":
      return Boolean(site.close);
  }
}
