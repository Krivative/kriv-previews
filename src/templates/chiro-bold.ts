import { defineTemplate } from "@/lib/templates";

// Kinetic clinic. Bone white, black type, electric blue, Schibsted Grotesk extra-bold, zero radius.
export const chiroBold = defineTemplate({
  id: "chiro-bold",
  name: "Posture",
  look: "bold",
  industries: ["chiropractic and sports care", "spine and posture clinic", "sports rehab", "mobility studio"],
  fonts: {
    display: "'Schibsted Grotesk', system-ui, sans-serif",
    body: "'Schibsted Grotesk', system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;800&display=swap",
  },
  tokens: {
    bg: "#F1EFEA",
    surface: "#FFFFFF",
    ink: "#111111",
    muted: "#55534E",
    line: "#111111",
    accent: "#1F45FF",
    accentInk: "#FFFFFF",
    radius: "0px",
    buttonRadius: "0px",
    displayWeight: "800",
    displayTracking: "-0.04em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "poster" },
    { type: "services", variant: "columns" },
    { type: "custom", variant: "note" },
    { type: "gallery", variant: "strip" },
    { type: "about", variant: "quote" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "kinetic clinic, bone white, black type and hairlines, electric blue, one extra-bold grotesk, zero radius",
    nav: "extra-bold wordmark, square blue CTA",
    hero: "business name as an extra-bold lowercase-feel poster headline over a wide photo",
    sequence: "poster → treatment columns → note → photo strip → quote → visit card → FAQ columns → band",
    close: "electric blue band, white square buttons",
    signature: "one typeface for everything at two weights; black 1px rules everywhere, blue only on buttons and the band",
  },
});
