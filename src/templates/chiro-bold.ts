import { defineTemplate } from "@/lib/templates";

// Kinetic clinic. Bone white, black type, electric blue, Schibsted Grotesk extra-bold, zero radius.
export const chiroBold = defineTemplate({
  id: "chiro-bold",
  name: "Posture",
  look: "bold",
  composition: "axis",
  industries: ["chiropractic and sports care", "spine and posture clinic", "sports rehab", "mobility studio"],
  fonts: {
    display: "'Schibsted Grotesk', system-ui, sans-serif",
    body: "'Schibsted Grotesk', system-ui, sans-serif",
    accent: "'Instrument Serif', Georgia, serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;800&family=Instrument+Serif:ital@0;1&display=swap",
  },
  style: { numbered: true, motion: true, ghost: true },
  tokens: {
    bg: "#F1EFEA",
    surface: "#FFFFFF",
    ink: "#111111",
    muted: "#55534E",
    line: "#111111",
    accent: "#1F45FF",
    accentInk: "#FFFFFF",
    radius: "0px",
    buttonRadius: "0px",
    displayWeight: "800",
    displayTracking: "-0.04em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "poster" },
    { type: "services", variant: "editorial" },
    { type: "custom", variant: "note" },
    { type: "gallery", variant: "strip" },
    { type: "about", variant: "cards" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "giant" },
  ],
  fingerprint: {
    grammar: "asymmetric portrait and heavy grotesk type aligned to an electric-blue vertical rule",
    nav: "bold identity and links above a double-weight baseline",
    hero: "narrow portrait to the left of a wide headline aligned against a coloured vertical axis",
    sequence: "portrait axis, manifesto, connected offering rows, gallery, supplied notes, questions, ruled close",
    close: "contact spread aligned to an accent baseline",
    signature: "connected offering tracks reveal detail beneath an asymmetric typographic axis",
  },
});
