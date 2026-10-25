import { defineTemplate } from "@/lib/templates";

// Work-truck plumber. Graphite, safety-yellow accent, heavy Archivo headings, square corners.
export const plumbingBold = defineTemplate({
  id: "plumbing-bold",
  name: "Pressure",
  look: "bold",
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
    grammar: "work-truck plumber, graphite, safety-yellow accent, uppercase heavy Archivo, square corners",
    nav: "uppercase heavy wordmark, yellow square CTA",
    hero: "poster: huge uppercase Archivo headline with a yellow italic serif accent word, then a wide square photo",
    sequence: "poster → yellow contact strip → service tiles → photo strip → tilted cards → visit card → FAQ list → giant yellow close",
    close: "giant accent band with oversized display type, sub and buttons on one row",
    signature: "uppercase heavy type broken by one italic serif word, faded giant words, square corners, giant yellow close",
  },
});
