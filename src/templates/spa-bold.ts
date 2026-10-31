import { defineTemplate } from "@/lib/templates";

// Night-spa luxury. Near-black plum ground, brushed-gold accent, thin uppercase Italiana display.
export const spaBold = defineTemplate({
  id: "spa-bold",
  name: "Onyx",
  look: "bold",
  composition: "vault",
  industries: ["luxury spa", "hotel spa", "men's grooming lounge", "massage and sauna", "wellness club"],
  fonts: {
    display: "Italiana, 'Times New Roman', serif",
    body: "'Nunito Sans', system-ui, sans-serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Italiana&family=Nunito+Sans:wght@400;600;700&display=swap",
  },
  tokens: {
    bg: "#14121A",
    surface: "#1E1B26",
    ink: "#F2EEE6",
    muted: "#A9A39A",
    line: "#2E2A38",
    accent: "#C9A66B",
    accentInk: "#14121A",
    radius: "0px",
    buttonRadius: "0px",
    displayWeight: "400",
    displayTracking: "0.08em",
    displayCase: "uppercase",
  },
  sections: [
    { type: "hero", variant: "centered" },
    { type: "services", variant: "menu" },
    { type: "custom", variant: "strip" },
    { type: "gallery", variant: "mosaic" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "columns" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "dark ceremonial doorway, gold hairlines and spaced Italiana capitals",
    nav: "centered uppercase identity above a fine uppercase link row",
    hero: "arched central doorway with marginal roman marker and location, title underneath",
    sequence: "doorway, arched offering vaults, letter, supplied notes, gallery, questions, stamp",
    close: "gold double-outline contact stamp",
    signature: "arched offering vaults open individually beneath a central photographic doorway",
  },
});
