import { defineTemplate } from "@/lib/templates";

// Graphite garage. Near-black ground, signal red accent, Bebas Neue display, zero radius.
export const autoBold = defineTemplate({
  id: "auto-bold",
  name: "Torque",
  look: "bold",
  industries: ["performance garage", "detailing studio", "tyre centre", "motorcycle customs", "car audio and tint"],
  fonts: {
    display: "'Bebas Neue', Impact, sans-serif",
    body: "Roboto, system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto:wght@400;500;700&display=swap",
  },
  tokens: {
    bg: "#111214",
    surface: "#1B1D21",
    ink: "#F4F4F2",
    muted: "#A3A6AC",
    line: "#2B2E34",
    accent: "#D7263D",
    accentInk: "#FFFFFF",
    radius: "0px",
    buttonRadius: "0px",
    displayWeight: "400",
    displayTracking: "0.02em",
    displayCase: "uppercase",
  },
  sections: [
    { type: "hero", variant: "poster" },
    { type: "custom", variant: "steps" },
    { type: "services", variant: "grid" },
    { type: "gallery", variant: "strip" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "statement" },
  ],
  fingerprint: {
    grammar: "graphite garage, signal red, tall Bebas uppercase, zero radius",
    nav: "tall uppercase wordmark, square red CTA",
    hero: "business name as a tall uppercase poster over a wide photo",
    sequence: "poster → steps → service grid → photo strip → visit card → FAQ columns → statement",
    close: "giant uppercase statement with red button",
    signature: "the how-it-works steps come BEFORE the services, in red numerals, right under the poster",
  },
});
