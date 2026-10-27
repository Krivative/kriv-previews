import { defineTemplate } from "@/lib/templates";

// Beach resort. Warm sand ground, ocean blue accent, Prata headings, 16px radii and pill buttons.
export const resortCalm = defineTemplate({
  id: "resort-calm",
  name: "Shore",
  look: "calm",
  composition: "horizon",
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
    grammar: "landscape-led composition with a light caption card rising into its lower edge",
    nav: "spare open horizontal masthead with small serif identity",
    hero: "wide image followed by an overlapping light headline card and a side location label",
    sequence: "landscape and caption, gallery, story spread, horizon offerings, notes, questions, folio",
    close: "open contact folio with ample horizontal space",
    signature: "long horizon-like offering rows beneath a photographic caption-card opening",
  },
});
