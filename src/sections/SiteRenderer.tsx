import type { CSSProperties } from "react";
import type { SiteData, SectionRef } from "@/lib/site-schema";
import type { TemplateDef } from "@/lib/templates";
import { Header, Footer, Ribbon, hasContent } from "./Chrome";
import { About, Close, Custom, Faq, Gallery, Hero, Services, Visit } from "./Sections";
import s from "./sections.module.css";

// Turns template tokens (+ the site's design overrides) into CSS variables and
// renders the section list in order. Sections without data are skipped.
export function SiteRenderer({ site, template }: { site: SiteData; template: TemplateDef }) {
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
  } as CSSProperties;

  const sections: SectionRef[] = (site.design.sections ?? template.sections).filter((sec) => hasContent(site, sec.type));
  const googleCss = site.design.fonts ? undefined : template.fonts.googleCss;

  return (
    <div className={s.site} style={vars} lang={site.lang}>
      {googleCss ? <link rel="stylesheet" href={googleCss} precedence="fonts" /> : null}
      <Ribbon site={site} />
      <Header site={site} sections={sections} />
      {sections.map((sec, i) => {
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
          case "visit":
            return <Visit key={key} site={site} variant={sec.variant} />;
          case "faq":
            return <Faq key={key} site={site} variant={sec.variant} />;
          case "close":
            return <Close key={key} site={site} variant={sec.variant} />;
        }
      })}
      <Footer site={site} />
    </div>
  );
}
