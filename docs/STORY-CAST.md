# The story cast

Small characters that react to a story site: to the scene, to each other and to
what the visitor does. Preview-only. The engine is shared; **a new business
needs one new cast file and nothing else.**

## The four roles

| Role | Voice | What it does |
| --- | --- | --- |
| Guide | serious | Points at the part of the drawing that matters and names it. Opens and closes the story. |
| Expert | serious | Adds one true, general fact. |
| Heckler | playful | Teases the frame or the other characters. Never the visitor. |
| Usher | dry | Speaks only about what the visitor does: the two lock notices, the "next chapter" cue, the end line. |

`storyCast` in a lead's record: `off`, `serious` (the default on client sites:
guide, expert and usher) or `full` (all four). KRIV's own rates page runs `full`.

## Rules the engine keeps (do not work around them)

- One voice at a time. A character speaks only after the chapter's narration has ended.
- At most one appearance per chapter, gone in about three seconds; tapping the character repeats the line.
- Speech is a short text bubble. The cast has no audio.
- A cast is decoration: no fact may appear only in a bubble, and the page is complete without scripts.
- Off for reduced motion. One small "Cast on/off" button, remembered in the browser.
- Characters never cover the narration text, the brand mark, the chapter marks or the controls.
- All drawings are original inline SVG in the theme's colours (CSS variables). No image files, no third-party GIFs, emoji, stickers or character art.

## Rules for the lines

- The heckler never targets the visitor: nothing about anyone's teeth, habits, looks or business.
- Serious lines are general facts. No claims, reviews, awards, results, prices or promises.
  On KRIV's rates page, figures come only from `src/offers/ph-local.ts`, written with template values, never typed in.
- Do not change the words of a story chapter to fit a line. Write the line to fit the chapter.
- Lines are drafts until the client approves them: keep `draft: true` in the cast file until then.

## Adding a business

1. Copy `src/stories/casts/dental.tsx` to `src/stories/casts/<business>.tsx`.
2. Draw four characters with `Figure` and `Face` from `src/sections/CastParts.tsx`.
   Each is a 120 x 140 box; `Face` supplies the six shared expressions
   (neutral, happy, surprised, thinking, cheeky, concerned). Use `var(--ink)`,
   `var(--accent)`, `var(--surface)` for colour. Give each `Figure` a plain label.
   A human character must read as an adult professional, in ordinary work clothes.
3. Write the lines: for each role, a list per chapter id (the ids in the story file,
   for example `src/stories/dental-journey.ts`). One short sentence each. A line may
   set `face` and `move` (wave, point, nod, shrug, peek, hop).
4. Write `tease` (the heckler's one remark when the visitor scrolls backwards; about the
   act, never the person) and `end` (the usher's line after the last chapter).
5. Pass the file to `buildCast` where the story is rendered (see `JourneySite.tsx`).
6. Add the file to the checks in `tests/cast.test.tsx` and run the five checks.

Nothing in the engine, the stylesheets or the randomizer needs to change.

## Genres: the costume layer

A genre dresses any cast without touching its lines (`src/stories/casts/genres.tsx`).
It gives each role a title after its name, one small prop, and gives the usher its
own wording for the lock notices and the "next chapter" cue.

| Genre | Guide | Expert | Heckler | Usher | Suits chapters named |
| --- | --- | --- | --- | --- | --- |
| `film-crew` | director, megaphone | script supervisor, script | blooper reel, popcorn | clapper loader, clapperboard | scenes |
| `ships-crew` | captain, wheel | navigator, compass | stowaway, barrel | bosun, signal flag | chapters |
| `kitchen-brigade` | head chef, hat | sous chef, whisk | taster, spoon | expediter, bell | pages |
| `pit-crew` | crew chief, headset | race engineer, wrench | backmarker, tyre | flag marshal, chequered flag | stops |
| `plain` | no costume | | | | only by pinning |

The story's seed chooses the genre: two looks in three wear the genre that suits
their chapter naming, the third is the seed's own pick. Pin one in the lead's
record (`"storyStyle": { "genre": "film-crew" }`) or with
`pnpm story:shuffle <slug> --genre film-crew`. PCO and the rates page are pinned
to `plain`. Preview any seed without changing a record: `?look=<seed>`.

To add a genre: add its name to `journeyGenres` and `lorePartners` if it suits a
naming (`src/stories/journey-style.ts`), then its titles, four props (40 x 40
inline SVG) and wording in `genres.tsx`. The wording is about the story's own
controls only: no facts and no figures. `tests/genre.test.tsx` checks the rest.

## Where things live

- Engine hooks: `src/sections/JourneyScroller.tsx` (`castVoice` decides who may speak).
- Casting a story: `src/stories/casts/index.ts` (`buildCast`).
- Drawings' shared parts: `src/sections/CastParts.tsx`. Styles: `src/sections/cast.module.css`.
- Casts: `src/stories/casts/dental.tsx`, `rates.tsx`. Genres: `genres.tsx`.
- Tests: `tests/cast.test.tsx`, `tests/genre.test.tsx`, `tests/layout.test.tsx`.
