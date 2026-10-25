import { defineTemplate } from "@/lib/templates";

// Glossy, nightlife-adjacent. Near-black ground, rose accent, pill everything.
export const aestheticBold = defineTemplate({
  id: "aesthetic-bold",
  name: "Gloss",
  look: "bold",
  industries: ["medical aesthetics", "aesthetic clinic", "lash and brow studio", "nail studio"],
  fonts: {
    display: "'Bodoni Moda', Didot, Georgia, serif",
    body: "'DM Sans', system-ui, sans-serif",
    accent: "'Bodoni Moda', Didot, Georgia, serif",
    googleCss:
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap",
  },
  style: { numbered: true, motion: true, ghost: true },
  tokens: {
    bg: "#141214",
    surface: "#1E1B1F",
    ink: "#F4EEF0",
    muted: "#B9AEB3",
    line: "#352F33",
    accent: "#E58FA4",
    accentInk: "#141214",
    radius: "24px",
    buttonRadius: "999px",
    displayWeight: "800",
    displayTracking: "-0.035em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "cinematic" },
    { type: "services", variant: "menu" },
    { type: "custom", variant: "strip" },
    { type: "about", variant: "cards" },
    { type: "gallery", variant: "strip" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "giant" },
  ],
  fingerprint: {
    grammar: "after-dark editorial, near-black with rose, high-contrast Bodoni with italic accents, DM Sans body",
    nav: "wordmark + pill CTA on dark",
    hero: "cinematic: full-screen moody photo, Bodoni headline with a rose italic accent",
    sequence: "cinematic → treatment menu → rose strip → tilted cards → photo strip → visit card → FAQ list → giant rose close",
    close: "giant accent band with oversized display type, sub and buttons on one row",
    signature: "Didone display with faded giant words behind headings and a giant rose close",
  },
});
