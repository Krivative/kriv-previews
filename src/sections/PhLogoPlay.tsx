"use client";

import { useEffect, useRef } from "react";
import p from "./ph-rates.module.css";

// The giant kriv× footer logo as a toy (round 3, Kriv 23 Nov 2026: "not black, play around the logo").
//   repel: the letters lean away from the pointer and the × turns to face it; click the × to spin it.
//   wave:  the letters bob like water, higher near the pointer; click to make them splash in turn.
//   drag:  pick up any letter and throw it; it springs back home. The × spins with the throw.
// Touch: tap a letter to make it jump. Reduced motion: the logo stays still.
export type LogoPlay = "repel" | "wave" | "drag";
const LETTERS = ["k", "r", "i", "v", "×"];
const HINT: Record<LogoPlay, string> = { repel: "Push the logo around", wave: "Make waves · click to splash", drag: "Pick up a letter and throw it" };

type Body = { x: number; y: number; vx: number; vy: number; r: number; vr: number; held: boolean; gx: number; gy: number };

export function PhLogoPlay({ mode }: { mode: LogoPlay }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const box = ref.current;
    if (!box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const host = box.closest("footer") ?? box;
    const els = [...box.querySelectorAll<HTMLElement>("[data-l]")];
    const bodies: Body[] = els.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, held: false, gx: 0, gy: 0 }));
    const last = els.length - 1;
    let px = 0, py = 0, inside = false, lastX = 0, lastY = 0, raf = 0, visible = false;
    const t0 = performance.now();

    const home = (i: number) => {
      const b = els[i].getBoundingClientRect();
      return { cx: b.left + b.width / 2 - bodies[i].x, cy: b.top + b.height / 2 - bodies[i].y, size: b.height };
    };
    const kick = (i: number, power = 1) => { const b = bodies[i]; b.vy -= 26 * power; b.vr += (i === last ? 40 : 8) * power * (Math.random() < 0.5 ? -1 : 1); };

    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      bodies.forEach((b, i) => {
        const { cx, cy, size } = home(i);
        let tx = 0, ty = 0, tr = b.r;
        const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy) || 1;
        if (mode === "repel") {
          const reach = size * 1.3, f = inside ? Math.max(0, 1 - d / reach) : 0;
          tx = (-dx / d) * f * size * 0.2; ty = (-dy / d) * f * size * 0.2;
          if (i === last) {
            const face = inside ? (Math.atan2(dy, dx) * 180) / Math.PI + 45 : 0;
            tr = b.r + ((((face - b.r) % 360) + 540) % 360) - 180;
          } else tr = (dx / d) * f * -7;
        } else if (mode === "wave") {
          const near = inside ? Math.exp(-((dx / (size * 1.4)) ** 2)) : 0;
          ty = Math.sin(t * 2.2 + i * 0.8) * (size * 0.025 + size * 0.14 * near);
          tr = i === last ? b.r + 1.5 : Math.sin(t * 2.2 + i * 0.8 + 1) * (2 + 6 * near);
        } else {
          tr = i === last ? b.r + 0.4 : 0;
        }
        if (b.held) {
          const nx = px - cx - b.gx, ny = py - cy - b.gy;
          b.vx = nx - b.x; b.vy = ny - b.y; b.x = nx; b.y = ny;
          b.r += b.vx * 0.4;
        } else {
          b.vx += (tx - b.x) * 0.07; b.vy += (ty - b.y) * 0.07;
          b.vx *= 0.84; b.vy *= 0.84; b.x += b.vx; b.y += b.vy;
          b.vr += (tr - b.r) * 0.06; b.vr *= 0.82; b.r += b.vr;
        }
        els[i].style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0) rotate(${b.r.toFixed(1)}deg)`;
      });
      if (visible) raf = requestAnimationFrame(frame);
    };

    const move = (e: PointerEvent) => { lastX = px; lastY = py; px = e.clientX; py = e.clientY; inside = true; };
    const leave = () => { inside = false; };
    const down = (e: PointerEvent) => {
      const i = els.indexOf((e.target as HTMLElement).closest("[data-l]") as HTMLElement);
      px = e.clientX; py = e.clientY; inside = true;
      if (i < 0) { if (mode === "wave") els.forEach((_, j) => setTimeout(() => kick(j, 0.8), j * 90)); return; }
      if (e.pointerType === "touch") { kick(i); return; }
      if (mode === "drag") {
        const { cx, cy } = home(i), b = bodies[i];
        b.held = true; b.gx = px - cx - b.x; b.gy = py - cy - b.y;
        els[i].setPointerCapture(e.pointerId);
        e.preventDefault();
      } else if (mode === "repel" && i === last) bodies[i].vr += 60;
      else if (mode === "wave") els.forEach((_, j) => setTimeout(() => kick(j, 0.8), Math.abs(j - i) * 90));
      else kick(i);
    };
    const up = () => bodies.forEach((b) => {
      if (!b.held) return;
      b.held = false; b.vx = (px - lastX) * 0.9; b.vy = (py - lastY) * 0.9; b.vr += b.vx * 2;
    });

    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    box.addEventListener("pointerdown", down);
    addEventListener("pointerup", up);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(frame);
    });
    io.observe(box);
    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave);
      box.removeEventListener("pointerdown", down); removeEventListener("pointerup", up);
    };
  }, [mode]);

  return <>
    <p ref={ref} className={p.play} data-play={mode} aria-hidden="true">
      {LETTERS.map((l, i) => <span key={l} data-l={i} className={i === LETTERS.length - 1 ? p.playX : undefined}>{l}</span>)}
    </p>
    <p className={p.hint} aria-hidden="true">{HINT[mode]}</p>
  </>;
}
