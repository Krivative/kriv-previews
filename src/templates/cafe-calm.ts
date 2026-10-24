import { defineTemplate } from "@/lib/templates";

// Latte-coloured, soft, neighbourhood café. Lora serif, Karla body, rounded corners.
export const cafeCalm = defineTemplate({
  id: "cafe-calm",
  name: "Bean",
  look: "calm",
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
    grammar: "soft rounded storefront page, latte palette",
    nav: "serif wordmark, pill CTA in coffee brown",
    hero: "split with photo right (rounded, arch corner)",
    sequence: "split → columns → quote → photo strip → note → visit card → band",
    close: "brown band",
    signature: "menu set as serif columns, no rules, reading like a handwritten board",
  },
});
