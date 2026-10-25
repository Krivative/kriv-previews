import { defineTemplate } from "@/lib/templates";

// Quiet, warm, editorial. Blush ivory ground, terracotta accent, high-contrast serif.
export const aestheticCalm = defineTemplate({
  id: "aesthetic-calm",
  name: "Linen",
  look: "calm",
  industries: ["medical aesthetics", "skin clinic", "spa", "wellness"],
  fonts: {
    display: "'Cormorant Garamond', Georgia, serif",
    body: "Jost, system-ui, sans-serif",
    accent: "'Cormorant Garamond', Georgia, serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500&family=Jost:wght@400;500&display=swap",
  },
  style: { numbered: true, motion: true },
  tokens: {
    bg: "#FBF7F4",
    surface: "#F3ECE6",
    ink: "#2A2322",
    muted: "#6B5E59",
    line: "#E3D8D0",
    accent: "#B07D62",
    accentInk: "#FFFFFF",
    radius: "2px",
    buttonRadius: "2px",
    displayWeight: "400",
    displayTracking: "-0.01em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "cinematic" },
    { type: "services", variant: "editorial" },
    { type: "about", variant: "cards" },
    { type: "gallery", variant: "mosaic" },
    { type: "custom", variant: "note" },
    { type: "visit", variant: "split" },
    { type: "close", variant: "giant" },
  ],
  fingerprint: {
    grammar: "quiet luxury clinic, linen and clay, Cormorant Garamond with italic accents, Jost body, soft radii",
    nav: "centred wordmark feel, muted links, flat rectangular CTA",
    hero: "cinematic: full-screen warm interior photo, Cormorant headline ending in an italic clay accent",
    sequence: "cinematic → numbered treatment rows → tilted cards → mosaic → note → visit split → giant clay close",
    close: "giant accent band with oversized display type, sub and buttons on one row",
    signature: "Cormorant headlines that turn italic mid-sentence, over a warm full-screen photo",
  },
});
