import { token } from "./PhBackdrop";
import type { Draw } from "./PhLayers";

// Effects arsenal, generation 2 (Kriv, 23 Nov 2026, on PCO Dental: "use the randomizer for completely new effects and style").
// Same contract as PhLayers.tsx: drawn in code, brand colours from tokens, low strength, pointer-aware, paused off screen.

// bubbles: small clear bubbles rising with a wobble, like rinse water; the pointer pops the ones it touches.
export const bubbles = (): Draw => {
  const bs: { x: number; y: number; r: number; v: number; ph: number; pop: number }[] = [];
  const spawn = (W: number, H: number, anywhere: boolean) => ({ x: Math.random() * W, y: anywhere ? Math.random() * H : H + 20, r: 3 + Math.random() * 11, v: 0.25 + Math.random() * 0.6, ph: Math.random() * 6.3, pop: 0 });
  return (c, W, H, t, ptr, el) => {
    const care = token(el, "--care", "#4d8be0");
    const n = Math.min(60, Math.round((W * H) / 16000));
    while (bs.length < n) bs.push(spawn(W, H, true));
    bs.length = n;
    c.clearRect(0, 0, W, H);
    c.strokeStyle = care;
    bs.forEach((b, i) => {
      if (b.pop > 0) {
        b.pop += 0.06;
        c.globalAlpha = Math.max(0, 0.5 * (1 - b.pop)); c.lineWidth = 1;
        c.beginPath(); c.arc(b.x, b.y, b.r * (1 + b.pop * 2), 0, Math.PI * 2); c.stroke();
        if (b.pop >= 1) bs[i] = spawn(W, H, false);
        return;
      }
      b.y -= b.v; b.x += Math.sin(t * 1.3 + b.ph) * 0.35;
      if (b.y < -20) bs[i] = spawn(W, H, false);
      if (ptr.on && Math.hypot(b.x - ptr.x, b.y - ptr.y) < b.r + 14) b.pop = 0.01;
      c.globalAlpha = 0.42; c.lineWidth = 1.1;
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.stroke();
      c.globalAlpha = 0.6; c.fillStyle = "#ffffff";
      c.beginPath(); c.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, Math.PI * 2); c.fill();
    });
    c.globalAlpha = 1;
  };
};

// glints: four-point sparkles that twinkle like light on a clean surface; they gather and brighten near the pointer.
export const glints = (): Draw => {
  const gs: { x: number; y: number; s: number; ph: number; sp: number }[] = [];
  return (c, W, H, t, ptr, el) => {
    const care = token(el, "--care", "#4d8be0"), spark = token(el, "--sand", "#b99a5c");
    const n = Math.min(80, Math.round((W * H) / 12000));
    while (gs.length < n) gs.push({ x: Math.random() * W, y: Math.random() * H, s: 3 + Math.random() * 7, ph: Math.random() * 6.3, sp: 0.6 + Math.random() * 1.4 });
    gs.length = n;
    c.clearRect(0, 0, W, H);
    gs.forEach((g, i) => {
      const near = ptr.on ? Math.exp(-((g.x - ptr.x) ** 2 + (g.y - ptr.y) ** 2) / 26000) : 0;
      const tw = Math.max(0, Math.sin(t * g.sp + g.ph)) ** 3, k = Math.min(1, tw + near * 1.2);
      if (k < 0.04) return;
      const s = g.s * (0.4 + 0.9 * k), x = g.x, y = g.y;
      c.globalAlpha = 0.85 * k; c.fillStyle = i % 3 === 0 ? spark : care;
      c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x, y, x + s, y); c.quadraticCurveTo(x, y, x, y + s); c.quadraticCurveTo(x, y, x - s, y); c.quadraticCurveTo(x, y, x, y - s); c.fill();
    });
    c.globalAlpha = 1;
  };
};

