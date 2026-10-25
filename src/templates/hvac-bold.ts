import { defineTemplate } from "@/lib/templates";

// Night-shift contractor. Deep navy, amber heat accent, heavy Sora headings, 8px radii, pill buttons.
export const hvacBold = defineTemplate({
  id: "hvac-bold",
  name: "Thermal",
  look: "bold",
  industries: ["HVAC company", "emergency heating and cooling", "commercial HVAC", "ductwork and ventilation", "refrigeration"],
  fonts: {
    display: "Sora, system-ui, sans-serif",
    body: "Rubik, system-ui, sans-serif",
    accent: "'Instrument Serif', Georgia, serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Rubik:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap",
  },
  style: { numbered: true, motion: true, ghost: true },
  tokens: {
    bg: "#0E1A2B",
    surface: "#16253A",
    ink: "#F1F5FA",
    muted: "#A9B6C7",
    line: "#253650",
    accent: "#FFB020",
    accentInk: "#0E1A2B",
    radius: "8px",
    buttonRadius: "999px",
    displayWeight: "800",
    displayTracking: "-0.03em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "cinematic" },
    { type: "custom", variant: "strip" },
    { type: "services", variant: "tiles" },
    { type: "about", variant: "cards" },
    { type: "gallery", variant: "mosaic" },
    { type: "visit", variant: "split" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "giant" },
  ],
  fingerprint: {
    grammar: "night-shift contractor, deep navy, amber heat accent, heavy tight Sora, 8px radii with pill buttons",
    nav: "heavy sans wordmark, amber pill CTA",
    hero: "cinematic: full-screen photo, heavy Sora headline with an amber italic serif accent, scroll cue",
    sequence: "cinematic → amber emergency strip → service tiles → tilted cards → mosaic → visit split → FAQ list → giant amber close",
    close: "giant accent band with oversized display type, sub and buttons on one row",
    signature: "faded giant words behind every heading on navy, amber tiles, and a giant amber close",
  },
});
