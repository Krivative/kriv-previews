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
    googleCss: "https://fonts.googleapis.com/css2?family=Archivo:wght@800;900&family=Inter:wght@400;500&display=swap",
  },
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
    { type: "about", variant: "quote" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "work-truck plumber, graphite, safety-yellow accent, uppercase heavy Archivo, square corners",
    nav: "uppercase heavy wordmark, yellow square CTA",
    hero: "poster: huge uppercase headline on graphite, then a wide square-cornered photo",
    sequence: "poster → yellow contact strip → service tiles → photo strip → quote → visit card → FAQ list → band",
    close: "yellow band with graphite text",
    signature: "uppercase poster hero with square yellow buttons and a yellow strip right under it; no rounded corners anywhere",
  },
});
