"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

// Marks which chapter of the journey is in view, so the drawing can change with
// it, and plays that chapter's narration. Reads scroll position only: nothing
// is stored or sent. Without scripts the journey is still a complete page of
// chapters with a still drawing.
//
// Narration is on from the start (Kriv, 2026-11-16). Browsers do not let a page
// make sound until the visitor has tapped, clicked or pressed a key, so until
// then the button reads "Tap to hear narration" and the first touch anywhere
// starts the chapter in view. A chapter with data-audio plays that recording
// through one shared player (phones only let a player that a touch started play
// again later). If a recording cannot play, the device's own built-in voice
// reads the chapter (only voices that run on the device, so the text stays there).
export function JourneyScroller({ className, voiceClassName, defaultVoice = true, children }: { className: string; voiceClassName: string; defaultVoice?: boolean; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [voice, setVoice] = useState(defaultVoice);
  const [waiting, setWaiting] = useState(false);
  const [step, setStep] = useState(0);
  const current = useRef(0);
  const player = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const steps = [...el.querySelectorAll<HTMLElement>("[data-journey-step]")];
    // A story may draw one picture per chapter; the one in view is marked too.
    const scenes = [...el.querySelectorAll<SVGElement>("[data-journey-scene]")];
    const check = () => {
      // The current chapter is the last one whose top has passed the middle of the window.
      const line = window.innerHeight * 0.6;
      let now = 0;
      steps.forEach((s, i) => { if (s.getBoundingClientRect().top < line) now = i; });
      if (el.dataset.step !== String(now)) {
        el.dataset.step = String(now);
        [...steps, ...scenes].forEach((s) => s.removeAttribute("data-active"));
        steps[now]?.setAttribute("data-active", "");
        scenes[now]?.setAttribute("data-active", "");
        current.current = now;
        setStep(now);
      }
    };
    check();
    // One measurement per frame while scrolling, so the drawing answers at once.
    let frame = 0;
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; check(); }); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", check);
    const tick = window.setInterval(check, 500);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", check); window.clearInterval(tick); cancelAnimationFrame(frame); };
  }, []);

  const quiet = useCallback(() => { player.current?.pause(); window.speechSynthesis?.cancel(); }, []);

  /** Plays one chapter's narration: its recording, or the device voice if that fails. */
  const play = useCallback((index: number) => {
    const chapter = root.current?.querySelectorAll<HTMLElement>("[data-journey-step]")[index];
    if (!chapter) return;
    quiet();
    const speak = () => {
      if (!window.speechSynthesis) return;
      const words = [chapter.querySelector("h1, h2")?.textContent, chapter.querySelector("[data-narration]")?.textContent].filter(Boolean).join(" ");
      const line = new SpeechSynthesisUtterance(words);
      const local = window.speechSynthesis.getVoices().filter((v) => v.localService && v.lang.startsWith("en"));
      if (local.length) line.voice = local.find((v) => v.lang === "en-PH") ?? local[0];
      line.lang = line.voice?.lang ?? "en";
      line.rate = 0.95;
      window.speechSynthesis.speak(line);
    };
    const recording = chapter.dataset.audio;
    if (!recording) return speak();
    const audio = player.current ?? (player.current = new Audio());
    audio.setAttribute("src", recording);
    audio.play().then(() => setWaiting(false)).catch((error: unknown) => {
      const name = (error as { name?: string })?.name;
      if (name === "NotAllowedError") setWaiting(true);
      else if (name !== "AbortError") speak();
    });
  }, [quiet]);

  // Each chapter starts its narration as it scrolls into view.
  useEffect(() => {
    if (!voice) return quiet();
    play(step);
    return quiet;
  }, [voice, step, play, quiet]);

  // Until the browser allows sound, the first touch, click or key press starts it.
  useEffect(() => {
    if (!voice || !waiting) return;
    const begin = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("[data-voice-button]")) return;
      play(current.current);
    };
    const events = ["pointerdown", "keydown", "touchend"] as const;
    events.forEach((name) => window.addEventListener(name, begin));
    return () => events.forEach((name) => window.removeEventListener(name, begin));
  }, [voice, waiting, play]);

  const press = () => {
    if (voice && waiting) play(current.current);
    else setVoice((v) => !v);
  };

  return <div ref={root} className={className}>
    <p className={voiceClassName}><button type="button" data-voice-button="" aria-pressed={voice} onClick={press}>{!voice ? "Narration off" : waiting ? "Tap to hear narration" : "Narration on"}</button></p>
    {children}
  </div>;
}
