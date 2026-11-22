"use client";

import { useEffect, useRef } from "react";

// Living water for the /ph-rates hero (reference: a water-surface hero Kriv shared on 22 Nov 2026).
// Drawn in code at low resolution and scaled up: light caustics, plus a ripple wherever the pointer touches.
// Still frame with reduced motion; pauses when off screen.
type Palette = { deep: [number, number, number]; mid: [number, number, number]; light: [number, number, number] };
const PALETTES: Record<string, Palette> = {
  dark: { deep: [9, 15, 24], mid: [28, 62, 112], light: [136, 186, 250] },
  light: { deep: [30, 104, 214], mid: [74, 150, 238], light: [236, 246, 255] },
  // Pale enough that ink text stays readable over it (seed 204, under the paper veil).
  tide: { deep: [96, 150, 226], mid: [150, 195, 245], light: [246, 251, 255] },
};

export function PhSea({ tone, className }: { tone: "dark" | "light" | "tide"; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const W = 160, H = 96;
    el.width = W; el.height = H;
    const img = ctx.createImageData(W, H);
    const pal = PALETTES[tone];
    const ripples: { x: number; y: number; t: number }[] = [];
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0, visible = true, t = 0, last = performance.now();

    function draw() {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let v = Math.sin(x * 0.075 + t) + Math.sin(y * 0.11 - t * 0.8) + Math.sin((x + y) * 0.055 + t * 0.6) + Math.sin(Math.hypot(x - W * 0.7, y - H * 0.3) * 0.12 - t * 1.1);
        for (const r of ripples) { const d = Math.hypot(x - r.x, y - r.y), age = t - r.t, front = age * 26; v += Math.sin((d - front) * 0.6) * Math.max(0, 1 - Math.abs(d - front) / 10) * Math.max(0, 1 - age / 2.4) * 2.2; }
        const caustic = Math.pow(1 - Math.abs(Math.sin(v * 1.35)), 7);
        const depth = 0.5 + 0.5 * Math.sin(y * 0.03 + x * 0.012 + t * 0.2);
        const i = (y * W + x) * 4;
        for (let c = 0; c < 3; c++) img.data[i + c] = pal.deep[c] + (pal.mid[c] - pal.deep[c]) * depth + (pal.light[c] - pal.mid[c]) * caustic;
        img.data[i + 3] = 255;
      }
      ctx!.putImageData(img, 0, 0);
    }
    function tick(now: number) {
      t += Math.min(0.05, (now - last) / 1000) * 0.9; last = now;
      while (ripples.length && t - ripples[0].t > 2.4) ripples.shift();
      draw();
      if (visible) frame = requestAnimationFrame(tick);
    }
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !still) { last = performance.now(); cancelAnimationFrame(frame); frame = requestAnimationFrame(tick); } });
    io.observe(el);
    let lastDrop = 0;
    const host = (el.closest("section") ?? el.parentElement)!;
    function drop(e: PointerEvent) {
      if (still || performance.now() - lastDrop < 140 || ripples.length > 5) return;
      lastDrop = performance.now();
      const box = el!.getBoundingClientRect();
      ripples.push({ x: ((e.clientX - box.left) / box.width) * W, y: ((e.clientY - box.top) / box.height) * H, t });
    }
    host.addEventListener("pointermove", drop);
    host.addEventListener("pointerdown", drop);
    draw();
    return () => { cancelAnimationFrame(frame); io.disconnect(); host.removeEventListener("pointermove", drop); host.removeEventListener("pointerdown", drop); };
  }, [tone]);
  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
