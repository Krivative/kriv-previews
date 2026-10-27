import { defineTemplate } from "@/lib/templates";

// Warm clinic journal. Cream, charcoal and ochre, Newsreader serif headings, 16px radii, pill buttons.
export const chiroCalm = defineTemplate({
  id: "chiro-calm",
  name: "Align",
  look: "calm",
  composition: "journal",
  industries: ["chiropractor", "chiropractic clinic", "family chiropractic", "sports chiropractic", "physical therapy"],
  fonts: {
    display: "Newsreader, Georgia, serif",
    body: "'Hanken Grotesk', system-ui, sans-serif",
    accent: "Newsreader, Georgia, serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Hanken+Grotesk:wght@400;500;600&display=swap",
  },
  style: { numbered: true, motion: true },
  tokens: {
    bg: "#FBF8F2",
    surface: "#FFFFFF",
    ink: "#23211D",
    muted: "#5F5A52",
    line: "#E6DFD2",
    accent: "#A86A1C",
    accentInk: "#FFFFFF",
    radius: "16px",
    buttonRadius: "999px",
    displayWeight: "400",
    displayTracking: "-0.015em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "cinematic" },
    { type: "custom", variant: "journey" },
    { type: "services", variant: "editorial" },
    { type: "about", variant: "cards" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "reading journal with marginal notes, circular frontispiece and Newsreader headline",
    nav: "serif journal identity and links stacked between fine rules",
    hero: "small circular frontispiece above a reading-width centered headline beside marginal category notes",
    sequence: "frontispiece, expandable supplied notes, offering chapters, centered essay, questions, gallery, closing letter",
    close: "reading-width closing letter",
    signature: "chapter-numbered offerings and expandable supplied notes in a quiet journal rhythm",
  },
});
