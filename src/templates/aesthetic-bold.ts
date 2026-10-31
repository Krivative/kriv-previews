import { defineTemplate } from "@/lib/templates";

// Glossy, nightlife-adjacent. Near-black ground, rose accent, pill everything.
export const aestheticBold = defineTemplate({
  id: "aesthetic-bold",
  name: "Gloss",
  look: "bold",
  composition: "nocturne",
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
    grammar: "dark fashion editorial with a narrow image, vertical spine and overlapping Bodoni headline",
    nav: "tracked uppercase identity with a native contents drawer at every width",
    hero: "oversized serif type crosses the edge of a narrow portrait, with a marginal category spine",
    sequence: "portrait interruption, letter, curtain offerings, gallery, notes, questions, closing letter",
    close: "centered closing letter with a ruled factual footer",
    signature: "two tall offering curtains open beneath the fashion portrait without a repeated photo strip",
  },
});
