import { defineTemplate } from "@/lib/templates";

// Loud grill-house energy. Charcoal ground, ember orange, condensed uppercase display.
export const restaurantBold = defineTemplate({
  id: "restaurant-bold",
  name: "Ember",
  look: "bold",
  composition: "furnace",
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
    grammar: "wide panoramic strip over heavy condensed type and alternating charcoal bands",
    nav: "uppercase tracked identity and links above a strong accent rule",
    hero: "low landscape photograph with a factual caption block, then headline and introduction side by side",
    sequence: "panoramic opening, supplied notes, horizontal offering bands, story aside, questions, gallery, ruled close",
    close: "contact spread under a heavy accent rule",
    signature: "full-width offering bands expand below a panoramic image and low typographic headline",
  },
});
