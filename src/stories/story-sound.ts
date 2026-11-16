import type { SoundWorld } from "./journey-style";

// Sound for story sites (preview-only). Two layers, both decoration: the page says everything
// with the sound off.
//   - The world: one ambient loop, and a short "sting" when a new chapter arrives. Picked by the
//     look's seed (`sound` in journey-style.ts), so each lead's site sounds as different as it looks.
//   - The business: one effect per story beat, keyed by chapter id. It plays after that chapter's
//     narration has ended, never over a voice, whatever the world.
// Files live in public/audio/sound/. The ?v= number changes when a file is swapped.
// No word of a story is changed to fit a sound: write the cue to fit the chapter.
const file = (path: string) => `/for/audio/sound/${path}.mp3?v=1`;

export type SoundBusiness = "dental" | "rates" | "agency" | "sneaker";

/** The room for a world. "plain" is the business's own room. */
export function soundRoom(world: SoundWorld, business: SoundBusiness) {
  // DV Shop Cebu's own room is its track, "In the Zone" (sneaker/ambient), looped.
  const room = world === "plain" ? business : world;
  // The business rooms have no chapter-change sting of their own: their beat effects carry the story.
  return { ambient: file(`${room}/ambient`), sting: world === "plain" ? null : file(`${world}/sting`) };
}

/** One effect per chapter id. Leaving a chapter out is fine. */
export const beatEffects: Record<SoundBusiness, Record<string, string>> = {
  dental: {
    smile: file("dental/sparkle"), tooth: file("dental/sparkle"), meal: file("dental/crunch"), plaque: file("dental/squish"),
    spot: file("dental/acid-crack"), checkup: file("dental/lamp-ding"), home: file("dental/brush"), again: file("dental/level-complete"),
    // Level two: each stop pops onto the map, and the path carries on to the next one.
    inside: file("dental/path-whoosh"), services: file("dental/map-pop"), about: file("dental/map-pop"), book: file("dental/map-pop"),
    visit: file("dental/map-pop"), social: file("dental/map-pop"), faq: file("dental/map-pop"),
  },
  rates: {
    start: file("rates/start"), trial: file("rates/unlock"), services: file("rates/select"), paying: file("rates/select"),
    annual: file("rates/coin"), dates: file("rates/timer"), bundles: file("rates/combo"), monthly: file("rates/page-flip"),
    yours: file("rates/stamp"), decide: file("rates/level-up"),
  },
  // DV Shop Cebu's story reuses existing effects (no new audio generated; not heard by Claude).
  sneaker: {
    fresh: file("rates/unlock"), legit: file("rates/stamp"), out: file("rates/page-flip"), care: file("rates/select"),
    routine: file("agency/keys"), visit: file("rates/coin"), anywhere: file("rates/level-up"),
  },
  // kriv.agency's opening, "in the zone" (used by Krivative/Kriv, listed here so both sites share one map).
  agency: {
    open: file("agency/ping"), day: file("agency/ping"), gaps: file("agency/plug-in"), work: file("agency/into-zone"),
    people: file("agency/keys"), owner: file("agency/pulse"), next: file("agency/success"),
  },
};
