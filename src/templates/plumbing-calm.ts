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
    googleCss: "https://fonts.googleapis.com/css2?family=Outfit:wght@500;600&family=Source+Sans+3:wght@400;600&display=swap",
  },
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
    { type: "hero", variant: "split" },
    { type: "services", variant: "rows" },
    { type: "custom", variant: "strip" },
    { type: "about", variant: "split" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "clean-water trade page, white and pale aqua, teal accent, rounded sans (Outfit), 14px radii",
    nav: "rounded sans wordmark, teal rounded CTA",
    hero: "split: copy left with call button, photo right in a 14px frame",
    sequence: "split → service rows → teal contact strip → about split → visit card → FAQ columns → band",
    close: "full-width teal band",
    signature: "services listed as plain rows straight under the hero, with the teal phone-and-area strip after them, not before",
  },
});
