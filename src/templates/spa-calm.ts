import { defineTemplate } from "@/lib/templates";

// Misty wellness. Pale blue-grey ground, slate-teal accent, light Cormorant display, very soft radii.
export const spaCalm = defineTemplate({
  id: "spa-calm",
  name: "Still",
  look: "calm",
  industries: ["spa", "massage", "wellness centre", "reflexology", "sauna and hilot"],
  fonts: {
    display: "'Cormorant Garamond', Georgia, serif",
    body: "Jost, system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Jost:wght@400;500;600&display=swap",
  },
  tokens: {
    bg: "#F3F6F7",
    surface: "#E7EEF0",
    ink: "#1F2E33",
    muted: "#5B6E75",
    line: "#D3DDE0",
    accent: "#3E6B73",
    accentInk: "#FFFFFF",
    radius: "24px",
    buttonRadius: "999px",
    displayWeight: "500",
    displayTracking: "0",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "split" },
    { type: "services", variant: "columns" },
    { type: "gallery", variant: "strip" },
    { type: "custom", variant: "note" },
    { type: "visit", variant: "split" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "card" },
  ],
  fingerprint: {
    grammar: "misty wellness editorial, 24px radii, slate-teal on pale blue-grey",
    nav: "light serif wordmark, slate-teal pill CTA",
    hero: "split, photo right with every corner fully rounded",
    sequence: "split → columns → photo strip → note → visit split → FAQ → card",
    close: "bordered card",
    signature: "treatment columns in light serif with no rules, straight into a wide photo strip",
  },
});
