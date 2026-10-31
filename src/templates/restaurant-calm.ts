import { defineTemplate } from "@/lib/templates";

// Warm, unhurried, bistro. Cream ground, charcoal type, olive accent, classic serif.
export const restaurantCalm = defineTemplate({
  id: "restaurant-calm",
  name: "Table",
  look: "calm",
  composition: "tablecloth",
  industries: ["restaurant", "bistro", "Filipino restaurant", "seafood restaurant", "family restaurant"],
  fonts: {
    display: "'Libre Caslon Text', Georgia, serif",
    body: "'Nunito Sans', system-ui, sans-serif",
    googleCss:
      "https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Nunito+Sans:wght@400;600;700&display=swap",
  },
  tokens: {
    bg: "#FBF8F1",
    surface: "#F2EDE1",
    ink: "#2B2A26",
    muted: "#6B675C",
    line: "#DCD5C4",
    accent: "#5C6B3C",
    accentInk: "#FFFFFF",
    radius: "4px",
    buttonRadius: "4px",
    displayWeight: "400",
    displayTracking: "-0.01em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "stacked" },
    { type: "services", variant: "menu" },
    { type: "about", variant: "split" },
    { type: "gallery", variant: "mosaic" },
    { type: "custom", variant: "note" },
    { type: "visit", variant: "split" },
    { type: "close", variant: "card" },
  ],
  fingerprint: {
    grammar: "facing book leaves with an outlined title page and photographic opposite page",
    nav: "centered serif identity over a small row of links",
    hero: "title and actions centered on one book leaf, photo and subtext on its facing leaf",
    sequence: "book opening, dotted menu cards, letter, gallery, notes, questions, closing letter",
    close: "reading-width closing letter",
    signature: "two facing book leaves open into a restrained two-column offering menu without invented prices",
  },
});
