import { defineTemplate } from "@/lib/templates";

// Graphite garage. Near-black ground, signal red accent, Bebas Neue display, zero radius.
export const autoBold = defineTemplate({
  id: "auto-bold",
  name: "Torque",
  look: "bold",
  composition: "stage",
  industries: ["performance garage", "detailing studio", "tyre centre", "motorcycle customs", "car audio and tint"],
  fonts: {
    display: "'Bebas Neue', Impact, sans-serif",
    body: "Roboto, system-ui, sans-serif",
    accent: "'Instrument Serif', Georgia, serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto:wght@400;500;700&family=Instrument+Serif:ital@0;1&display=swap",
  },
  style: { numbered: true, motion: true, ghost: true },
  tokens: {
    bg: "#111214",
    surface: "#1B1D21",
    ink: "#F4F4F2",
    muted: "#A3A6AC",
    line: "#2B2E34",
    accent: "#D7263D",
    accentInk: "#FFFFFF",
    radius: "0px",
    buttonRadius: "0px",
    displayWeight: "400",
    displayTracking: "0.02em",
    displayCase: "uppercase",
  },
  sections: [
    { type: "hero", variant: "cinematic" },
    { type: "custom", variant: "steps" },
    { type: "services", variant: "grid" },
    { type: "gallery", variant: "strip" },
    { type: "about", variant: "cards" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "giant" },
  ],
  fingerprint: {
    grammar: "graphic publication masthead, graphite framed stage, offset contents ticket and tall display typography",
    nav: "small tracked identity and a native contents drawer on desktop and mobile",
    hero: "large typographic masthead above a framed image stage with an offset contents ticket",
    sequence: "graphic masthead and framed stage → compact source notes → large expandable offering index → asymmetric introduction → ruled contact spread",
    close: "contact spread beneath a thin signal-red rule with factual information alongside the headline",
    signature: "a framed photographic stage and offset contents ticket, followed by a large typographic offering index",
  },
});
