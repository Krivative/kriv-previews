import { defineTemplate } from "@/lib/templates";

// Bold, modern, confident. Deep navy ground, warm yellow accent, heavy grotesk headlines.
export const dentalBold = defineTemplate({
  id: "dental-bold",
  name: "Bright",
  look: "bold",
  composition: "signal",
  industries: ["dental clinic", "cosmetic dentist", "implant centre", "orthodontist"],
  fonts: {
    display: "Syne, system-ui, sans-serif",
    body: "Manrope, system-ui, sans-serif",
    accent: "'Instrument Serif', Georgia, serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Manrope:wght@400;500;700&family=Instrument+Serif:ital@0;1&display=swap",
  },
  style: { numbered: true, motion: true, ghost: true },
  tokens: {
    bg: "#0B1F3A",
    surface: "#122B4D",
    ink: "#F3F6FB",
    muted: "#B7C3D6",
    line: "#28426A",
    accent: "#FFC94D",
    accentInk: "#0B1F3A",
    radius: "6px",
    buttonRadius: "6px",
    displayWeight: "800",
    displayTracking: "-0.03em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "cinematic" },
    { type: "services", variant: "grid" },
    { type: "custom", variant: "steps" },
    { type: "gallery", variant: "strip" },
    { type: "about", variant: "cards" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "giant" },
  ],
  fingerprint: {
    grammar: "solid yellow message block beside a full-height portrait, geometric Syne display",
    nav: "plain identity and compact right-hand links without a divider",
    hero: "large text inside a solid colour block balanced by an edge-to-edge portrait and location tab",
    sequence: "message block, supplied notes, numbered matrix, gallery, manifesto, questions, billboard",
    close: "full-width accent billboard with factual contact columns",
    signature: "a large numbered offering matrix with independently expandable blocks",
  },
});
