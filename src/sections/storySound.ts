// The sound engine for story sites (preview-only). One per page, shared by the story and its
// level two. Rules it keeps:
//   - Nothing plays before the visitor's first tap, click or key (the browser's rule, and ours).
//   - Narration wins: the room drops to a third while a voice plays, and no effect starts over a voice.
//   - Sound on or off is one setting, remembered in the browser, separate from narration and cast.
//   - Reduced motion keeps the room and the beat effects, but drops the chapter stings and the
//     small pitch changes.
// See src/stories/story-sound.ts for what plays where.

export const SOUND_KEY = "journey-sound-off";
export const SOUND_EVENT = "journey-sound"; // detail: true = on

type Engine = { ctx: AudioContext; master: GainNode; room: GainNode; fx: GainNode; buffers: Map<string, Promise<AudioBuffer | null>>; ambient: string | null; source: AudioBufferSourceNode | null };
let engine: Engine | null = null;
let speaking = 0; // how many voices are playing now
let wantedRoom: string | null = null;
const ROOM = 0.5;

export function soundOff(): boolean {
  try { return window.localStorage.getItem(SOUND_KEY) === "1"; } catch { return false; }
}
const calm = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function load(url: string): Promise<AudioBuffer | null> {
  const e = engine!;
  let hit = e.buffers.get(url);
  if (!hit) {
    hit = fetch(url).then((r) => r.arrayBuffer()).then((b) => e.ctx.decodeAudioData(b)).catch(() => null);
    e.buffers.set(url, hit);
  }
  return hit;
}

/** Starts the engine. Only call from a visitor's gesture. */
export function wake() {
  if (typeof window === "undefined") return;
  if (!engine) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const master = ctx.createGain(); master.gain.value = soundOff() ? 0 : 1; master.connect(ctx.destination);
    const room = ctx.createGain(); room.gain.value = 0; room.connect(master);
    const fx = ctx.createGain(); fx.gain.value = 0.8; fx.connect(master);
    engine = { ctx, master, room, fx, buffers: new Map(), ambient: null, source: null };
  }
  if (engine.ctx.state === "suspended") void engine.ctx.resume();
  if (wantedRoom) setRoom(wantedRoom);
}

/** The ambient loop for the page. Safe to call before the engine wakes: it starts on waking. */
export function setRoom(url: string) {
  wantedRoom = url;
  const e = engine;
  if (!e || e.ambient === url) return;
  e.ambient = url;
  void load(url).then((buffer) => {
    if (!buffer || e.ambient !== url) return;
    e.source?.stop();
    const s = e.ctx.createBufferSource(); s.buffer = buffer; s.loop = true; s.connect(e.room); s.start();
    e.source = s;
    const t = e.ctx.currentTime;
    e.room.gain.cancelScheduledValues(t); e.room.gain.setValueAtTime(e.room.gain.value, t);
    e.room.gain.linearRampToValueAtTime(speaking ? ROOM * 0.35 : ROOM, t + 2.5);
  });
}

/** A voice started (true) or stopped (false). The room ducks under it, and effects wait. */
export function voice(on: boolean) {
  speaking = Math.max(0, speaking + (on ? 1 : -1));
  const e = engine;
  if (!e) return;
  const t = e.ctx.currentTime;
  e.room.gain.cancelScheduledValues(t); e.room.gain.setValueAtTime(e.room.gain.value, t);
  e.room.gain.linearRampToValueAtTime(speaking ? ROOM * 0.35 : ROOM, t + 0.6);
}

/** Plays one effect. Skipped while a voice is playing, and for stings under reduced motion. */
export function cue(url: string | null | undefined, kind: "beat" | "sting" = "beat") {
  const e = engine;
  if (!url || !e || speaking || soundOff()) return;
  if (kind === "sting" && calm()) return;
  void load(url).then((buffer) => {
    if (!buffer || speaking) return;
    const s = e.ctx.createBufferSource(), g = e.ctx.createGain();
    s.buffer = buffer; g.gain.value = kind === "sting" ? 0.6 : 1;
    if (!calm()) s.playbackRate.value = 0.97 + Math.random() * 0.06;
    s.connect(g); g.connect(e.fx); s.start();
  });
}

/** Sound on or off, for every story on the page. */
export function setSound(on: boolean) {
  try { window.localStorage.setItem(SOUND_KEY, on ? "0" : "1"); } catch { /* this visit only */ }
  if (on) wake();
  const e = engine;
  if (e) { const t = e.ctx.currentTime; e.master.gain.cancelScheduledValues(t); e.master.gain.setValueAtTime(e.master.gain.value, t); e.master.gain.linearRampToValueAtTime(on ? 1 : 0, t + 0.3); }
  window.dispatchEvent(new CustomEvent<boolean>(SOUND_EVENT, { detail: on }));
}
