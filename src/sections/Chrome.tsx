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
          {site.brand.logo ? (
            // The business's own logo, from its website or listing (Kriv, 2026-10-25).
            // eslint-disable-next-line @next/next/no-img-element
            <img className={s.brandLogo} src={site.brand.logo} alt="" />
          ) : null}
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
        <PhotoCredits site={site} />
      </footer>
    </div>
  );
}

// Unsplash attribution: the photographer's profile and Unsplash, each with the
// app's UTM tag. These are the only live outbound links a preview may carry.
export const UNSPLASH_UTM = "utm_source=kriv_previews&utm_medium=referral";
const withUtm = (url: string) => `${url}${url.includes("?") ? "&" : "?"}${UNSPLASH_UTM}`;

export function PhotoCredits({ site }: { site: SiteData }) {
  const all = site.brand.photoCredits;
  const credits = all.flatMap((c) => (c.provider === "Unsplash" ? [c] : []));
  const own = all.some((c) => c.provider === "Business") || Boolean(site.brand.logo);
  if (!credits.length && !own) return null;
  const people = [...new Map(credits.map((c) => [c.profileUrl, c])).values()];
  const rel = "noopener noreferrer nofollow";
  const ownNote = own ? `Photos and logo from ${site.business.name}'s own website, shown only in this concept. ` : "";
  if (!credits.length) return <span className={s.footerNote}>{ownNote}</span>;
  return (
    <span className={s.footerNote}>
      {ownNote}Stock photos for illustration, not of {site.business.name}:{" "}
      {people.map((c, i) => (
        <span key={c.profileUrl}>
          {i ? ", " : ""}
          <a href={withUtm(c.profileUrl)} target="_blank" rel={rel}>
            {c.photographer}
          </a>
        </span>
      ))}{" "}
      on{" "}
      <a href={withUtm("https://unsplash.com/")} target="_blank" rel={rel}>
        Unsplash
      </a>
      .
    </span>
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
