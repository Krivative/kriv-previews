import { defineTemplate } from "@/lib/templates";

// Work-truck plumber. Graphite, safety-yellow accent, heavy Archivo headings, square corners.
export const plumbingBold = defineTemplate({
  id: "plumbing-bold",
  name: "Pressure",
  look: "bold",
  composition: "dispatch",
  industries: ["plumbing company", "emergency plumber", "sewer and drain", "commercial plumbing", "gas line repair"],
  fonts: {
    display: "Archivo, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
    accent: "'Instrument Serif', Georgia, serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Archivo:wght@800;900&family=Inter:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap",
  },
  style: { numbered: true, motion: true, ghost: true },
  tokens: {
    bg: "#16191C",
    surface: "#20252A",
    ink: "#F4F5F2",
    muted: "#AEB4B8",
    line: "#30373E",
    accent: "#F5D90A",
    accentInk: "#16191C",
    radius: "2px",
    buttonRadius: "2px",
    displayWeight: "900",
    displayTracking: "-0.02em",
    displayCase: "uppercase",
  },
  sections: [
    { type: "hero", variant: "poster" },
    { type: "custom", variant: "strip" },
    { type: "services", variant: "tiles" },
    { type: "gallery", variant: "strip" },
    { type: "about", variant: "cards" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "giant" },
  ],
  fingerprint: {
    grammar: "oversized yellow ticket, graphite image evidence column and perforated rules",
    nav: "bold utility identity above a dashed horizontal rule",
    hero: "large headline on a perforated colour ticket beside a framed photo and concise content index",
    sequence: "ticket opening, supplied notes, perforated offerings, story spread, gallery, questions, billboard",
    close: "strong yellow contact billboard",
    signature: "perforated offering tickets open beneath a large message ticket and factual image index",
  },
});
