import type { CSSProperties } from "react";
import type { SiteData, SectionRef } from "@/lib/site-schema";
import type { TemplateDef } from "@/lib/templates";
import { Header, Footer, Ribbon, hasContent } from "./Chrome";
import { About, Close, Custom, Faq, Gallery, Hero, Services } from "./Sections";
import s from "./sections.module.css";
import { Orientation, PageContent, PageDirectory, Planning, ContactDetails } from "./Pages";
import type { SitePage } from "@/lib/site-pages";
import { ComposedSite } from "./ComposedSite";

// Turns template tokens (+ the site's design overrides) into CSS variables and
// renders the section list in order. Sections without data are skipped.
export function SiteRenderer({ site, template, page }: { site: SiteData; template: TemplateDef; page?: SitePage }) {
  const t = template.tokens;
  const fonts = site.design.fonts ?? template.fonts;
  const accent = site.design.accent ?? t.accent;
  const vars = {
    "--bg": t.bg,
    "--surface": t.surface,
    "--ink": t.ink,
    "--muted": t.muted,
    "--line": t.line,
    "--accent": accent,
    "--accent-ink": t.accentInk,
    "--radius": t.radius,
    "--button-radius": t.buttonRadius,
    "--display-weight": t.displayWeight,
    "--display-tracking": t.displayTracking,
    "--display-case": t.displayCase,
    "--font-display": fonts.display,
    "--font-body": fonts.body,
    "--font-accent": template.fonts.accent ?? fonts.display,
  } as CSSProperties;
  const style = template.style ?? {};

  const sections: SectionRef[] = (site.design.sections ?? template.sections).filter((sec) => hasContent(site, sec.type));
  const googleCss = site.design.fonts ? undefined : template.fonts.googleCss;

  return (
    <div
      className={s.site}
      style={vars}
      lang={site.lang}
      data-numbered={style.numbered ? "" : undefined}
      data-motion={style.motion ? "" : undefined}
      data-ghost={style.ghost ? "" : undefined}
      data-look={template.look}
    >
      {googleCss ? <link rel="stylesheet" href={googleCss} precedence="fonts" /> : null}
      {template.composition && !site.design.sections ? <ComposedSite site={site} template={template} page={page} /> : <>
      <Ribbon site={site} />
      <a className={s.skipLink} href="#main-content">Skip to content</a>
      <Header site={site} currentPath={page?.path} />
      <Orientation site={site} />
      <main id="main-content">
      {page && page.kind !== "home" ? <PageContent site={site} page={page} bold={template.look === "bold"} /> : <>
      {sections.filter((sec) => sec.type !== "visit" && sec.type !== "close").map((sec, i) => {
        const key = `${sec.type}-${i}`;
        switch (sec.type) {
          case "hero":
            return <Hero key={key} site={site} variant={sec.variant} />;
          case "services":
            return <Services key={key} site={site} variant={sec.variant} />;
          case "about":
            return <About key={key} site={site} variant={sec.variant} />;
          case "gallery":
            return <Gallery key={key} site={site} variant={sec.variant} />;
          case "custom":
            return <Custom key={key} site={site} variant={sec.variant} />;
          case "faq":
            return <Faq key={key} site={site} variant={sec.variant} />;
        }
      })}
      <Planning site={site} />
      <PageDirectory site={site} />
      <ContactDetails site={site} />
      {sections.filter((sec) => sec.type === "close").map((sec, i) => sec.type === "close" ? <Close key={`close-${i}`} site={site} variant={sec.variant} /> : null)}
      </>}
      </main>
      <Footer site={site} />
      </>}
    </div>
  );
}
