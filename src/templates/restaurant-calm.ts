import { defineTemplate } from "@/lib/templates";

// Warm, unhurried, bistro. Cream ground, charcoal type, olive accent, classic serif.
export const restaurantCalm = defineTemplate({
  id: "restaurant-calm",
  name: "Table",
  look: "calm",
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
    grammar: "menu-card editorial on cream, serif throughout",
    nav: "serif wordmark, olive rectangular CTA",
    hero: "stacked: headline, then a wide 16:7 photo, then sub and buttons",
    sequence: "stacked hero → menu → about split → mosaic → note → visit split → card",
    close: "bordered card",
    signature: "the headline sits above the photo like a menu title above a dish",
  },
});