// silk: bundles of fine parallel lines that sway like ribbons; the pointer presses a soft dent into them.
export const silk = (): Draw => {
  let px = -1, py = -1, pw = 0;
  return (c, W, H, t, ptr, el) => {
    const care = token(el, "--care", "#4d8be0"), ink = token(el, "--ink", "#101112");
    if (ptr.on) { if (px < 0) { px = ptr.x; py = ptr.y; } px += (ptr.x - px) * 0.12; py += (ptr.y - py) * 0.12; }
    pw += ((ptr.on ? 1 : 0) - pw) * 0.05;
    c.clearRect(0, 0, W, H);
    const lines = 14, step = W < 700 ? 18 : 14;
    for (let b = 0; b < 3; b++) {
      const base = H * (0.25 + 0.27 * b), amp = H * 0.12, ph = b * 1.7, path = new Path2D();
      for (let l = 0; l < lines; l++) {
        const off = (l - lines / 2) * (3.2 + 1.4 * Math.sin(t * 0.3 + b));
        for (let x = -10; x <= W + 10; x += step) {
          let y = base + off + amp * Math.sin(x * 0.0032 + t * 0.35 + ph) * Math.sin(t * 0.21 + b + l * 0.04);
          if (pw > 0.01) { const dx = x - px, dy = y - py; y += pw * 26 * Math.exp(-(dx * dx + dy * dy) / 9000) * Math.sign(dy || 1); }
          if (x === -10) path.moveTo(x, y); else path.lineTo(x, y);
        }
      }
      c.lineWidth = 0.8; c.strokeStyle = b === 1 ? ink : care; c.globalAlpha = b === 1 ? 0.12 : 0.32; c.stroke(path);
    }
    c.globalAlpha = 1;
  };
};

// caustics: the moving light pattern on the floor of a clear pool, drawn small and scaled up soft; brighter by the pointer.
export const caustics = (): Draw => {
  let off: HTMLCanvasElement | null = null;
  return (c, W, H, t, ptr, el) => {
    off ??= document.createElement("canvas");
    const care = token(el, "--care", "#4d8be0");
    const m = care.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i), [cr, cg, cb] = m ? [1, 2, 3].map((k) => parseInt(m[k], 16)) : [77, 139, 224];
    const sc = 5, w = Math.max(2, Math.ceil(W / sc)), h = Math.max(2, Math.ceil(H / sc));
    if (off.width !== w || off.height !== h) { off.width = w; off.height = h; }
    const o = off.getContext("2d")!, img = o.createImageData(w, h), d = img.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = i * sc, y = j * sc;
      const v = Math.sin(x * 0.024 + t * 0.6) + Math.sin(y * 0.028 - t * 0.5 + Math.sin(x * 0.012 + t * 0.2) * 2) + Math.sin((x + y) * 0.017 + t * 0.4);
      let a = Math.pow(1 - Math.abs(v) / 3, 14);
      if (ptr.on) a *= 1 + 1.4 * Math.exp(-((x - ptr.x) ** 2 + (y - ptr.y) ** 2) / 30000);
      const k = (j * w + i) * 4; d[k] = cr; d[k + 1] = cg; d[k + 2] = cb; d[k + 3] = Math.min(255, a * 38);
    }
    o.putImageData(img, 0, 0);
    c.clearRect(0, 0, W, H);
    c.imageSmoothingEnabled = true; c.drawImage(off, 0, 0, W, H);
  };
};

// nodes: drifting points that link up when close, like a care network; the pointer is a node too and pulls links to it.
export const nodes = (): Draw => {
  const ns: { x: number; y: number; vx: number; vy: number }[] = [];
  return (c, W, H, _t, ptr, el) => {
    const care = token(el, "--care", "#4d8be0"), ink = token(el, "--ink", "#101112");
    const n = Math.min(70, Math.round((W * H) / 14000));
    while (ns.length < n) ns.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4 });
    ns.length = n;
    for (const q of ns) {
      q.x += q.vx; q.y += q.vy;
      if (q.x < 0 || q.x > W) q.vx *= -1;
      if (q.y < 0 || q.y > H) q.vy *= -1;
      if (ptr.on) { const dx = ptr.x - q.x, dy = ptr.y - q.y, d = Math.hypot(dx, dy); if (d < 180 && d > 30) { q.x += dx * 0.004; q.y += dy * 0.004; } }
    }
    c.clearRect(0, 0, W, H);
    const reach = W < 700 ? 90 : 120, lines = new Path2D(), hot = new Path2D();
    for (let a = 0; a < ns.length; a++) for (let b = a + 1; b < ns.length; b++) {
      if (Math.hypot(ns[a].x - ns[b].x, ns[a].y - ns[b].y) < reach) { lines.moveTo(ns[a].x, ns[a].y); lines.lineTo(ns[b].x, ns[b].y); }
    }
    if (ptr.on) for (const q of ns) if (Math.hypot(q.x - ptr.x, q.y - ptr.y) < reach * 1.5) { hot.moveTo(ptr.x, ptr.y); hot.lineTo(q.x, q.y); }
    c.lineWidth = 0.8; c.strokeStyle = ink; c.globalAlpha = 0.13; c.stroke(lines);
    c.strokeStyle = care; c.globalAlpha = 0.55; c.stroke(hot);
    c.globalAlpha = 0.5; c.fillStyle = care;
    for (const q of ns) { c.beginPath(); c.arc(q.x, q.y, 1.8, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  };
};
