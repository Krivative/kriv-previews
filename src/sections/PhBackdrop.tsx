"use client";

import { useEffect, useRef } from "react";
import { PhSea } from "./PhSea";
import p from "./ph-rates.module.css";

// Hero backgrounds for the statement hero (round 2 of the /ph-rates randomizer, 23 Nov 2026).
// All drawn in code: no images, no external assets. Each one reacts to the pointer, drifts on its own on
// phones, draws a single still frame with reduced motion, and pauses when the hero is off screen.
export type BackdropKind = "veil" | "contour" | "halftone";

type Pointer = { x: number; y: number; on: boolean; at: number };

function trackPointer(el: HTMLElement) {
  const host = (el.closest("section") ?? el.parentElement)!;
  const ptr: Pointer = { x: 0, y: 0, on: false, at: 0 };
  const move = (e: PointerEvent) => {
    const b = el.getBoundingClientRect();
    ptr.x = e.clientX - b.left; ptr.y = e.clientY - b.top; ptr.on = true; ptr.at = performance.now();
  };
  const leave = () => { ptr.on = false; };
  host.addEventListener("pointermove", move);
  host.addEventListener("pointerdown", move);
  host.addEventListener("pointerleave", leave);
  return { ptr, stop: () => { host.removeEventListener("pointermove", move); host.removeEventListener("pointerdown", move); host.removeEventListener("pointerleave", leave); } };
}

// Runs draw(t) every frame while visible; one frame only with reduced motion. Returns [stop, redraw].
function animate(el: Element, draw: (t: number) => void) {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0, visible = true, t = 0, last = performance.now();
  const tick = (now: number) => {
    t += Math.min(0.05, (now - last) / 1000); last = now;
    draw(t);
    if (visible) raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !still) { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(tick); }
  });
  draw(still ? 99 : 0);
  if (!still) io.observe(el);
  return [() => { cancelAnimationFrame(raf); io.disconnect(); }, () => draw(still ? 99 : t)] as const;
}

function token(el: Element, name: string, fallback: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

// 204: paper laid over a living sea. The pointer lifts a soft hole in the paper; on phones it drifts by itself.
function Veil() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { ptr, stop } = trackPointer(el);
    let x = 0.5, y = 0.42;
    const [end] = animate(el, (t) => {
      const idle = !ptr.on || performance.now() - ptr.at > 2500;
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      const tx = idle ? 0.5 + 0.34 * Math.sin(t * 0.21) : ptr.x / w;
      const box = el.getBoundingClientRect(), view = Math.min(1, innerHeight / h);
      const mid = Math.min(1, Math.max(0, (innerHeight / 2 - box.top) / h)); // centre of what is on screen
      const ty = idle ? mid + 0.26 * view * Math.sin(t * 0.29 + 1) : ptr.y / h;
      x += (tx - x) * 0.07; y += (ty - y) * 0.07;
      el.style.setProperty("--mx", `${(x * 100).toFixed(2)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(2)}%`);
    });
    return () => { end(); stop(); };
  }, []);
  return <div ref={ref} className={p.veil} aria-hidden="true" />;
}

// 205: sea-chart contour lines (marching squares over a slow wave field) that swell around the pointer.
function Contour() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const { ptr, stop } = trackPointer(el);
    const ink = token(el, "--ink", "#101112"), care = token(el, "--care", "#4d8be0");
    const cell = 14;
    let W = 0, H = 0, dpr = 1, vals = new Float32Array(0), bx = -1, by = -1, bs = 0.8, lastT = -1;
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = el.clientWidth; H = el.clientHeight; el.width = Math.round(W * dpr); el.height = Math.round(H * dpr); lastT = -1; };
    size();
    const draw = (t: number) => {
      if (lastT >= 0 && t - lastT < 1 / 40) return; // about 40 frames a second is plenty for drifting lines
      lastT = t;
      const cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
      if (vals.length !== cols * rows) vals = new Float32Array(cols * rows);
      const tx = ptr.on ? ptr.x : W * (0.5 + 0.34 * Math.sin(t * 0.17));
      const ty = ptr.on ? ptr.y : H * (0.55 + 0.28 * Math.sin(t * 0.13 + 2));
      if (bx < 0) { bx = tx; by = ty; }
      bx += (tx - bx) * 0.08; by += (ty - by) * 0.08; bs += ((ptr.on ? 1.7 : 0.8) - bs) * 0.05;
      const sig = Math.max(110, Math.min(W, H) * 0.2), s2 = 2 * sig * sig;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const x = i * cell, y = j * cell, dx = x - bx, dy = y - by;
        vals[j * cols + i] = Math.sin(x * 0.0042 + t * 0.12) + Math.sin(y * 0.0061 - t * 0.09 + x * 0.0017)
          + 0.7 * Math.sin((x * 0.6 - y) * 0.0035 + t * 0.07) + bs * Math.exp(-(dx * dx + dy * dy) / s2);
      }
      const minor = new Path2D(), major = new Path2D();
      for (let k = 0; k < 22; k++) {
        const lv = -2.75 + k * 0.25, path = k % 4 === 0 ? major : minor;
        for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
          const a = vals[j * cols + i] - lv, b = vals[j * cols + i + 1] - lv, c = vals[(j + 1) * cols + i + 1] - lv, d = vals[(j + 1) * cols + i] - lv;
          const A = a > 0, B = b > 0, C = c > 0, D = d > 0;
          if (A === B && B === C && C === D) continue;
          const x = i * cell, y = j * cell, pts: number[] = [];
          if (A !== B) pts.push(x + (cell * a) / (a - b), y);
          if (B !== C) pts.push(x + cell, y + (cell * b) / (b - c));
          if (D !== C) pts.push(x + (cell * d) / (d - c), y + cell);
          if (A !== D) pts.push(x, y + (cell * a) / (a - d));
          path.moveTo(pts[0], pts[1]); path.lineTo(pts[2], pts[3]);
          if (pts.length === 8) { path.moveTo(pts[4], pts[5]); path.lineTo(pts[6], pts[7]); }
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1; ctx.strokeStyle = ink; ctx.globalAlpha = 0.13; ctx.stroke(minor);
      ctx.lineWidth = 1.3; ctx.strokeStyle = care; ctx.globalAlpha = 0.55; ctx.stroke(major);
      ctx.globalAlpha = 1;
    };
    const [end, redraw] = animate(el, draw);
    const ro = new ResizeObserver(() => { size(); redraw(); });
    ro.observe(el);
    return () => { end(); ro.disconnect(); stop(); };
  }, []);
  return <canvas ref={ref} className={p.backdrop} aria-hidden="true" />;
}

