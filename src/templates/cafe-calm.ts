import { defineTemplate } from "@/lib/templates";

// Latte-coloured, soft, neighbourhood café. Lora serif, Karla body, rounded corners.
export const cafeCalm = defineTemplate({
  id: "cafe-calm",
  name: "Bean",
  look: "calm",
  composition: "roastery",
  industries: ["café", "coffee shop", "bakery", "dessert shop", "tea house"],
  fonts: {
    display: "Lora, Georgia, serif",
    body: "Karla, system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,500&family=Karla:wght@400;500;700&display=swap",
  },
  tokens: {
    bg: "#F5EFE6",
    surface: "#FFFFFF",
    ink: "#3B2E25",
    muted: "#7A6A5E",
    line: "#E3D9CC",
    accent: "#8C5A3C",
    accentInk: "#FFFFFF",
    radius: "16px",
    buttonRadius: "999px",
    displayWeight: "500",
    displayTracking: "-0.015em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "split" },
    { type: "services", variant: "columns" },
    { type: "about", variant: "quote" },
    { type: "gallery", variant: "strip" },
    { type: "custom", variant: "note" },
    { type: "visit", variant: "card" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "warm paper letter with an oval photograph, generous Lora type and a simple asterisk",
    nav: "rounded capsule containing identity and small navigation",
    hero: "large oval photograph on the left beside a personal-sized introductory letter",
    sequence: "oval introduction, reading-width story, folded offerings, notes, gallery, questions, stamp",
    close: "outlined warm contact stamp",
    signature: "folded menu leaves with source-backed offering details, an oval image and a small typographic mark",
  },
});
