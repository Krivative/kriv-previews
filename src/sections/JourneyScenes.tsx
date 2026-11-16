import w from "./journey-scenes.module.css";

// Painted locations behind a story (preview-only): one scene per chapter, faded in behind the chapter in
// view (keyed on the story's data-step), under a veil in the theme's ground colour so the words stay
// readable. CSS backgrounds, not images: decoration only, no alt text needed and nothing for a reader to miss.
// Sets live in public/scenes/<set>/01.webp ... (generated with Magnific in the page's own palette).
export const sceneSets = { "merchants-road": 10, "smile-kingdom": 8 } as const;
export type SceneSet = keyof typeof sceneSets;

import { shapedScene } from "@/lib/scene-shapes";
import sh from "@/lib/scene-shapes.module.css";

export function JourneyScenes({ set }: { set: SceneSet }) {
  return <div className={w.scenes} aria-hidden="true" data-scenes={set}>
    <div className={w.window}>
      {Array.from({ length: sceneSets[set] }, (_, n) => <div key={n} className={`${w.scene} ${sh.shaped}`} data-scene={n} style={shapedScene(`/for/scenes/${set}/${String(n + 1).padStart(2, "0")}`)} />)}
      <div className={w.veil} />
    </div>
  </div>;
}
