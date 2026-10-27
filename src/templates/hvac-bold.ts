import { defineTemplate } from "@/lib/templates";

// Night-shift contractor. Deep navy, amber heat accent, heavy Sora headings, 8px radii, pill buttons.
export const hvacBold = defineTemplate({
  id: "hvac-bold",
  name: "Thermal",
  look: "bold",
  composition: "terminal",
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
    grammar: "dark utility directory with a broad Sora headline and framed image-console split",
    nav: "uppercase utility identity and small links above a fine amber rule",
    hero: "wide headline over a framed photo and a directory containing sourced offering links",
    sequence: "directory opening, offering console, supplied notes, questions, story aside, gallery, ruled close",
    close: "factual contact spread beneath a strong amber rule",
    signature: "a real offering directory opens an amber-outlined detail console without simulated live statuses",
  },
});
