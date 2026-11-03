import type { SiteData } from "@/lib/site-schema";

export type SlotPhoto = { src: string; label: string };

// Kriv, 2026-11-03: a page must never show the same photo twice. The hero takes the first
// photo, the story gets its own photo once there are enough, and the gallery shows only
// what is left (and only when at least two remain).
export function photoSlots(site: SiteData) {
  const labels = site.gallery?.labels ?? [];
  const seen = new Set<string>();
  const unique: SlotPhoto[] = [];
  site.brand.photos.forEach((src, i) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    unique.push({ src, label: labels[i] ?? "Illustrative photography" });
  });
  const story = unique.length >= 4 ? unique[1] : undefined;
  const rest = unique.slice(story ? 2 : 1);
  // afterHero: section-list designs, whose gallery labels describe the tiles after the hero.
  return { hero: unique[0], story, gallery: rest.length >= 2 ? rest : [], afterHero: unique.slice(1).map((p) => p.src) };
}
