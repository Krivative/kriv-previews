"use client";

import { useEffect, useRef, useState } from "react";
import p from "./ph-rates.module.css";

// "How your plan builds": a sticky plan card that changes while the trial steps scroll past
// (reference: a pinned product card beside a scrolling list, from a fintech site Kriv shared on 22 Nov 2026).
// Every value is computed by the page from src/offers/pricing.ts and passed in.
export type StoryStep = { when: string; title: string; body: string; card: { tag: string; title: string; price: string; note: string; chips: string[]; gifts?: number; months?: number } };

export function PhStory({ steps, mode }: { steps: StoryStep[]; mode: "pinned" | "timeline" }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
    }, { rootMargin: "-45% 0px -45% 0px" });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const card = steps[active].card;
  return <div className={p.story} data-mode={mode}>
    <div className={p.stage} aria-hidden="true">
      <div className={p.planCard} key={active}>
        <p className={p.tag}>{card.tag}</p>
        <h3>{card.title}</h3>
        <p className={p.planPrice}>{card.price}</p>
        <p className={p.planNote}>{card.note}</p>
        <ul className={p.chips}>{card.chips.map((c) => <li key={c}>{c}</li>)}</ul>
        {card.months !== undefined && <div className={p.months}>
          {Array.from({ length: card.months }, (_, i) => <i key={i} />)}
          {Array.from({ length: card.gifts ?? 0 }, (_, i) => <i key={`g${i}`} className={p.giftDot} />)}
        </div>}
      </div>
    </div>
    <ol className={p.steps} data-progress={mode === "timeline" ? "rail" : undefined}>
      {steps.map((s, i) => <li key={s.when} ref={(el) => { refs.current[i] = el; }} data-i={i} data-active={i === active || undefined}>
        <p className={p.when}>{s.when}</p>
        <h3>{s.title}</h3>
        <p>{s.body}</p>
      </li>)}
    </ol>
  </div>;
}
