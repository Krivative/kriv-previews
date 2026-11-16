---
name: website-game-soundscape
description: Build a game-style sound kit (ambient loop, scroll and click effects, drop-in JS engine, cue sheet) for a story or scroll website. Use when asked to add sound effects or ambience to a site.
---

# Website game soundscape

Makes a website feel like a game environment: one ambient loop per site, short effects tied to story beats, UI sounds, and a small engine that plays them. For KRIV story sites in this repo, use `story-site-sound` instead (it plugs into the randomizer and the scroller).

## 1. Plan the cues first
List the site's chapters or sections and give each moment one sound. Name the feel of the whole site in one line.
- 1 ambient loop per site (30 s, loop: true).
- 1 effect per story beat (1 to 3 s).
- Shared UI set: hover, click, open.
Nothing musical except short jingles (level complete, level up).

## 2. Generate with Magnific (ElevenLabs sound effects)
- Price first with `simulate_cost` (about 5 credits per second).
- `audio_sfx_generate`. Ambience: 30 s, `loop: true`, prompt names the room and its sources, ends "no voices, no music, seamless background loop". Effects: 1 to 3 s, name the source, the surface and "short".
- No drills or pain sounds on clinic sites.
- `creations_wait`, then `creations_register_download` BEFORE downloading; curl each URL with `</dev/null` (or `ffmpeg -nostdin`) inside read loops.

## 3. Process with ffmpeg
- Ambience: `loudnorm=I=-26:TP=-3:LRA=11`, MP3.
- Effects: trim silence both ends, `loudnorm=I=-18:TP=-2`, 5 ms fade in. If a file trims under 0.3 s, redo it with loudnorm only.

## 4. Engine
Web Audio: ambience fades in on the first tap, click or key (browsers allow nothing sooner); `data-sfx-enter`, `data-sfx-click`, `data-sfx-hover` hooks; narration ducks the ambience; one remembered Sound on/off button (storage in try/catch); small random pitch so repeats differ.

## 5. Deliver
Zip the sounds, the engine and a cue sheet (each element, its hook, its sound, install snippet, mix levels). Say plainly that the sounds were not listened to by Claude.
