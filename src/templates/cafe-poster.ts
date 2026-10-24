import { defineTemplate } from "@/lib/templates";

// Loud poster typography on bottle green, with a cream menu panel.
export const cafePoster = defineTemplate({
  id: "cafe-poster",
  name: "Poster",
  look: "bold",
  industries: ["café", "coffee shop", "bakery", "milk tea shop"],
  fonts: {
    display: "Anton, Impact, sans-serif",
    body: "'Work Sans', system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Anton&family=Work+Sans:wght@400;500;600&display=swap",
  },
  tokens: {
    bg: "#1F3A2E",
    surface: "#F4F1EA",
    ink: "#F4F1EA",
    muted: "#C9D6CE",
    line: "#3E5A4E",
    accent: "#E4572E",
    accentInk: "#1A120E",
    radius: "4px",
    buttonRadius: "4px",
    displayWeight: "400",
    displayTracking: "-0.01em",
    displayCase: "uppercase",
  },
  sections: [
    { type: "hero", variant: "poster" },
    { type: "services", variant: "menu" },
    { type: "about", variant: "quote" },
    { type: "gallery", variant: "mosaic" },
    { type: "visit", variant: "card" },
    { type: "close", variant: "statement" },
  ],
  fingerprint: {
    grammar: "typographic poster, one colour field",
    nav: "links left, cream CTA right, no wordmark (the hero is the wordmark)",
    hero: "business name as a viewport-wide uppercase poster headline over a wide photo",
    sequence: "poster → menu → quote → mosaic → visit card → statement",
    close: "huge uppercase statement, orange buttons",
    signature: "the name itself is the hero; menu items ruled with 2px lines like a chalkboard",
  },
});
