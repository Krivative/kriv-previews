"use client";

import { useEffect, useRef } from "react";

// Effects arsenal, generation 2 interactions (23 Nov 2026). Reads the page root ([data-seed]):
//   data-spotlight: a soft light follows the pointer across every [data-bg] section (--sx, --sy, --so);
//   data-cardtilt:  [data-tilt] cards turn in 3D toward the pointer with a moving glare (--rx, --ry, --gx, --gy);
//   always:         --scroll (0..1, whole page) for a progress bar and --hs (0..1, first screen) for hero parallax.
// Pointer effects only on devices that hover; reduced motion turns all of it off.
export function FxPlus() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>("[data-seed]");
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const offs: (() => void)[] = [];

    const parallax = [...root.querySelectorAll<HTMLElement>("[data-parallax]")];
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        root.style.setProperty("--scroll", (scrollY / max).toFixed(4));
        root.style.setProperty("--hs", Math.min(1, scrollY / innerHeight).toFixed(4));
        // Photos marked data-parallax drift a little against the scroll (--py, in px) while they are on screen.
        for (const img of parallax) {
          const b = img.getBoundingClientRect();
          if (b.bottom < -100 || b.top > innerHeight + 100) continue;
          img.style.setProperty("--py", `${(((b.top + b.height / 2) / innerHeight - 0.5) * -28).toFixed(1)}px`);
        }
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    offs.push(() => removeEventListener("scroll", onScroll));

    if (matchMedia("(hover: hover)").matches) {
      if (root.dataset.spotlight !== undefined) {
        const move = (e: PointerEvent) => {
          const sec = (e.target as HTMLElement).closest<HTMLElement>("[data-bg]");
          root.querySelectorAll<HTMLElement>("[data-bg][data-lit-up]").forEach((s) => { if (s !== sec) { s.style.setProperty("--so", "0"); delete s.dataset.litUp; } });
          if (!sec) return;
          const b = sec.getBoundingClientRect();
          sec.style.setProperty("--sx", `${e.clientX - b.left}px`);
          sec.style.setProperty("--sy", `${e.clientY - b.top}px`);
          sec.style.setProperty("--so", "1");
          sec.dataset.litUp = "";
        };
        root.addEventListener("pointermove", move, { passive: true });
        offs.push(() => root.removeEventListener("pointermove", move));
      }
      if (root.dataset.cardtilt !== undefined) {
        const cards = [...root.querySelectorAll<HTMLElement>("[data-tilt]")];
        const handlers = cards.map((card) => {
          const move = (e: PointerEvent) => {
            const b = card.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
            card.style.setProperty("--ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
            card.style.setProperty("--rx", `${((0.5 - y) * 8).toFixed(2)}deg`);
            card.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
            card.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
            card.dataset.tilting = "";
          };
          const leave = () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); delete card.dataset.tilting; };
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", leave);
          return () => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); };
        });
        offs.push(...handlers);
      }
    }
    return () => offs.forEach((off) => off());
  }, []);
  return <span ref={ref} hidden />;
}
