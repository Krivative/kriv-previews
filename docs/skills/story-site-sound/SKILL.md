---
name: "story-site-sound"
description: "Add game-style ambience and sound effects to a KRIV story site (kriv-previews randomizer: theme, lore, genre, layout) so the sound follows the seeded look and never changes the story. Use for sound, ambience or SFX on story sites."
---

# Story site sound

The sound layer for KRIV story sites. It sits on top of the story-site build (repo `Krivative/kriv-previews`, plus the kriv.agency opening in `Krivative/Kriv`). It adds depth (an environment the visitor is inside, and game-style feedback) without touching the story the randomizer produced.

## What the randomizer already decides (read, never rewrite)
`src/stories/journey-style.ts`: `journeyStyle({ slug, storyStyle })` picks from a seed (default the slug):
- theme (11: 8 dark, 3 light), lore (chapters, scenes, stops, pages), genre (plain, film-crew, ships-crew, kitchen-brigade, pit-crew; tied to lore by `lorePartners` two times in three), side, orbit, and layout (marks, brand, voice, cue, words, map, cards, entrance) made safe by `resolveLayout`.
- `storyStyle` in `leads/<slug>.json` pins any part; `pnpm story:shuffle <slug>` reseeds; `?look=<seed>` previews.
- Pinned looks: PCO (night-lime, chapters, plain) and the rates page (`ratesStyle`, sand-violet, stops, plain).
The story's words, chapter ids, the narration files and the cast lines are fixed inputs. Sound is chosen to fit them; nothing is reworded to fit a sound.

## The sound look: chosen by the same seed
Add `sound` to the look, decided like every other part: `choice.sound ?? pick(soundWorlds, seed, "sound")`, pinnable as `storyStyle.sound`, with `--sound <name>` in `scripts/story-style.mjs`.
- One sound world per genre (the costume decides the room): film-crew = quiet sound stage (soft hum, distant crew, clapper on chapter change); ships-crew = night sea (waves, hull creak, bell on chapter change); kitchen-brigade = calm kitchen (low extractor, gentle simmer, order bell); pit-crew = garage before the race (distant engines, air tools, flag snap); plain = the business's own room (dental: bright clinic; rates: game lobby; agency: late night studio, in the zone).
- Two worlds in three follow the genre, the third is the seed's pick, like genre follows lore. Light themes play the same world a little brighter (less low end).
- The business layer always stays: each story file's beat effects (for dental: sparkle, crunch, squish, acid crack, lamp ding, brush, level complete, map pop, path whoosh) play whatever the world.

## Rules (do not work around them)
1. One voice at a time. Narration always wins: ambience ducks to 35% while a chapter's recording plays, and beat effects play on chapter arrival BEFORE the narration starts, or after it ends. Never over speech.
2. The cast has no audio. A cast appearance may get one soft pop at most, and only after narration has ended.
3. Sound is decoration. No fact, price, date or instruction may exist only as a sound. The page is complete muted.
4. One sound setting next to the narration and cast buttons, remembered in the browser (try/catch on storage). Narration on/off, cast on/off and sound on/off stay separate.
5. Nothing plays before the visitor's first tap, click or key (browser rule). Ambience fades in over 2.5 s.
6. Reduced motion does not mute sound, but drops the playback-rate variation and the chapter-change stings.
7. Level two (not locked) plays map pops and path whooshes as stops come into view; it does not loop stings while scrolling fast (one per stop per visit).
8. The scroll lock and the "next chapter" cue keep their timing. Sound never holds or speeds a chapter.
9. Clinic sites: no drills, no needles, nothing that sounds like pain. Kitchen and pit worlds stay soft.
10. No real brand sounds, logos, jingles or game sounds copied from existing games. All effects are generated fresh.

## Making the sounds (Magnific, ElevenLabs SFX)
- Ambient: `audio_sfx_generate`, 30 s, `loop: true`, prompt names the room and sources, ends "no voices, no music, seamless background loop".
- Effects: 1 to 3 s, prompt names source, surface and "short".
- `simulate_cost` first (about 5 credits per second). `creations_wait`, then `creations_register_download` BEFORE downloading; curl each URL with `</dev/null` (or `ffmpeg -nostdin`) inside read loops.
- ffmpeg: ambience `loudnorm=I=-26:TP=-3:LRA=11`; effects trim silence both ends, `loudnorm=I=-18:TP=-2`, 5 ms fade in; if a file trims under 0.3 s, redo it with loudnorm only. MP3 128k.
- Files: `public/audio/sound/<world>/` and `public/audio/sound/<business>/`, raise `?v=` when swapping.

## Wiring in kriv-previews
- Add `soundWorlds` and `sound` to `StoryStyleChoice`, `journeyStyle` and `lookAttributes` (`data-sound`).
- One shared Web Audio player (gain chain: master, ambience, effects). Hook it to `JourneyScroller.tsx`: chapter enter, narration start and end (the existing `journey-voice` event), level-two stop in view.
- Each story file (`dental-journey.ts`, `rates-journey.ts`, `clinic-level-two.ts`) may give a chapter `sfx: "<name>"`. Leaving it out is fine.
- kriv.agency opening (`components/producer-intro.tsx` in `Krivative/Kriv`) uses the plain agency world, the "in the zone" session: ping, plug-in, into-zone, keys, pulse, snap, success. No dancefloor, no story lock.
- Tests: every theme and genre resolves a sound world; a muted page has the same text as an unmuted one; no effect is scheduled while narration plays.

## Publishing
Local branch only. Nothing is pushed, merged or published without Kriv's explicit "publish". Update `HANDOFF.md` with what changed and what was not heard: Claude cannot listen to audio, so every sound must be spot checked by a person before publishing.