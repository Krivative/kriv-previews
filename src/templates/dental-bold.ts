import { defineTemplate } from "@/lib/templates";

// Bold, modern, confident. Deep navy ground, warm yellow accent, heavy grotesk headlines.
export const dentalBold = defineTemplate({
  id: "dental-bold",
  name: "Bright",
  look: "bold",
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
    grammar: "dark product-style landing, cards on a navy field",
    nav: "wordmark left, square yellow CTA",
    hero: "cinematic: full-screen photo, Syne headline with a sunny italic serif accent",
    sequence: "cinematic → service grid → steps → photo strip → tilted cards → visit card → FAQ columns → giant yellow close",
    close: "giant accent band with oversized display type, sub and buttons on one row",
    signature: "faded giant words on deep navy and a giant sunny-yellow close",
  },
});
