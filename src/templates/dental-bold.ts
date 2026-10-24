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
    googleCss: "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Manrope:wght@400;500;700&display=swap",
  },
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
    { type: "hero", variant: "centered" },
    { type: "services", variant: "grid" },
    { type: "custom", variant: "steps" },
    { type: "gallery", variant: "strip" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "statement" },
  ],
  fingerprint: {
    grammar: "dark product-style landing, cards on a navy field",
    nav: "wordmark left, square yellow CTA",
    hero: "centred headline over a three-photo strip with the middle tile dropped",
    sequence: "hero → service cards → numbered steps → photo strip → visit card → FAQ columns → statement",
    close: "giant left-aligned statement headline, buttons under it",
    signature: "numbered steps with oversized yellow 01/02/03 numerals",
  },
});
