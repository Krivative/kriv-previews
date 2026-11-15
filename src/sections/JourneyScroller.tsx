"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Marks which chapter of the journey is in view, so the drawing can change with
// it, and reads that chapter aloud when the visitor turns narration on. Reads
// scroll position only: nothing is stored or sent. Without scripts the journey
// is still a complete page of chapters with a still drawing.
//
// Narration: a chapter with data-audio plays that recording. Otherwise the
// device's own built-in voice reads the chapter's words (only voices that run
// on the device are used, so the text never leaves it). It is off until the
// visitor presses the button, as browsers require.
export function JourneyScroller({ className, voiceClassName, children }: { className: string; voiceClassName: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [voice, setVoice] = useState(false);
  const [step, setStep] = useState(0);
  const player = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const steps = [...el.querySelectorAll<HTMLElement>("[data-journey-step]")];
    const check = () => {
      // The current chapter is the last one whose top has passed the middle of the window.
      const line = window.innerHeight * 0.5;
      let now = 0;
      steps.forEach((s, i) => { if (s.getBoundingClientRect().top < line) now = i; });
      if (el.dataset.step !== String(now)) {
        el.dataset.step = String(now);
        steps.forEach((s, i) => (i === now ? s.setAttribute("data-active", "") : s.removeAttribute("data-active")));
        setStep(now);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    const tick = window.setInterval(check, 500);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); window.clearInterval(tick); };
  }, []);

  useEffect(() => {
    const quiet = () => { player.current?.pause(); player.current = null; window.speechSynthesis?.cancel(); };
    quiet();
    if (!voice) return;
    const chapter = root.current?.querySelectorAll<HTMLElement>("[data-journey-step]")[step];
    if (!chapter) return;
    const recording = chapter.dataset.audio;
    if (recording) {
      player.current = new Audio(recording);
      void player.current.play().catch(() => undefined);
    } else if (window.speechSynthesis) {
      const words = [chapter.querySelector("h1, h2")?.textContent, chapter.querySelector("[data-narration]")?.textContent].filter(Boolean).join(" ");
      const line = new SpeechSynthesisUtterance(words);
      const local = window.speechSynthesis.getVoices().filter((v) => v.localService && v.lang.startsWith("en"));
      if (local.length) line.voice = local.find((v) => v.lang === "en-PH") ?? local[0];
      line.lang = line.voice?.lang ?? "en";
      line.rate = 0.95;
      window.speechSynthesis.speak(line);
    }
    return quiet;
  }, [voice, step]);

  return <div ref={root} className={className}>
    <p className={voiceClassName}><button type="button" aria-pressed={voice} onClick={() => setVoice((v) => !v)}>Narration {voice ? "on" : "off"}</button></p>
    {children}
  </div>;
}
