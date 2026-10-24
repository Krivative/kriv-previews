import { defineTemplate } from "@/lib/templates";

// Boutique studio. Warm off-white, dusty indigo accent, italic-leaning Instrument Serif, pill buttons on a square layout.
export const gymCalm = defineTemplate({
  id: "gym-calm",
  name: "Form",
  look: "calm",
  industries: ["pilates studio", "yoga studio", "boutique gym", "personal training", "dance and barre"],
  fonts: {
    display: "'Instrument Serif', Georgia, serif",
    body: "'Albert Sans', system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Albert+Sans:wght@400;500;600&display=swap",
  },
  tokens: {
    bg: "#F6F5F1",
    surface: "#ECEAE3",
    ink: "#1E1E22",
    muted: "#62646B",
    line: "#D9D7CF",
    accent: "#3F4A9E",
    accentInk: "#FFFFFF",
    radius: "4px",
    buttonRadius: "999px",
    displayWeight: "400",
    displayTracking: "-0.02em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "centered" },
    { type: "services", variant: "grid" },
    { type: "about", variant: "quote" },
    { type: "gallery", variant: "mosaic" },
    { type: "custom", variant: "note" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "statement" },
  ],
  fingerprint: {
    grammar: "boutique studio, warm off-white, dusty indigo, large tight serif with pill buttons",
    nav: "serif wordmark, indigo pill CTA",
    hero: "centred large serif headline, three photo tiles below",
    sequence: "centred → class grid → quote → mosaic → note → visit card → FAQ → statement",
    close: "large serif statement, indigo pill",
    signature: "pill buttons on an otherwise square 4px layout; classes shown as a grid of cards",
  },
});
