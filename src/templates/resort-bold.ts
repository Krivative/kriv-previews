import { defineTemplate } from "@/lib/templates";

// Fiesta venue. Deep jungle green, mango accent, Abril Fatface headings, generous radii.
export const resortBold = defineTemplate({
  id: "resort-bold",
  name: "Fiesta",
  look: "bold",
  industries: ["events venue", "garden wedding venue", "resort with function halls", "party place", "mountain resort"],
  fonts: {
    display: "'Abril Fatface', Georgia, serif",
    body: "Poppins, system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Poppins:wght@400;500;600&display=swap",
  },
  tokens: {
    bg: "#0B3D3A",
    surface: "#114944",
    ink: "#FDF6E3",
    muted: "#BFCFC8",
    line: "#1E5A54",
    accent: "#F2B134",
    accentInk: "#0B3D3A",
    radius: "20px",
    buttonRadius: "999px",
    displayWeight: "400",
    displayTracking: "0",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "stacked" },
    { type: "services", variant: "tiles" },
    { type: "gallery", variant: "mosaic" },
    { type: "custom", variant: "strip" },
    { type: "visit", variant: "split" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "deep jungle green with mango, fat display serif, 20px radii, pill buttons",
    nav: "fat serif wordmark, mango pill CTA",
    hero: "stacked on dark green: fat serif headline, wide rounded photo, then sub + buttons",
    sequence: "stacked → package tiles → mosaic → mango strip → visit split → FAQ columns → band",
    close: "mango band with green buttons",
    signature: "rounded package tiles with every third filled mango, straight into a rounded mosaic",
  },
});
