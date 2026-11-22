"use client";

import { useEffect, useRef } from "react";
import { animate, token, trackPointer, type Pointer } from "./PhBackdrop";
import p from "./ph-rates.module.css";

// Round 4 of the /ph-rates randomizer (Kriv, 23 Nov 2026): moving layers the seed puts under the offer figures
// and the plan details. Canvases sized to their section, brand colours at low strength so the text stays readable,
// paused off screen, one still frame with reduced motion.
export type LayerKind = "aurora" | "chart" | "ripple" | "drift";
type Draw = (c: CanvasRenderingContext2D, W: number, H: number, t: number, ptr: Pointer, el: HTMLCanvasElement) => void;

function useCanvas(make: () => Draw) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const { ptr, stop } = trackPointer(el);
    const draw = make();
    let W = 0, H = 0, dpr = 1;
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = el.clientWidth; H = el.clientHeight; el.width = Math.round(W * dpr); el.height = Math.round(H * dpr); };
    size();
    const [end, redraw] = animate(el, (t) => { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(ctx, W, H, t, ptr, el); });
    const ro = new ResizeObserver(() => { size(); redraw(); });
    ro.observe(el);
    return () => { end(); ro.disconnect(); stop(); };
  }, [make]);
  return ref;
}

// aurora: the packages' brand-spectrum glows, now wandering; the nearest one follows the pointer.
const aurora = (): Draw => {
  const pts: { x: number; y: number }[] = [];
  return (c, W, H, t, ptr, el) => {
    const cols = [token(el, "--care", "#4d8be0"), "#e7fa78", token(el, "--sand", "#b99a5c")];
    let lead = -1;
    if (ptr.on && pts.length) { let best = Infinity; pts.forEach((q, k) => { const d = Math.hypot(q.x - ptr.x, q.y - ptr.y); if (d < best) { best = d; lead = k; } }); }
    c.clearRect(0, 0, W, H);
    cols.forEach((col, i) => {
      let tx = W * (0.18 + 0.32 * i + 0.12 * Math.sin(t * (0.21 + i * 0.05) + i * 2)), ty = H * (0.5 + 0.4 * Math.sin(t * (0.17 + i * 0.04) + i));
      if (i === lead) { tx = ptr.x; ty = ptr.y; }
      const q = pts[i] ?? (pts[i] = { x: tx, y: ty });
      q.x += (tx - q.x) * 0.05; q.y += (ty - q.y) * 0.05;
      const r = Math.max(W * 0.3, H * 0.9), g = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      g.addColorStop(0, `${col}88`); g.addColorStop(1, `${col}00`);
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    });
  };
};

// chart: graph paper that bends like a lens around the pointer (a slow wandering lens on phones).
const chart = (): Draw => {
  let lx = -1, ly = -1;
  return (c, W, H, t, ptr, el) => {
    const ink = token(el, "--ink", "#101112"), care = token(el, "--care", "#4d8be0");
    const tx = ptr.on ? ptr.x : W * (0.5 + 0.4 * Math.sin(t * 0.13)), ty = ptr.on ? ptr.y : H * (0.5 + 0.35 * Math.sin(t * 0.17 + 1));
    if (lx < 0) { lx = tx; ly = ty; }
    lx += (tx - lx) * 0.08; ly += (ty - ly) * 0.08;
    const gap = W < 700 ? 26 : 34, sig2 = 2 * (Math.min(W, H) * 0.25 + 60) ** 2;
    const bend = (x: number, y: number) => { const dx = x - lx, dy = y - ly, k = 0.42 * Math.exp(-(dx * dx + dy * dy) / sig2); return [x + dx * k, y + dy * k] as const; };
    const minor = new Path2D(), major = new Path2D(), off = (t * 6) % (gap * 4);
    for (let i = 0, x = -off; x < W + gap; i++, x += gap) {
      const path = i % 4 === 0 ? major : minor;
      for (let y = 0; y <= H + 16; y += 16) { const [a, b] = bend(x, y); if (y === 0) path.moveTo(a, b); else path.lineTo(a, b); }
    }
    for (let j = 0, y = 0; y < H + gap; j++, y += gap) {
      const path = j % 4 === 0 ? major : minor;
      for (let x = 0; x <= W + 16; x += 16) { const [a, b] = bend(x, y); if (x === 0) path.moveTo(a, b); else path.lineTo(a, b); }
    }
    c.clearRect(0, 0, W, H);
    c.lineWidth = 1; c.strokeStyle = ink; c.globalAlpha = 0.08; c.stroke(minor);
    c.strokeStyle = care; c.globalAlpha = 0.4; c.stroke(major);
    c.globalAlpha = 1;
  };
};

