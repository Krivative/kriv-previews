"use client";

import { useEffect, useRef } from "react";

// Page-wide movement and interaction for the seeded /ph-rates page (round 2, 23 Nov 2026).
// Reads the seed's choices from the root's data attributes:
//   data-motion="reveal": [data-reveal] rises in, [data-count] counts up, [data-progress] gets --p (0..1) as it scrolls;
//   data-touch="tilt":    sets --tx / --ty (-1..1) on the hero for the plan cards;
//   data-touch="magnet":  [data-magnet] buttons lean toward the pointer.
// Without JavaScript or with reduced motion everything stays visible and still.
function countUp(el: HTMLElement) {
  const m = (el.dataset.count ?? "").match(/^(\D*)(\d[\d,]*)(.*)$/);
  if (!m || m[2] === "0") return;
  const target = Number(m[2].replace(/,/g, "")), start = performance.now();
  const step = (now: number) => {
    const k = Math.min(1, (now - start) / 1100), v = Math.round(target * (1 - Math.pow(1 - k, 3)));
    el.textContent = `${m[1]}${v.toLocaleString("en-PH")}${m[3]}`;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function PhEffects() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>("[data-seed]");
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const offs: (() => void)[] = [];

    if (root.dataset.motion === "reveal") {
      root.dataset.js = "";
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.dataset.in = "";
          if (el.dataset.count !== undefined) countUp(el);
          io.unobserve(el);
        }
      }, { rootMargin: "0px 0px -10% 0px" });
      root.querySelectorAll("[data-reveal], [data-count]").forEach((el) => io.observe(el));
      const bars = [...root.querySelectorAll<HTMLElement>("[data-progress]")];
      let queued = false;
      const measure = () => {
        queued = false;
        const vh = innerHeight;
        for (const b of bars) {
          const r = b.getBoundingClientRect();
          const raw = b.dataset.progress === "end" ? (vh - r.top) / Math.max(1, r.height) : (vh * 0.95 - r.top) / (vh * 0.55);
          const pr = Math.min(1, Math.max(0, raw));
          b.style.setProperty("--p", pr.toFixed(3));
          const kids = b.querySelectorAll<HTMLElement>(":scope > [data-i]");
          kids.forEach((k, i) => { if (pr >= (i + 0.6) / kids.length) k.dataset.lit = ""; else delete k.dataset.lit; });
        }
      };
      const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(measure); } };
      measure();
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", onScroll);
      offs.push(() => { io.disconnect(); removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); });
    }

    if (matchMedia("(hover: hover)").matches) {
      if (root.dataset.touch === "tilt") {
        const hero = root.querySelector<HTMLElement>("main > section");
        const move = (e: PointerEvent) => {
          if (!hero) return;
          const b = hero.getBoundingClientRect();
          hero.style.setProperty("--tx", (((e.clientX - b.left) / b.width) * 2 - 1).toFixed(3));
          hero.style.setProperty("--ty", (((e.clientY - b.top) / b.height) * 2 - 1).toFixed(3));
        };
        const leave = () => { hero?.style.setProperty("--tx", "0"); hero?.style.setProperty("--ty", "0"); };
        hero?.addEventListener("pointermove", move);
        hero?.addEventListener("pointerleave", leave);
        offs.push(() => { hero?.removeEventListener("pointermove", move); hero?.removeEventListener("pointerleave", leave); });
      }
      if (root.dataset.touch === "magnet") {
        const items = [...root.querySelectorAll<HTMLElement>("[data-magnet]")];
        let queued = false, cx = 0, cy = 0;
        const apply = () => {
          queued = false;
          for (const el of items) {
            const b = el.getBoundingClientRect(), mx = b.left + b.width / 2, my = b.top + b.height / 2;
            const dx = cx - mx, dy = cy - my, reach = Math.max(b.width, b.height) / 2 + 70;
            el.style.translate = Math.hypot(dx, dy) < reach ? `${(dx * 0.22).toFixed(1)}px ${(dy * 0.3).toFixed(1)}px` : "";
          }
        };
        const move = (e: PointerEvent) => { cx = e.clientX; cy = e.clientY; if (!queued) { queued = true; requestAnimationFrame(apply); } };
        addEventListener("pointermove", move, { passive: true });
        offs.push(() => removeEventListener("pointermove", move));
      }
    }
    return () => offs.forEach((off) => off());
  }, []);
  return <span ref={ref} hidden />;
}
