import { defineTemplate } from "@/lib/templates";

// Clean workshop. White ground, steel-blue accent, semi-condensed Barlow display, tight 6px radii.
export const autoCalm = defineTemplate({
  id: "auto-calm",
  name: "Workshop",
  look: "calm",
  composition: "blueprint",
  industries: ["auto repair", "car service centre", "tyre and battery shop", "car wash and detailing", "motorcycle shop"],
  fonts: {
    display: "'Barlow Semi Condensed', 'Arial Narrow', sans-serif",
    body: "Inter, system-ui, sans-serif",
    accent: "'Instrument Serif', Georgia, serif",
    googleCss: "https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@600;700&family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap",
  },
  style: { numbered: true, motion: true },
  tokens: {
    bg: "#FFFFFF",
    surface: "#F2F4F7",
    ink: "#16202B",
    muted: "#5A6775",
    line: "#DDE2E8",
    accent: "#2F5D8A",
    accentInk: "#FFFFFF",
    radius: "6px",
    buttonRadius: "6px",
    displayWeight: "600",
    displayTracking: "-0.01em",
    displayCase: "none",
  },
  sections: [
    { type: "hero", variant: "cinematic" },
    { type: "services", variant: "editorial" },
    { type: "custom", variant: "steps" },
    { type: "gallery", variant: "strip" },
    { type: "visit", variant: "card" },
    { type: "faq", variant: "list" },
    { type: "close", variant: "band" },
  ],
  fingerprint: {
    grammar: "technical drawing plate on a light grid with condensed Barlow type and visible ruled framing",
    nav: "boxed utility masthead with uppercase identity",
    hero: "headline beside a measured photographic plate with a ruled edge and factual key",
    sequence: "drawing plate, specification grid, notes, story spread, questions, gallery, ruled close",
    close: "factual contact block on the drawing grid",
    signature: "a connected offering specification grid and framed drawing plate with no fabricated metrics",
  },
});