// ripple: sonar rings. A slow ring every couple of seconds from a wandering point; the pointer drops rings where it moves.
const ripple = (): Draw => {
  let rings: { x: number; y: number; at: number; big: boolean }[] = [], next = 0, drop = -1;
  return (c, W, H, t, ptr, el) => {
    const care = token(el, "--care", "#4d8be0"), ink = token(el, "--ink", "#101112");
    if (t >= next) { rings.push({ x: W * (0.5 + 0.38 * Math.sin(t * 0.23)), y: H * (0.5 + 0.3 * Math.sin(t * 0.31 + 1)), at: t, big: true }); next = t + 1.5; }
    if (ptr.on && performance.now() - ptr.at < 150 && t - drop > 0.3) { rings.push({ x: ptr.x, y: ptr.y, at: t, big: false }); drop = t; }
    rings = rings.filter((r) => t >= r.at && t - r.at < (r.big ? 7 : 3));
    c.clearRect(0, 0, W, H);
    for (const r of rings) {
      const age = t - r.at, life = r.big ? 7 : 3, rad = age * (r.big ? 70 : 95);
      for (let k = 0; k < (r.big ? 3 : 2); k++) {
        const rr = rad - k * 18;
        if (rr <= 0) continue;
        c.beginPath(); c.arc(r.x, r.y, rr, 0, Math.PI * 2);
        c.strokeStyle = k === 0 ? care : ink; c.lineWidth = k === 0 ? 1.6 : 1;
        c.globalAlpha = (1 - age / life) * (k === 0 ? (r.big ? 0.55 : 0.75) : 0.18); c.stroke();
      }
    }
    c.globalAlpha = 1;
  };
};

// drift: thin currents, like wind on water, that curl around the pointer.
const drift = (): Draw => {
  const ps: { x: number; y: number; life: number }[] = [];
  return (c, W, H, t, ptr, el) => {
    const ink = token(el, "--ink", "#101112"), care = token(el, "--care", "#4d8be0");
    const n = Math.min(240, Math.round((W * H) / 7000));
    while (ps.length < n) ps.push({ x: Math.random() * W, y: Math.random() * H, life: Math.random() * 300 });
    ps.length = n;
    c.globalCompositeOperation = "destination-out"; c.fillStyle = "rgba(0,0,0,.06)"; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = "source-over";
    const a = new Path2D(), b = new Path2D();
    ps.forEach((q, i) => {
      const ang = Math.sin(q.x * 0.0035 + t * 0.15) * 1.1 + Math.cos(q.y * 0.006 - t * 0.1) * 0.8;
      let vx = Math.cos(ang) * 1.1 + 0.55, vy = Math.sin(ang) * 0.8;
      if (ptr.on) {
        const dx = q.x - ptr.x, dy = q.y - ptr.y, d = Math.sqrt(dx * dx + dy * dy) + 1, k = 7 * Math.exp(-(d * d) / 11000);
        vx += (-dy / d) * k; vy += (dx / d) * k;
      }
      const path = i % 5 === 0 ? b : a;
      path.moveTo(q.x, q.y); q.x += vx; q.y += vy; path.lineTo(q.x, q.y);
      if (--q.life < 0 || q.x > W + 5 || q.x < -5 || q.y < -5 || q.y > H + 5) { q.x = Math.random() * W * 0.4 - 5; q.y = Math.random() * H; q.life = 150 + Math.random() * 200; }
    });
    c.lineWidth = 1.2; c.strokeStyle = ink; c.globalAlpha = 0.3; c.stroke(a);
    c.strokeStyle = care; c.globalAlpha = 0.8; c.stroke(b); c.globalAlpha = 1;
  };
};

const MAKERS: Record<LayerKind, () => Draw> = { aurora, chart, ripple, drift };

export function PhLayer({ kind }: { kind: LayerKind }) {
  const ref = useCanvas(MAKERS[kind]);
  return <canvas ref={ref} className={p.backdrop} data-layer={kind} aria-hidden="true" />;
}
