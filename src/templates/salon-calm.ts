import { defineTemplate } from "@/lib/templates";

// Quiet, botanical, spa-adjacent salon. Warm white, sage accent, Marcellus caps-free serif.
export const salonCalm = defineTemplate({
  id: "salon-calm",
  name: "Mane",
  look: "calm",
  industries: ["hair salon", "beauty salon", "nail salon", "brow and lash studio"],
  fonts: {
    display: "Marcellus, Georgia, serif",
    body: "Mulish, system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Marcellus&family=Mulish:wght@400;500;700&display=swap",
  },
  tokens: {
    bg: "#FAF8F3",
    surface: "#F0EDE4",
    ink: "#26302A",
    muted: "#5F6A62",
    line: "#DCD9CE",
    accent: "#5F7A61",
    accentInk: "#FFFFFF",
    radius: "12px",
    buttonRadius: "12px",
    displayWeight: "400",
    displayTracking: "0.01em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "centered" },
    { type: "services", variant: "rows" },
    { type: "custom", variant: "steps" },
    { type: "gallery", variant: "mosaic" },
    { type: "visit", variant: "split" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "card" },
  ],
  fingerprint: {
    grammar: "botanical spa editorial, soft radii, sage on warm white",
    nav: "spaced serif wordmark, sage rounded CTA",
    hero: "centred serif headline with three portrait tiles",
    sequence: "centred → rows → steps → mosaic → visit split → FAQ → card",
    close: "bordered card",
    signature: "a three-step 'how a visit goes' with sage numerals before the gallery",
  },
});
