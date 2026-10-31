import { defineTemplate } from "@/lib/templates";

// Loud training floor on white. Heavy Archivo Black uppercase, red-orange accent, pill buttons, zero radius elsewhere.
export const gymBold = defineTemplate({
  id: "gym-bold",
  name: "Pulse",
  look: "bold",
  composition: "velocity",
  industries: ["gym", "crossfit box", "boxing and muay thai gym", "HIIT studio", "sports performance"],
  fonts: {
    display: "'Archivo Black', Impact, sans-serif",
    body: "Archivo, system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;700&display=swap",
  },
  tokens: {
    bg: "#FFFFFF",
    surface: "#F3F3F1",
    ink: "#0B0B0B",
    muted: "#55575B",
    line: "#E0E0DC",
    accent: "#FF3B1F",
    accentInk: "#FFFFFF",
    radius: "0px",
    buttonRadius: "999px",
    displayWeight: "400",
    displayTracking: "-0.02em",
    displayCase: "uppercase",
  },
  sections: [
    { type: "hero", variant: "banner" },
    { type: "services", variant: "grid" },
    { type: "custom", variant: "strip" },
    { type: "gallery", variant: "mosaic" },
    { type: "visit", variant: "split" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "statement" },
  ],
  fingerprint: {
    grammar: "dense athletic typography, angled photo crop and a strong route strip",
    nav: "bold utility identity above a thick black rule",
    hero: "heavy title beside an angled photo, joined below by a full-width offering route strip",
    sequence: "angled opening, stepped offering rungs, manifesto, supplied notes, questions, gallery, billboard",
    close: "oversized accent contact billboard",
    signature: "staggered offering rungs reached directly from a factual route strip",
  },
});
