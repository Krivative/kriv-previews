import { defineTemplate } from "@/lib/templates";

// Quiet professional office. Cream-white, deep navy, EB Garamond headings, 2px radii, no decoration.
export const officeCalm = defineTemplate({
  id: "office-calm",
  name: "Ledger",
  look: "calm",
  industries: ["law office", "accounting firm", "insurance agency", "notary", "real estate broker", "consultancy"],
  fonts: {
    display: "'EB Garamond', Georgia, serif",
    body: "'IBM Plex Sans', system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
  },
  tokens: {
    bg: "#FBFAF7",
    surface: "#F1EFE9",
    ink: "#1C2430",
    muted: "#5D6673",
    line: "#D9D6CE",
    accent: "#1F3A5F",
    accentInk: "#FFFFFF",
    radius: "2px",
    buttonRadius: "2px",
    displayWeight: "500",
    displayTracking: "0",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "split" },
    { type: "services", variant: "rows" },
    { type: "about", variant: "split" },
    { type: "custom", variant: "note" },
    { type: "visit", variant: "split" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "card" },
  ],
  fingerprint: {
    grammar: "quiet professional office, cream-white, deep navy, Garamond headings, 2px radii, nothing decorative",
    nav: "Garamond wordmark, navy rectangular CTA",
    hero: "split, portrait photo right, nearly square corners",
    sequence: "split → practice-area rows → principal's about split → note → visit split → FAQ → card",
    close: "bordered card with navy button",
    signature: "an about split with the principal's portrait directly after the practice-area rows, then a 'what to bring' note",
  },
});
