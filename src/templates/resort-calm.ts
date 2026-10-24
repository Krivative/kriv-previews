import { defineTemplate } from "@/lib/templates";

// Beach resort. Warm sand ground, ocean blue accent, Prata headings, 16px radii and pill buttons.
export const resortCalm = defineTemplate({
  id: "resort-calm",
  name: "Shore",
  look: "calm",
  industries: ["beach resort", "boutique hotel", "private pool villa", "bed and breakfast", "dive resort"],
  fonts: {
    display: "Prata, Georgia, serif",
    body: "Raleway, system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Prata&family=Raleway:wght@400;500;600&display=swap",
  },
  tokens: {
    bg: "#FBF7EF",
    surface: "#F2EBDD",
    ink: "#223038",
    muted: "#5F6B72",
    line: "#E2D9C8",
    accent: "#1E6F9F",
    accentInk: "#FFFFFF",
    radius: "16px",
    buttonRadius: "999px",
    displayWeight: "400",
    displayTracking: "0",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "banner" },
    { type: "services", variant: "grid" },
    { type: "gallery", variant: "mosaic" },
    { type: "about", variant: "quote" },
    { type: "custom", variant: "steps" },
    { type: "visit", variant: "split" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "beach resort, warm sand, ocean blue, Prata serif, rounded cards and pill buttons",
    nav: "serif wordmark, ocean-blue pill CTA",
    hero: "full-bleed photo banner with serif copy at the bottom, on a light page",
    sequence: "banner → room grid → mosaic → quote → booking steps → visit split → FAQ → band",
    close: "ocean-blue band",
    signature: "the gallery mosaic comes right after the rooms, before any words about the place; three-step 'how to book'",
  },
});
