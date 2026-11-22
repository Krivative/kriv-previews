# Effects arsenal (backgrounds, movement, interaction)

2026-11-23. Kriv, on pinning /ph-rates seed 211: "keep all effects in the arsenal so we always have depth when making websites. Always take into account minuscule details like these effects, backgrounds, interactivity, etc. when using the randomizer for websites."

Nothing here is deleted when a seed is pinned. Every effect below stays in the code, stays reachable through `?seed=` outside production, and is a trait the randomizer can draw. All of them are drawn in code (no images, no paid assets), use brand colours from CSS tokens (`--ink`, `--paper`, `--care`, `--sand`, signal lime `#e7fa78`), pause off screen, draw one still frame with reduced motion, and leave the content readable without JavaScript.

Source today: `src/sections/` on branch `claude/ph-rates-seeded` (the /ph-rates page). The names start with `Ph` because they were born there. They take no PH-specific data and can be lifted into any site as they are.

## The catalog

### Hero backgrounds (`PhBackdrop.tsx`, trait `backdrop`)
| Effect | What it does | Pointer / touch | Seen in |
|---|---|---|---|
| glow | Soft colour glows in the brand spectrum (CSS only, cheapest) | none | 201-203 |
| veil | Paper with ruled lines laid over a living sea (`PhSea` tide palette); the pointer lifts a soft hole to show the water | follows pointer; drifts by itself on phones, tracking the visible part of tall sections | 204 hero; 207-212 under "How your plan builds" |
| contour | Sea-chart contour lines (marching squares over a wave field), every fourth line Care blue | lines swell around the pointer | 205, 207-212 hero |
| halftone | Printer's dot field; can print the kriv wordmark on load (clock-based, so it works in background tabs); a wave runs through it | dots swell and turn Care blue under the pointer | 206 hero; 207-209 figures; 210-212 packages + estimate |
| halftone, pinned | Same, as a one-screen sticky canvas inside a long run of sections; dots are offset by scroll so they stay printed on the page | same | 210-212 (packages and estimate as one surface) |
| sea | The living-water hero (`PhSea.tsx`, light/dark/tide palettes) | ripples | 201 |

### Section layers (`PhLayers.tsx`, traits `figuresLayer`, `detailsLayer`, pool `PH_LAYERS`)
| Effect | What it does | Pointer / touch |
|---|---|---|
| aurora | Three brand-spectrum glows (Care, lime, sand) wander slowly | the nearest glow follows the pointer |
| chart | Graph paper drifting sideways, every fourth line Care blue | bends like a lens around the pointer (a wandering lens on phones) |
| ripple | Sonar rings from a wandering point every 1.5 s | the pointer drops rings where it moves |
| drift | Thin currents like wind on water, with faded trails | currents curl around the pointer |

Rule built in: the two sections on one page never get the same layer.

### Movement (`PhEffects.tsx`, trait `motion`)
- **reveal**: the hero rises in; `[data-reveal]` items rise as they enter; `[data-count]` numbers count up; `[data-progress]` gets `--p` (0 to 1) as it scrolls, and lights its `[data-i]` children (the 14-day rail fills, a footer wordmark inks in).
- **calm**: still.

### Interaction (`PhEffects.tsx`, trait `touch`)
- **tilt**: the hero's floating cards move with the pointer at different depths (`--tx`, `--ty`).
- **magnet**: buttons marked `data-magnet` lean toward the pointer.

### Cards around the hero (trait `cards`)
- **corners**: four plan cards in the hero's corners at different depths; below 1360 px they line up under the text, two columns on phones.
- **floating** hero (trait `hero`): drifting product cards beside the headline.

### Story (`PhStory.tsx`, trait `story`)
- **pinned**: a sticky card that changes as the steps scroll past.
- **timeline**: the steps on one rail that fills as you scroll.

### Marquees (`PhMarquee.tsx`, part of `under: "rich"`)
- **line**: a thin mono ticker (a real list, such as the services); screen readers read one copy.
- **big**: large italic Fraunces facts at the foot of a band, running the other way.
- Both pause on hover and stand still with reduced motion. Content must be real data from the page (never invented claims).

### Footers that play with the logo (`PhLogoPlay.tsx`, trait `footer`)
| Effect | Colour | What it does |
|---|---|---|
| wordmark | ink | giant spectrum kriv× |
| inkfill | ink | kriv× inks in as you reach the end of the page |
| lime (repel) | signal lime | letters lean away from the pointer; the × faces it and spins on click |
| care (wave) | Care blue | letters bob like water, higher near the pointer; click to splash |
| sand (drag) | Operations sand | pick up any letter and throw it; it springs home |
| band | plain | quiet footer |
Taps make letters jump on phones; with reduced motion the logo stays still.

## The randomizer checklist (every website, not only /ph-rates)

When a randomizer composes a site, it rolls the small things too, not just the colours and fonts. Each candidate should state its pick for every line:

1. **Hero background**: glow / veil / contour / halftone / sea, or a new one.
2. **Background per section**: every section that would otherwise sit still gets a layer from the pool (aurora / chart / ripple / drift / halftone / veil), no two neighbours the same, and the text stays readable (low strength, panels where needed).
3. **Movement**: reveal or calm; count-ups for real figures; scroll progress for timelines.
4. **Interaction**: tilt / magnet / none; something answers the pointer in the hero and near the end.
5. **Marquee**: none, one or two, carrying real content (services, offer facts), placed where it reads as part of the page.
6. **Footer and logo**: one of the logo-play footers, the business's own mark in place of kriv× for client sites.
7. **Closing band**: tight spacing, readable contrast in every colourway.
8. **Fallbacks**: reduced motion, no JavaScript, phones (no sideways scroll), background tabs.

New effects are added to this file and to a trait pool, so the arsenal only grows. Pinning a seed never removes an effect.
