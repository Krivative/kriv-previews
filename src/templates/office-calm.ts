import { defineTemplate } from "@/lib/templates";

// Quiet professional office. Cream-white, deep navy, EB Garamond headings, 2px radii, no decoration.
export const officeCalm = defineTemplate({
  id: "office-calm",
  name: "Ledger",
  look: "calm",
  composition: "index",
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
    grammar: "asymmetric editorial index, vertical rail, expansive Garamond typography and narrow image caption",
    nav: "persistent left index and business identity; compact horizontal mobile masthead",
    hero: "oversized editorial headline above a narrow offset image and introductory text",
    sequence: "editorial opening → indexed offering ledger → two-column essay → source notes and questions → full-width contact ledger",
    close: "large closing typography above three-column contact facts separated by a hairline",
    signature: "a persistent navigation rail and an editorial document rhythm that stays vertical on touch screens",
  },
});
