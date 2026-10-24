import { defineTemplate } from "@/lib/templates";

// Airy home-services page. White and ice blue, cool blue accent, Lexend headings, 12px radii.
export const hvacCalm = defineTemplate({
  id: "hvac-calm",
  name: "Breeze",
  look: "calm",
  industries: ["HVAC contractor", "heating and air conditioning", "furnace repair", "heat pump installer", "indoor air quality"],
  fonts: {
    display: "Lexend, system-ui, sans-serif",
    body: "'Public Sans', system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Lexend:wght@500;600&family=Public+Sans:wght@400;500;600&display=swap",
  },
  tokens: {
    bg: "#F4F8FB",
    surface: "#FFFFFF",
    ink: "#0F2030",
    muted: "#4A5C6C",
    line: "#D5E2EC",
    accent: "#1C6BB0",
    accentInk: "#FFFFFF",
    radius: "12px",
    buttonRadius: "10px",
    displayWeight: "600",
    displayTracking: "-0.025em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "split" },
    { type: "custom", variant: "strip" },
    { type: "services", variant: "grid" },
    { type: "about", variant: "split" },
    { type: "visit", variant: "split" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "card" },
  ],
  fingerprint: {
    grammar: "airy home-services page, white and ice blue, cool blue accent, rounded geometric sans (Lexend), 12px radii",
    nav: "geometric sans wordmark, blue soft-square CTA",
    hero: "split: copy left, photo right, 12px corners, call button first",
    sequence: "split → service-area strip → service grid → owner about split → visit split → FAQ columns → card",
    close: "bordered card with blue button",
    signature: "a blue full-width strip with service area and emergency hours right under the hero, before the services",
  },
});
