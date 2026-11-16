import type { CSSProperties } from "react";

// One painted scene in six screen shapes (2026-11-16). `base` is the scene's path without ".webp",
// e.g. "/for/scenes/smile-kingdom/02". Files: <base>-{portrait,tablet,desktop,wide,qhd,ultra}.webp,
// with <base>.webp (1600x900) as the fallback. Add the `shaped` class from scene-shapes.module.css:
// CSS picks the one file each screen needs, so a browser loads only that one.
export const sceneShapes = ["portrait", "tablet", "desktop", "wide", "qhd", "ultra"] as const;
export function shapedScene(base: string): CSSProperties {
  const v: Record<string, string> = { "--s-fallback": `url(${base}.webp)` };
  for (const s of sceneShapes) v[`--s-${s}`] = `url(${base}-${s}.webp)`;
  return v as CSSProperties;
}
