import { defineTemplate } from "@/lib/templates";

// Calm, clinical, friendly. White and deep teal, soft serif headlines, pill buttons.
export const dentalClear = defineTemplate({
  id: "dental-clear",
  name: "Clear",
  look: "calm",
  industries: ["dental clinic", "family dentist", "orthodontist", "pediatric dentist"],
  fonts: {
    display: "Fraunces, Georgia, serif",
    body: "Outfit, system-ui, sans-serif",
    accent: "Fraunces, Georgia, serif",
    googleCss:
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Outfit:wght@400;500;600&display=swap",
  },
  style: { numbered: true, motion: true },
  tokens: {
    bg: "#F7FAF9",
    surface: "#FFFFFF",
    ink: "#15201F",
    muted: "#4A5856",
    line: "#D6E2E0",
    accent: "#0E5C57",
    accentInk: "#FFFFFF",
    radius: "20px",
    buttonRadius: "999px",
    displayWeight: "400",
    displayTracking: "-0.02em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "cinematic" },
    { type: "services", variant: "editorial" },
    { type: "about", variant: "cards" },
    { type: "custom", variant: "note" },
    { type: "visit", variant: "split" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "chaptered editorial, alternating white and tinted bands",
    nav: "wordmark left, text links + pill CTA right",
    hero: "cinematic: full-screen bright clinic photo, Fraunces headline with a teal italic accent",
    sequence: "cinematic → numbered service rows → tilted cards → note → visit split → FAQ list → teal band",
    close: "full-width accent band, centred headline, inverted button",
    signature: "ledger-like numbered service rows with fixed name column right after a full-screen hero",
  },
});
