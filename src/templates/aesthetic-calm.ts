import { defineTemplate } from "@/lib/templates";

// Quiet, warm, editorial. Blush ivory ground, terracotta accent, high-contrast serif.
export const aestheticCalm = defineTemplate({
  id: "aesthetic-calm",
  name: "Linen",
  look: "calm",
  industries: ["medical aesthetics", "skin clinic", "spa", "wellness"],
  fonts: {
    display: "'DM Serif Display', Georgia, serif",
    body: "'DM Sans', system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap",
  },
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
    { type: "hero", variant: "centered" },
    { type: "services", variant: "columns" },
    { type: "about", variant: "split" },
    { type: "gallery", variant: "mosaic" },
    { type: "custom", variant: "note" },
    { type: "visit", variant: "split" },
    { type: "close", variant: "card" },
  ],
  fingerprint: {
    grammar: "soft editorial magazine, generous whitespace, sharp corners",
    nav: "centred wordmark feel, muted links, flat rectangular CTA",
    hero: "centred serif headline, three tall portrait tiles below",
    sequence: "hero → service columns → about split → mosaic → note → visit → card",
    close: "bordered card with headline left, buttons right",
    signature: "service names set in terracotta serif as the only coloured type",
  },
});
