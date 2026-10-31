import { defineTemplate } from "@/lib/templates";

// Quiet, warm, editorial. Blush ivory ground, terracotta accent, high-contrast serif.
export const aestheticCalm = defineTemplate({
  id: "aesthetic-calm",
  name: "Linen",
  look: "calm",
  composition: "canvas",
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
    accent: "#775340",
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
    { type: "gallery", variant: "editorial" },
    { type: "custom", variant: "note" },
    { type: "visit", variant: "split" },
    { type: "close", variant: "giant" },
  ],
  fingerprint: {
    grammar: "continuous photographic canvas with floating opaque paper, restrained serif and warm brown ink",
    nav: "floating cream navigation sheet over one continuous scene; compact native mobile menu",
    hero: "left-aligned serif introduction and narrow actions within a single photographic scene",
    sequence: "scene introduction → offset paper essay → paper offering explorer → quiet details and questions → contact folio",
    close: "two-column contact folio on a quiet paper surface, followed by credited footer",
    signature: "one credited photograph carries the scene while separate paper panels reveal the supplied business information",
  },
});
