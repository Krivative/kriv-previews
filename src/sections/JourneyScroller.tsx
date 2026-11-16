"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cue as playCue, setRoom, setSound, soundOff, SOUND_EVENT, voice as voiceSound, wake } from "./storySound";
import { castVoice, type CastBeat, type StageCast } from "@/stories/casts";
import c from "./cast.module.css";

// Runs a scroll story (Kriv's rules, 2026-11-16):
//  - One scroll, swipe or arrow key moves exactly one chapter, and the chapter
//    fills the window while its narration plays.
//  - The next chapter opens only when the current one has finished: its
//    recording has ended, or, with no sound, after a short reading pause.
//  - During that first pass the story only plays forward: no going back to an
//    earlier chapter. Once every chapter has been through once, the page
//    scrolls freely in both directions, on this visit and later ones
//    (remembered in the browser only).
//  - Visitors who ask their device for reduced motion are never held.
// It reads scroll position and plays local audio: nothing is sent anywhere.
// Without scripts the story is a plain page of chapters with a still drawing.
//
// Narration: browsers do not let a page make sound until the visitor has
// tapped, clicked or pressed a key, so until then the button reads "Tap to hear
// narration" and the first touch starts the chapter in view. A chapter with
// data-audio plays that recording (the voice explains the screen; it does not read it) through one shared player (phones only let a
// player that a touch started play again later). If a recording cannot play,
// the device's own built-in voice reads the chapter's on-screen title and narration (local voices only).

const PAUSE = 2500; // reading time for a chapter that plays no sound
const SAY = 2800; // how long a cast bubble stays up
const QUIET = "journey-cast-quiet";
const VOICE = "journey-voice"; // the page-wide narration on/off event

