import { defineTemplate } from "@/lib/templates";

// White, graphic, fashion-forward. Black type, lime accent, Unbounded display.
export const salonBold = defineTemplate({
  id: "salon-bold",
  name: "Studio",
  look: "bold",
  composition: "runway",
  industries: ["hair studio", "barbershop", "colour bar", "nail art studio"],
  fonts: {
    display: "Unbounded, system-ui, sans-serif",
    body: "'Space Grotesk', system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700&family=Space+Grotesk:wght@400;500;700&display=swap",
  },
  tokens: {
    bg: "#FFFFFF",
    surface: "#F2F2F0",
    ink: "#111111",
    muted: "#5A5A5A",
    line: "#111111",
    accent: "#C6F432",
    accentInk: "#111111",
    radius: "0px",
    buttonRadius: "0px",
    displayWeight: "700",
    displayTracking: "-0.04em",
    displayCase: "uppercase",
  },
  sections: [
    { type: "hero", variant: "poster" },
    { type: "services", variant: "tiles" },
    { type: "gallery", variant: "mosaic" },
    { type: "custom", variant: "strip" },
    { type: "visit", variant: "card" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "fashion contact sheet, heavy Unbounded typography, lime and exact black rules",
    nav: "small uppercase identity within a pair of strong horizontal rules",
    hero: "huge headline above a thin image strip flanked by actions and an editorial caption",
    sequence: "fashion opening, gallery, offering lookbook, manifesto, supplied notes, questions, billboard",
    close: "large lime contact billboard",
    signature: "numbered lookbook rows turn into lime detail panels beneath a three-part contact sheet",
  },
});
