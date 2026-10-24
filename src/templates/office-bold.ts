import { defineTemplate } from "@/lib/templates";

// Confident firm. Deep forest ground, bone accent, Playfair Display headings, zero radius.
export const officeBold = defineTemplate({
  id: "office-bold",
  name: "Counsel",
  look: "bold",
  industries: ["law firm", "financial advisory", "architecture studio", "engineering consultancy", "corporate services"],
  fonts: {
    display: "'Playfair Display', Georgia, serif",
    body: "Lato, system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Lato:wght@400;700&display=swap",
  },
  tokens: {
    bg: "#0F1F1A",
    surface: "#172A24",
    ink: "#F4EFE4",
    muted: "#A9B3AC",
    line: "#2A3C35",
    accent: "#EDE6D6",
    accentInk: "#0F1F1A",
    radius: "0px",
    buttonRadius: "0px",
    displayWeight: "700",
    displayTracking: "-0.01em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "stacked" },
    { type: "services", variant: "columns" },
    { type: "custom", variant: "steps" },
    { type: "about", variant: "quote" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "card" },
  ],
  fingerprint: {
    grammar: "deep forest green, bone type and buttons, bold Playfair headings, zero radius",
    nav: "bold serif wordmark, bone square CTA",
    hero: "stacked on dark: bold serif headline, wide photo, then sub + buttons",
    sequence: "stacked → practice columns → steps → quote → visit card → FAQ columns → card",
    close: "bordered card on dark, bone button",
    signature: "bone-coloured buttons and numerals as the only accent on forest green; a three-step 'how we work'",
  },
});
