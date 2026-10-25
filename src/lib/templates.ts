import type { SectionRef } from "./site-schema";

// A template = a look (tokens + fonts) + a default section list + its fingerprint.
// Sections themselves are shared (src/sections); a template never ships page code.
export type TemplateDef = {
  id: string;
  name: string;
  look: "calm" | "bold";
  industries: string[];
  fonts: {
    display: string; // CSS font-family value
    body: string;
    /** Italic face for *accent* words in headings; defaults to the display font. */
    accent?: string;
    /** Google Fonts css2 URL loading every family above. */
    googleCss: string;
  };
  /** Editorial touches shared by the cinematic templates (all optional, off by default). */
  style?: {
    /** "01 — Services" labels above section headings. */
    numbered?: boolean;
    /** Sections rise in as they scroll into view (CSS only; off for reduced motion). */
    motion?: boolean;
    /** A large faded word behind section headings. */
    ghost?: boolean;
  };
  /** CSS custom properties applied on the site root. See sections.module.css for the list. */
  tokens: {
    bg: string;
    surface: string;
    ink: string;
    muted: string;
    line: string;
    accent: string;
    accentInk: string;
    radius: string;
    buttonRadius: string;
    displayWeight: string;
    displayTracking: string;
    displayCase: "none" | "uppercase";
  };
  sections: SectionRef[];
  fingerprint: {
    grammar: string;
    nav: string;
    hero: string;
    sequence: string;
    close: string;
    signature: string;
  };
};

export function defineTemplate(def: TemplateDef): TemplateDef {
  return def;
}
