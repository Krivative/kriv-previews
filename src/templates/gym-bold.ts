import { defineTemplate } from "@/lib/templates";

// Loud training floor on white. Heavy Archivo Black uppercase, red-orange accent, pill buttons, zero radius elsewhere.
export const gymBold = defineTemplate({
  id: "gym-bold",
  name: "Pulse",
  look: "bold",
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
    grammar: "white training floor, heavy black uppercase grotesk, red-orange, pill buttons on square cards",
    nav: "heavy uppercase wordmark, red-orange pill CTA",
    hero: "full-bleed photo banner, heavy uppercase copy at the bottom edge",
    sequence: "banner → programme grid → red strip → mosaic → visit split → FAQ → statement",
    close: "giant uppercase statement, red-orange pill",
    signature: "a red-orange full-width strip for the trial offer right under the programme grid",
  },
});