// `locked={false}` turns the hold off (a level that scrolls freely but still marks
// the stop in view); `narrate={false}` leaves out the narration and its button.
export function JourneyScroller({ id, className, voiceClassName, cueClassName, defaultVoice = true, locked = true, narrate = true, cast, sound, soundButton = true, children }: { id: string; className: string; voiceClassName: string; cueClassName: string; defaultVoice?: boolean; locked?: boolean; narrate?: boolean; cast?: StageCast | null; sound?: { ambient: string; sting: string | null } | null; soundButton?: boolean; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [voice, setVoice] = useState(defaultVoice);
  const [waiting, setWaiting] = useState(false);
  const [step, setStep] = useState(0);
  // A story that is not locked is free from its first moment: nothing waits on a later frame to release it.
  const [opened, setOpened] = useState(locked ? 0 : Number.MAX_SAFE_INTEGER); // the furthest chapter the visitor may go to
  const [free, setFree] = useState(!locked);
  const [inView, setInView] = useState(false);
  const [held, setHeld] = useState<"" | "playing" | "forward">("");
  // The cast: which chapter's character is on stage, whether its bubble is up, and the usher's extras.
  const [onStage, setOnStage] = useState(-1);
  const [said, setSaid] = useState(false);
  const [aside, setAside] = useState<CastBeat | null>(null);
  const [ending, setEnding] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [calm, setCalm] = useState(false);
  const sayTimer = useRef(0);
  const castRef = useRef({ quiet: false, calm: false });
  const current = useRef(0);
  const open = useRef(locked ? 0 : Number.MAX_SAFE_INTEGER);
  const freed = useRef(!locked);
  const player = useRef<HTMLAudioElement | null>(null);
  const timer = useRef(0);
  const watch = useRef(0);
  const key = `journey-done:${id}`;
  // Sound (decoration only, src/sections/storySound.ts): the room, a sting when a quiet chapter arrives,
  // and each chapter's beat effect once its narration has ended. Never over a voice.
  const [soundOn, setSoundOn] = useState(true);
  const voicing = useRef(false);
  const cued = useRef(new Set<number>());
  const speakingNow = useCallback((on: boolean) => { if (voicing.current !== on) { voicing.current = on; voiceSound(on); } }, []);

  const chapters = useCallback(() => [...(root.current?.querySelectorAll<HTMLElement>("[data-journey-step]") ?? [])], []);

  /** A chapter has been through: the next one opens, and after the last the story is free. */
  /** A chapter's character steps out and says its line: only ever called once that chapter's narration is over. */
  const say = useCallback((index: number) => {
    if (!cast?.beats[index] || castRef.current.quiet || castRef.current.calm) return;
    window.clearTimeout(sayTimer.current);
    setAside(null);
    setOnStage(index);
    setSaid(true);
    sayTimer.current = window.setTimeout(() => setSaid(false), SAY);
  }, [cast]);

  const finish = useCallback((index: number) => {
    speakingNow(false);
    // The chapter's beat effect, once per chapter per visit, after its narration.
    if (sound && !cued.current.has(index)) { cued.current.add(index); playCue(chapters()[index]?.dataset.sfx); }
    if (index === current.current) say(index);
    if (index + 1 > open.current) { open.current = index + 1; setOpened(index + 1); }
    if (index >= chapters().length - 1 && !freed.current) {
      freed.current = true;
      setFree(true);
      if (locked && cast) { setEnding(true); window.setTimeout(() => setEnding(false), SAY + 1200); }
      if (locked) try { window.localStorage.setItem(key, "1"); } catch { /* private window: this visit only */ }
    }
  }, [chapters, key, locked, cast, say, sound, speakingNow]);

  // Chapter in view, paging and the hold on skipping ahead.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const steps = chapters();
    const scenes = [...el.querySelectorAll<SVGElement>("[data-journey-scene]")];
    const topOf = (n: number) => steps[n].getBoundingClientRect().top + window.scrollY;
    const limit = () => topOf(Math.min(open.current, steps.length - 1));
    // The earliest point the visitor may be at: the chapter they have reached (the page top before chapter 2).
    let reached = 0;
    const floor = () => (reached > 0 ? topOf(reached) : 0);
    let busy = 0;
    let lastWheel = 0;
    let touchY: number | null = null;
    let holdTimer = 0;
    let landTimer = 0;

    // Free from the start for returning visitors and for reduced motion.
    // A timer, not an animation frame: frames can be held back in a background tab, and a returning
    // visitor must not find the story locked because of that.
    const release = window.setTimeout(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let hushed = false;
      try { hushed = window.localStorage.getItem(QUIET) === "1"; } catch { /* no storage */ }
      castRef.current = { quiet: hushed, calm: reduced };
      setCalm(reduced); setQuiet(hushed);
      let done = !locked || reduced;
      if (locked) try { done = done || window.localStorage.getItem(key) === "1"; } catch { /* no storage */ }
      if (done) { freed.current = true; open.current = steps.length; setOpened(steps.length); setFree(true); }
    }, 0);

    const inStory = () => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5; };
    let seen = false;
    const check = () => {
      // Narration only runs while this story is the one on screen.
      if (inStory() !== seen) { seen = !seen; setInView(seen); }
      // Hold: nothing past the furthest opened chapter, however the page is moved.
      if (!freed.current && Date.now() >= busy) {
        if (window.scrollY > limit() + 4) window.scrollTo({ top: limit(), behavior: "instant" });
        else if (window.scrollY < floor() - 4) window.scrollTo({ top: floor(), behavior: "instant" });
      }
      const line = window.innerHeight * 0.6;
      let now = 0;
      steps.forEach((s, i) => { if (s.getBoundingClientRect().top < line) now = i; });
      if (el.dataset.step !== String(now)) {
        el.dataset.step = String(now);
        // How far along the story is, 0 to 1: the world behind it (JourneyWorld) travels with it.
        el.style.setProperty("--journey-t", String(steps.length > 1 ? now / (steps.length - 1) : 0));
        [...steps, ...scenes].forEach((s) => s.removeAttribute("data-active"));
        steps[now]?.setAttribute("data-active", "");
        scenes[now]?.setAttribute("data-active", "");
        current.current = now;
        if (now > reached) reached = now;
        setStep(now);
      }
    };
    check();
    let frame = 0;
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; check(); }); };
    const tick = window.setInterval(check, 500);

    let teased = false;
    const hold = (why: "playing" | "forward") => {
      setHeld(why); setSaid(false); setAside(null);
      window.clearTimeout(holdTimer);
      holdTimer = window.setTimeout(() => {
        setHeld("");
        // Once per visit, after the usher's notice, the heckler may tease the attempt to go backwards.
        if (why === "forward" && cast?.tease && !teased && !castRef.current.quiet && !castRef.current.calm) {
          teased = true;
          setAside(cast.tease);
          window.clearTimeout(sayTimer.current);
          sayTimer.current = window.setTimeout(() => setAside(null), SAY);
        }
      }, 2400);
    };
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
      if (direction < 0) return now === 0 ? go(-1) : hold("forward");
      if (now + 1 > open.current) return hold("playing");
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
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY;
      if (top > limit() + 4) { event.preventDefault(); hold("playing"); }
      else if (top < floor() - 4) { event.preventDefault(); hold("forward"); }
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
      window.clearInterval(tick); window.clearTimeout(holdTimer); window.clearTimeout(landTimer); cancelAnimationFrame(frame); window.clearTimeout(release);
    };
  }, [chapters, key, locked, cast]);

  const hush = useCallback(() => { speakingNow(false); player.current?.pause(); window.speechSynthesis?.cancel(); window.clearTimeout(timer.current); window.clearInterval(watch.current); }, [speakingNow]);

  /** Plays one chapter's narration, and marks the chapter finished when it ends. */
  const play = useCallback((index: number) => {
    const chapter = chapters()[index];
    if (!chapter) return;
    hush();
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
      line.addEventListener("start", () => speakingNow(true));
      line.addEventListener("end", done);
      within(1500 + words.length * 65);
      window.speechSynthesis.speak(line);
    };
    const recording = chapter.dataset.audio;
    if (!recording) return speak();
    const audio = player.current ?? (player.current = new Audio());
    audio.setAttribute("src", recording);
    within(30000);
    audio.play().then(() => { setWaiting(false); speakingNow(true); }).catch((error: unknown) => {
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
  }, [chapters, finish, hush]);

  // Each chapter starts its narration as it comes into view; with narration off it takes a reading pause.
  useEffect(() => {
    if (!narrate || !inView) return hush();
    if (voice) play(step);
    else { hush(); timer.current = window.setTimeout(() => finish(step), PAUSE); }
    return hush;
  }, [narrate, inView, voice, step, play, hush, finish]);

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

  // Sound: the room is set at once and starts with the visitor's first gesture (browsers allow nothing sooner).
  useEffect(() => {
    if (!sound) return;
    const read = window.setTimeout(() => setSoundOn(!soundOff()), 0);
    setRoom(sound.ambient);
    const begin = () => wake();
    const events = ["pointerdown", "keydown", "touchend"] as const;
    events.forEach((name) => window.addEventListener(name, begin, { once: true }));
    const follow = (event: Event) => setSoundOn(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener(SOUND_EVENT, follow);
    return () => { window.clearTimeout(read); events.forEach((name) => window.removeEventListener(name, begin)); window.removeEventListener(SOUND_EVENT, follow); };
  }, [sound]);
  // A chapter that arrives without a voice (narration off, a level without narration, or a story already
  // through) gets the world's sting. A narrated chapter does not: its voice comes first.
  useEffect(() => {
    if (!sound?.sting || !inView || step === 0) return;
    if (narrate && voice && !free) return;
    playCue(sound.sting, "sting");
  }, [sound, inView, step, narrate, voice, free]);

  // Narration on or off is one setting for every story on the page (the story and its level two).
  useEffect(() => {
    const follow = (event: Event) => setVoice(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener(VOICE, follow);
    return () => window.removeEventListener(VOICE, follow);
  }, []);
  const press = () => {
    if (voice && waiting) play(current.current);
    else window.dispatchEvent(new CustomEvent<boolean>(VOICE, { detail: !voice }));
  };
  const ready = opened > step;
  // The cast speaks one at a time, and never over the narration (see castVoice).
  const castOn = Boolean(cast) && !quiet && !calm;
  const beat = aside ?? (onStage === step ? cast?.beats[step] ?? null : null);
  const voiceNow = castVoice({ enabled: Boolean(cast), quiet, reducedMotion: calm, narrating: !ready && !free, chapterEnded: Boolean(beat), held: Boolean(held) });
  const speaking = voiceNow === "member" && (said || Boolean(aside));
  const notice = held === "playing" ? cast?.words?.playing ?? "This chapter is still playing. The next one opens when it ends." : held === "forward" ? cast?.words?.forward ?? "The story plays forward. You can move freely once it ends." : "";
  // While a character is speaking the "next chapter" notice waits its turn.
  const cue = notice || (ending && cast ? cast.end : free ? "" : ready && !speaking ? cast?.words?.next ?? "Scroll for the next chapter" : "");
  const hushCast = () => {
    const next = !quiet;
    castRef.current.quiet = next;
    try { window.localStorage.setItem(QUIET, next ? "1" : "0"); } catch { /* this visit only */ }
    setQuiet(next);
  };

  return <div ref={root} className={className} data-free={free ? "" : undefined} data-ready={ready ? "" : undefined} data-held={held ? "" : undefined} data-cast-on={castOn ? "" : undefined}>
    {narrate ? <p className={voiceClassName}>
      <button type="button" data-voice-button="" aria-pressed={voice} onClick={press}>{!voice ? "Narration off" : waiting ? "Tap to hear narration" : "Narration on"}</button>
      {sound && soundButton ? <button type="button" className={c.quiet} data-sound-button="" aria-pressed={soundOn} onClick={() => setSound(!soundOn)}>{soundOn ? "Sound on" : "Sound off"}</button> : null}
      {cast ? <button type="button" className={c.quiet} data-cast-quiet="" aria-pressed={!quiet} onClick={hushCast}>{quiet ? "Cast off" : "Cast on"}</button> : null}
    </p> : null}
    {locked ? <p className={cueClassName} role="status">{cast ? <span className={c.usher} aria-hidden="true">{cast.art.usher}</span> : null}<span>{cue}</span></p> : null}
    {cast ? <div className={c.cast} data-cast="" data-on={castOn ? "" : undefined} data-quiet={quiet ? "" : undefined} data-shown={beat && castOn ? "" : undefined} data-speaking={speaking ? "" : undefined}>
      <button type="button" className={c.character} data-role={beat?.role} data-expression={beat?.face ?? "neutral"} data-move={beat?.move ?? "hop"} tabIndex={beat && castOn ? 0 : -1} aria-label={beat ? `${beat.name} says: ${beat.text} Press to hear it again.` : "Cast"} onClick={() => (aside ? setAside(null) : say(step))}>{beat ? cast.art[beat.role] : null}</button>
      <p className={c.bubble} aria-hidden="true">{beat ? <><b>{beat.name}</b>{beat.text}</> : null}</p>
    </div> : null}
    {children}
  </div>;
}
