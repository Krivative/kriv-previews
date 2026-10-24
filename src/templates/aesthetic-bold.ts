import { defineTemplate } from "@/lib/templates";

// Glossy, nightlife-adjacent. Near-black ground, rose accent, pill everything.
export const aestheticBold = defineTemplate({
  id: "aesthetic-bold",
  name: "Gloss",
  look: "bold",
  industries: ["medical aesthetics", "aesthetic clinic", "lash and brow studio", "nail studio"],
  fonts: {
    display: "'Bricolage Grotesque', system-ui, sans-serif",
    body: "Figtree, system-ui, sans-serif",
    googleCss:
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap",
  },
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
    { type: "hero", variant: "banner" },
    { type: "services", variant: "menu" },
    { type: "custom", variant: "strip" },
    { type: "gallery", variant: "strip" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "dark full-bleed campaign page",
    nav: "wordmark + pill CTA on dark",
    hero: "full-bleed photo field with copy at the bottom edge under a scrim",
    sequence: "banner → menu list → accent strip → photo strip → visit card → FAQ → band",
    close: "rose band with inverted pill button",
    signature: "services as a two-column menu with 2px rules, like a treatment card",
  },
});
