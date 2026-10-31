import { defineTemplate } from "@/lib/templates";

// Misty wellness. Pale blue-grey ground, slate-teal accent, light Cormorant display, very soft radii.
export const spaCalm = defineTemplate({
  id: "spa-calm",
  name: "Still",
  look: "calm",
  composition: "tide",
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
    grammar: "pale spatial composition with a circular photographic pool and low serif title",
    nav: "open centered masthead with generous whitespace and compact links",
    hero: "category floats at upper left, circular image at upper right, headline low left and introduction below the image",
    sequence: "circular pool, centered essay, supplied notes, soft offering pools, questions, gallery, folio",
    close: "open pale contact folio",
    signature: "soft rounded offering pools reveal detail while the hero stays open and image-led",
  },
});
