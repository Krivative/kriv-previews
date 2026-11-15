"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

// Runs a scroll story (Kriv's rules, 2026-11-16):
//  - One scroll, swipe or arrow key moves exactly one chapter, and the chapter
//    fills the window while its narration plays.
//  - The next chapter opens only when the current one has finished: its
//    recording has ended, or, with no sound, after a short reading pause.
//  - Going back is always allowed. Once every chapter has been through once,
//    the page scrolls freely, on this visit and later ones (remembered in the
//    browser only).
//  - Visitors who ask their device for reduced motion are never held.
// It reads scroll position and plays local audio: nothing is sent anywhere.
// Without scripts the story is a plain page of chapters with a still drawing.
//
// Narration: browsers do not let a page make sound until the visitor has
// tapped, clicked or pressed a key, so until then the button reads "Tap to hear
// narration" and the first touch starts the chapter in view. A chapter with
// data-audio plays that recording through one shared player (phones only let a
// player that a touch started play again later). If a recording cannot play,
// the device's own built-in voice reads the chapter (local voices only).

const PAUSE = 2500; // reading time for a chapter that plays no sound

export function JourneyScroller({ id, className, voiceClassName, cueClassName, defaultVoice = true, children }: { id: string; className: string; voiceClassName: string; cueClassName: string; defaultVoice?: boolean; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [voice, setVoice] = useState(defaultVoice);
  const [waiting, setWaiting] = useState(false);
  const [step, setStep] = useState(0);
  const [opened, setOpened] = useState(0); // the furthest chapter the visitor may go to
  const [free, setFree] = useState(false);
  const [held, setHeld] = useState(false);
  const current = useRef(0);
  const open = useRef(0);
  const freed = useRef(false);
  const player = useRef<HTMLAudioElement | null>(null);
  const timer = useRef(0);
  const watch = useRef(0);
  const key = `journey-done:${id}`;

  const chapters = useCallback(() => [...(root.current?.querySelectorAll<HTMLElement>("[data-journey-step]") ?? [])], []);

  /** A chapter has been through: the next one opens, and after the last the story is free. */
  const finish = useCallback((index: number) => {
    if (index + 1 > open.current) { open.current = index + 1; setOpened(index + 1); }
    if (index >= chapters().length - 1 && !freed.current) {
      freed.current = true;
      setFree(true);
      try { window.localStorage.setItem(key, "1"); } catch { /* private window: this visit only */ }
    }
  }, [chapters, key]);

  // Chapter in view, paging and the hold on skipping ahead.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const steps = chapters();
    const scenes = [...el.querySelectorAll<SVGElement>("[data-journey-scene]")];
    const topOf = (n: number) => steps[n].getBoundingClientRect().top + window.scrollY;
    const limit = () => topOf(Math.min(open.current, steps.length - 1));
    let busy = 0;
    let lastWheel = 0;
    let touchY: number | null = null;
    let holdTimer = 0;
    let landTimer = 0;

    // Free from the start for returning visitors and for reduced motion.
    const release = requestAnimationFrame(() => {
      let done = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      try { done = done || window.localStorage.getItem(key) === "1"; } catch { /* no storage */ }
      if (done) { freed.current = true; open.current = steps.length; setOpened(steps.length); setFree(true); }
    });

    const check = () => {
      // Hold: nothing past the furthest opened chapter, however the page is moved.
      if (!freed.current && Date.now() >= busy && window.scrollY > limit() + 4) window.scrollTo({ top: limit(), behavior: "instant" });
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
    let frame = 0;
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; check(); }); };
    const tick = window.setInterval(check, 500);

    const inStory = () => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5; };
    const hold = () => { setHeld(true); window.clearTimeout(holdTimer); holdTimer = window.setTimeout(() => setHeld(false), 2200); };
    const go = (n: number) => {
      busy = Date.now() + 1000;
      const top = n < 0 ? 0 : n >= steps.length ? el.getBoundingClientRect().bottom + window.scrollY : topOf(n);
      window.scrollTo({ top, behavior: "smooth" });
      // If the glide did not get there (some browsers drop it), land on the chapter anyway.
      window.clearTimeout(landTimer);
      landTimer = window.setTimeout(() => { if (Math.abs(window.scrollY - top) > 6) window.scrollTo({ top, behavior: "instant" }); }, 900);
    };
    const move = (direction: number) => {
      if (Date.now() < busy) return;
      const now = current.current;
      if (direction < 0) return go(now - 1);
      if (now + 1 > open.current) return hold();
      go(now + 1);
    };
    const paging = () => !freed.current && inStory();

    const onWheel = (event: WheelEvent) => {
      if (!paging() || event.ctrlKey) return;
      event.preventDefault();
      // One swipe on a trackpad sends a long run of events: only its first one counts.
      const fresh = event.timeStamp - lastWheel > 160;
      lastWheel = event.timeStamp;
      if (fresh && Math.abs(event.deltaY) >= 4) move(Math.sign(event.deltaY));
    };
    const onTouchStart = (event: TouchEvent) => { touchY = paging() ? event.touches[0].clientY : null; };
    const onTouchMove = (event: TouchEvent) => { if (touchY !== null && paging() && event.cancelable) event.preventDefault(); };
    const onTouchEnd = (event: TouchEvent) => {
      if (touchY === null) return;
      const distance = touchY - event.changedTouches[0].clientY;
      touchY = null;
      if (Math.abs(distance) > 40) move(Math.sign(distance));
    };
    const onKey = (event: KeyboardEvent) => {
      if (!paging()) return;
      const onControl = event.target instanceof Element && event.target.closest("button, a, summary");
      const direction = ["ArrowDown", "PageDown"].includes(event.key) || (event.key === " " && !onControl && !event.shiftKey) ? 1 : ["ArrowUp", "PageUp"].includes(event.key) || (event.key === " " && !onControl) ? -1 : 0;
      if (!direction) return;
      event.preventDefault();
      move(direction);
    };
    // Links that jump past the chapters opened so far wait too.
    const onClick = (event: MouseEvent) => {
      if (freed.current || !(event.target instanceof Element)) return;
      const hash = event.target.closest("a")?.getAttribute("href");
      const target = hash?.startsWith("#") ? document.getElementById(hash.slice(1)) : null;
      if (target && target.getBoundingClientRect().top + window.scrollY > limit() + 4) { event.preventDefault(); hold(); }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", check);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", check);
      window.removeEventListener("wheel", onWheel); window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove); window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey); document.removeEventListener("click", onClick);
      window.clearInterval(tick); window.clearTimeout(holdTimer); window.clearTimeout(landTimer); cancelAnimationFrame(frame); cancelAnimationFrame(release);
    };
  }, [chapters, key]);

  const quiet = useCallback(() => { player.current?.pause(); window.speechSynthesis?.cancel(); window.clearTimeout(timer.current); window.clearInterval(watch.current); }, []);

  /** Plays one chapter's narration, and marks the chapter finished when it ends. */
  const play = useCallback((index: number) => {
    const chapter = chapters()[index];
    if (!chapter) return;
    quiet();
    const done = () => finish(index);
    // A backstop, so a sound that never reports its end cannot hold the story.
    const within = (ms: number) => { window.clearTimeout(timer.current); timer.current = window.setTimeout(done, ms); };
    const speak = () => {
      if (!window.speechSynthesis) return within(PAUSE);
      const words = [chapter.querySelector("h1, h2")?.textContent, chapter.querySelector("[data-narration]")?.textContent].filter(Boolean).join(" ");
      const line = new SpeechSynthesisUtterance(words);
      const local = window.speechSynthesis.getVoices().filter((v) => v.localService && v.lang.startsWith("en"));
      if (local.length) line.voice = local.find((v) => v.lang === "en-PH") ?? local[0];
      line.lang = line.voice?.lang ?? "en";
      line.rate = 0.95;
      line.addEventListener("end", done);
      within(1500 + words.length * 65);
      window.speechSynthesis.speak(line);
    };
    const recording = chapter.dataset.audio;
    if (!recording) return speak();
    const audio = player.current ?? (player.current = new Audio());
    audio.setAttribute("src", recording);
    within(30000);
    audio.play().then(() => setWaiting(false)).catch((error: unknown) => {
      const name = (error as { name?: string })?.name;
      if (name === "NotAllowedError") { setWaiting(true); within(PAUSE); }
      else if (name !== "AbortError") speak();
    });
    // Watch the player itself rather than trust one event: the chapter is finished
    // when the recording reaches its end.
    const began = Date.now();
    watch.current = window.setInterval(() => {
      if (audio.ended || (audio.duration > 0 && audio.currentTime >= audio.duration - 0.2)) { window.clearInterval(watch.current); done(); }
      // Our own pauses stop this watch first, so a pause seen here came from the browser
      // (sound not allowed yet, or the tab was put to sleep): do not hold the story for it.
      else if (audio.paused && Date.now() - began > 1500) { window.clearInterval(watch.current); setWaiting(true); within(PAUSE); }
    }, 250);
  }, [chapters, finish, quiet]);

  // Each chapter starts its narration as it comes into view; with narration off it takes a reading pause.
  useEffect(() => {
    if (voice) play(step);
    else { quiet(); timer.current = window.setTimeout(() => finish(step), PAUSE); }
    return quiet;
  }, [voice, step, play, quiet, finish]);

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
  const ready = opened > step;
  const cue = free ? "" : held ? "This chapter is still playing. The next one opens when it ends." : ready ? "Scroll for the next chapter" : "";

  return <div ref={root} className={className} data-free={free ? "" : undefined} data-ready={ready ? "" : undefined} data-held={held ? "" : undefined}>
    <p className={voiceClassName}><button type="button" data-voice-button="" aria-pressed={voice} onClick={press}>{!voice ? "Narration off" : waiting ? "Tap to hear narration" : "Narration on"}</button></p>
    <p className={cueClassName} role="status"><span>{cue}</span></p>
    {children}
  </div>;
}
