import { defineTemplate } from "@/lib/templates";

// Clean-water trade page. White and pale aqua, teal accent, Outfit headings, 14px radii.
export const plumbingCalm = defineTemplate({
  id: "plumbing-calm",
  name: "Tap",
  look: "calm",
  industries: ["plumber", "drain cleaning", "water heater repair", "leak repair", "repiping"],
  fonts: {
    display: "Outfit, system-ui, sans-serif",
    body: "'Source Sans 3', system-ui, sans-serif",
    accent: "'Instrument Serif', Georgia, serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Outfit:wght@500;600&family=Source+Sans+3:wght@400;600&family=Instrument+Serif:ital@0;1&display=swap",
  },
  style: { numbered: true, motion: true },
  tokens: {
    bg: "#F3FAFA",
    surface: "#FFFFFF",
    ink: "#0D2A2C",
    muted: "#4B6466",
    line: "#CFE6E6",
    accent: "#0F8A8A",
    accentInk: "#FFFFFF",
    radius: "14px",
    buttonRadius: "14px",
    displayWeight: "600",
    displayTracking: "-0.02em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "cinematic" },
    { type: "services", variant: "editorial" },
    { type: "custom", variant: "strip" },
    { type: "about", variant: "cards" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "clean-water trade page, white and pale aqua, teal accent, rounded sans (Outfit), 14px radii",
    nav: "rounded sans wordmark, teal rounded CTA",
    hero: "cinematic: full-screen photo under a teal-tinted scrim, Outfit headline with an italic serif accent",
    sequence: "cinematic → numbered service rows → teal contact strip → tilted cards → visit card → FAQ columns → teal band",
    close: "full-width teal band",
    signature: "numbered hairline service rows straight under the full-screen hero, teal phone strip after them",
  },
});
