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
    /** Google Fonts css2 URL loading both families. */
    googleCss: string;
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
