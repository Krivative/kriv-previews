import { defineTemplate } from "@/lib/templates";

// Night-shift contractor. Deep navy, amber heat accent, heavy Sora headings, 8px radii, pill buttons.
export const hvacBold = defineTemplate({
  id: "hvac-bold",
  name: "Thermal",
  look: "bold",
  industries: ["HVAC company", "emergency heating and cooling", "commercial HVAC", "ductwork and ventilation", "refrigeration"],
  fonts: {
    display: "Sora, system-ui, sans-serif",
    body: "Rubik, system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Rubik:wght@400;500&display=swap",
  },
  tokens: {
    bg: "#0E1A2B",
    surface: "#16253A",
    ink: "#F1F5FA",
    muted: "#A9B6C7",
    line: "#253650",
    accent: "#FFB020",
    accentInk: "#0E1A2B",
    radius: "8px",
    buttonRadius: "999px",
    displayWeight: "800",
    displayTracking: "-0.03em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "stacked" },
    { type: "custom", variant: "strip" },
    { type: "services", variant: "tiles" },
    { type: "about", variant: "quote" },
    { type: "gallery", variant: "mosaic" },
    { type: "visit", variant: "split" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "statement" },
  ],
  fingerprint: {
    grammar: "night-shift contractor, deep navy, amber heat accent, heavy tight Sora, 8px radii with pill buttons",
    nav: "heavy sans wordmark, amber pill CTA",
    hero: "stacked on navy: heavy headline, wide photo, then sub + amber pill buttons",
    sequence: "stacked → amber emergency strip → service tiles → quote → mosaic → visit split → FAQ list → statement",
    close: "large heavy statement with amber pill",
    signature: "an amber 24/7 strip directly under the hero photo, then tiles with every third filled amber",
  },
});
