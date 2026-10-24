import { defineTemplate } from "@/lib/templates";

// Loud grill-house energy. Charcoal ground, ember orange, condensed uppercase display.
export const restaurantBold = defineTemplate({
  id: "restaurant-bold",
  name: "Ember",
  look: "bold",
  industries: ["grill", "barbecue", "steakhouse", "bar and restaurant", "samgyupsal"],
  fonts: {
    display: "Oswald, Impact, sans-serif",
    body: "'Source Sans 3', system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Source+Sans+3:wght@400;600;700&display=swap",
  },
  tokens: {
    bg: "#1A1A1A",
    surface: "#262626",
    ink: "#F6F2EC",
    muted: "#B9B2A8",
    line: "#3A3A3A",
    accent: "#F25C2A",
    accentInk: "#1A1A1A",
    radius: "0px",
    buttonRadius: "0px",
    displayWeight: "600",
    displayTracking: "0.01em",
    displayCase: "uppercase",
  },
  sections: [
    { type: "hero", variant: "banner" },
    { type: "services", variant: "tiles" },
    { type: "custom", variant: "strip" },
    { type: "gallery", variant: "strip" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "statement" },
  ],
  fingerprint: {
    grammar: "dark poster-grid, zero radius, uppercase everything",
    nav: "uppercase wordmark, square orange CTA",
    hero: "full-bleed photo banner with copy at the bottom edge",
    sequence: "banner → tiles → strip → photo strip → visit card → FAQ columns → statement",
    close: "giant uppercase statement, left-aligned",
    signature: "service tiles with every third tile filled ember orange, no borders",
  },
});