// 206: a halftone dot field. The dots print the kriv wordmark on load, a slow wave runs through the field,
// and dots swell and turn Care blue under the pointer.
function Halftone({ word = true }: { word?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const { ptr, stop } = trackPointer(el);
    const ink = token(el, "--ink", "#101112"), care = token(el, "--care", "#4d8be0");
    const body = token(el, "--body", "Inter, sans-serif");
    let W = 0, H = 0, dpr = 1, s = 14, cols = 0, rows = 0, mask = new Float32Array(0), px = -999, py = -999;
    const born = performance.now(), still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const build = () => {
      dpr = Math.min(2, devicePixelRatio || 1); W = el.clientWidth; H = el.clientHeight;
      el.width = Math.round(W * dpr); el.height = Math.round(H * dpr);
      s = W < 700 ? 11 : 14; cols = Math.ceil(W / s); rows = Math.ceil(H / s);
      const off = document.createElement("canvas"); off.width = W; off.height = H;
      const o = off.getContext("2d")!;
      const fs = Math.max(150, Math.min(W * 0.42, 640));
      o.font = `800 ${fs}px ${body}`;
      (o as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${-0.09 * fs}px`;
      o.textAlign = "center"; o.textBaseline = "alphabetic"; o.fillStyle = "#000";
      if (word) o.fillText("kriv", W / 2, H + fs * 0.04);
      const data = W && H ? o.getImageData(0, 0, W, H).data : new Uint8ClampedArray(0);
      mask = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const x = Math.min(W - 1, Math.floor(i * s + s / 2)), y = Math.min(H - 1, Math.floor(j * s + s / 2));
        mask[j * cols + i] = data.length ? data[(y * W + x) * 4 + 3] / 255 : 0;
      }
    };
    build();
    const draw = (t: number) => {
      const age = still ? 99 : (performance.now() - born) / 1000; // the print-in runs on the clock, not on frame count
      if (ptr.on && px < -900) { px = ptr.x; py = ptr.y; } else if (ptr.on) { px += (ptr.x - px) * 0.25; py += (ptr.y - py) * 0.25; } else { px = -999; py = -999; }
      const field = new Path2D(), word = new Path2D(), hot = new Path2D();
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const x = i * s + s / 2, y = j * s + s / 2, m = mask[j * cols + i];
        const wave = 0.5 + 0.5 * Math.sin(x * 0.012 + y * 0.008 - t * 0.9);
        const dx = x - px, dy = y - py, heat = Math.exp(-(dx * dx + dy * dy) / 16200);
        let r: number, path = field;
        if (m > 0.5) {
          const delay = 0.15 + 0.7 * (x / W), e = Math.min(1, Math.max(0, (age - delay) / 0.8));
          r = s * 0.42 * (1 - Math.pow(1 - e, 3)) * (0.82 + 0.18 * wave); path = word;
        } else r = s * (0.06 + 0.1 * wave);
        r = Math.min(s * 0.5, r + s * 0.3 * heat);
        if (heat > 0.35) path = hot;
        if (r < 0.4) continue;
        path.moveTo(x + r, y); path.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = ink; ctx.globalAlpha = 0.17; ctx.fill(field);
      ctx.globalAlpha = 0.2; ctx.fill(word);
      ctx.fillStyle = care; ctx.globalAlpha = 0.85; ctx.fill(hot);
      ctx.globalAlpha = 1;
    };
    const [end, redraw] = animate(el, draw);
    const ro = new ResizeObserver(() => { build(); redraw(); });
    ro.observe(el);
    document.fonts?.ready.then(() => { build(); redraw(); });
    return () => { end(); ro.disconnect(); stop(); };
  }, [word]);
  return <canvas ref={ref} className={p.backdrop} aria-hidden="true" />;
}

export function PhBackdrop({ kind, word }: { kind: BackdropKind; word?: boolean }) {
  if (kind === "veil") return <><PhSea tone="tide" className={p.tide} /><Veil /></>;
  if (kind === "contour") return <Contour />;
  return <Halftone word={word} />;
}
