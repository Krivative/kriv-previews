import { defineTemplate } from "@/lib/templates";

// Airy home-services page. White and ice blue, cool blue accent, Lexend headings, 12px radii.
export const hvacCalm = defineTemplate({
  id: "hvac-calm",
  name: "Breeze",
  look: "calm",
  industries: ["HVAC contractor", "heating and air conditioning", "furnace repair", "heat pump installer", "indoor air quality"],
  fonts: {
    display: "Lexend, system-ui, sans-serif",
    body: "'Public Sans', system-ui, sans-serif",
    accent: "'Instrument Serif', Georgia, serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Lexend:wght@500;600&family=Public+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap",
  },
  style: { numbered: true, motion: true },
  tokens: {
    bg: "#F4F8FB",
    surface: "#FFFFFF",
    ink: "#0F2030",
    muted: "#4A5C6C",
    line: "#D5E2EC",
    accent: "#1C6BB0",
    accentInk: "#FFFFFF",
    radius: "12px",
    buttonRadius: "10px",
    displayWeight: "600",
    displayTracking: "-0.025em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "cinematic" },
    { type: "custom", variant: "strip" },
    { type: "services", variant: "editorial" },
    { type: "about", variant: "cards" },
    { type: "visit", variant: "split" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "giant" },
  ],
  fingerprint: {
    grammar: "airy home-services page, white and ice blue, cool blue accent, rounded geometric sans (Lexend), 12px radii",
    nav: "geometric sans wordmark, blue soft-square CTA",
    hero: "cinematic: full-screen photo under a cool scrim, Lexend headline with an italic serif accent, scroll cue",
    sequence: "cinematic → service-area strip → numbered editorial services → tilted photo cards → visit split → FAQ columns → giant blue close",
    close: "giant accent band with oversized display type, sub and buttons on one row",
    signature: "full-screen photo hero, then the blue service-area strip, then services as numbered hairline rows",
  },
});
