import { defineTemplate } from "@/lib/templates";

// Airy home-services page. White and ice blue, cool blue accent, Lexend headings, 12px radii.
export const hvacCalm = defineTemplate({
  id: "hvac-calm",
  name: "Breeze",
  look: "calm",
  composition: "air",
  industries: ["HVAC contractor", "heating and air conditioning", "furnace repair", "heat pump installer", "indoor air quality"],
  fonts: {
    display: "Lexend, system-ui, sans-serif",
    body: "'Public Sans', system-ui, sans-serif",
    accent: "'Instrument Serif', Georgia, serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Lexend:wght@500;600&family=Public+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap",
  },
  style: { numbered: true, motion: true },
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
    { type: "hero", variant: "cinematic" },
    { type: "custom", variant: "strip" },
    { type: "services", variant: "explorer" },
    { type: "about", variant: "cards" },
    { type: "visit", variant: "split" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "giant" },
  ],
  fingerprint: {
    grammar: "airy three-column wayfinding with a soft photo window and rounded geometric Lexend type",
    nav: "quiet horizontal masthead with a restrained sans-serif identity",
    hero: "introduction, arched photograph and real offering index stand in three separate columns",
    sequence: "wayfinding opening, supplied notes, offering paths, questions, story spread, gallery, folio",
    close: "clear two-column contact folio",
    signature: "sticky offering orientation beside soft detail paths, reached from the hero content index",
  },
});
