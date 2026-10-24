import { defineTemplate } from "@/lib/templates";

// Warm clinic journal. Cream, charcoal and ochre, Newsreader serif headings, 16px radii, pill buttons.
export const chiroCalm = defineTemplate({
  id: "chiro-calm",
  name: "Align",
  look: "calm",
  industries: ["chiropractor", "chiropractic clinic", "family chiropractic", "sports chiropractic", "physical therapy"],
  fonts: {
    display: "Newsreader, Georgia, serif",
    body: "'Hanken Grotesk', system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Hanken+Grotesk:wght@400;500;600&display=swap",
  },
  tokens: {
    bg: "#FBF8F2",
    surface: "#FFFFFF",
    ink: "#23211D",
    muted: "#5F5A52",
    line: "#E6DFD2",
    accent: "#A86A1C",
    accentInk: "#FFFFFF",
    radius: "16px",
    buttonRadius: "999px",
    displayWeight: "400",
    displayTracking: "-0.015em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "centered" },
    { type: "custom", variant: "steps" },
    { type: "services", variant: "rows" },
    { type: "about", variant: "split" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "warm clinic journal, cream with charcoal and ochre, Newsreader serif, 16px radii, pill buttons",
    nav: "serif wordmark, ochre pill CTA",
    hero: "centred serif headline over three soft-cornered photo tiles",
    sequence: "centred → first-visit steps → treatment rows → doctor about split → visit card → FAQ list → band",
    close: "ochre band",
    signature: "a three-step 'your first visit' sits straight under the hero, before any treatment is listed",
  },
});
