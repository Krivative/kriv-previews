# Images for preview photo placeholders

Researched 2026-10-25 (Claude Code). Nothing installed or wired in yet. Rules: docs/PLAN.md section 3, guardrail 4.

## Where images go

`brand.photos` in a lead record (src/lib/site-schema.ts) is a list of image URLs or paths. `Photo` (src/sections/Photo.tsx) shows the image when a slot has one and a labelled placeholder when it does not. So filling placeholders needs no template change: put image files somewhere the app can serve them and list them in `brand.photos`, and add each image's source page to the lead's `sources`.

## herk-edit-kit (github.com/nateherkai/herk-edit-kit)

What it is: Nate Herk's video-editing kit for Claude Code and Codex, built on HyperFrames (HeyGen, Apache-2.0) and GSAP. MIT licence (2026, Nate Herk); its AIS logo, brand tokens and example project content are excluded from the MIT grant. It needs Node 22+, FFmpeg and Chrome. Its 15 skills cut silences and mistakes from your own footage, plan short-form edits, and build motion graphics. Output is video: `hyperframes render` takes `--format mp4|webm` only and has no still-image or PNG export.

Stills: the only image path is `.claude/skills/motion-showreel/scripts/kie.mjs image`, a small client for Kie.ai (a paid reseller of AI models). Without a reference it calls `seedream/5-pro-text-to-image`; with `--ref logo.png` it calls `seedream/5-pro-image-to-image`. It needs `KIE_API_KEY` and Kie.ai credits ("Every command is a PAID call on your own Kie.ai credits"). It is built for showreel hero objects, not photo sets.

Verdict: it can't fill the placeholders by itself. The kit's own tooling only makes video. Its one still-image route is a thin wrapper around a paid third-party API, which we could call directly without the kit. Not recommended for this job.

## Proposed approach

Two sources. Each needs Kriv's OK before any account, key or paid call.

1. **Licensed stock, no account: Openverse** (api.openverse.org, run by WordPress.org). Anonymous search works (checked 2026-10-25: 20 requests/min, 200/day), filtered to `license=cc0,pdm` (public domain, commercial use, no attribution needed). Every result carries `license`, `license_url`, `creator` and `foreign_landing_url`, which go into the lead's `sources`. Weak spot: coverage of generic, modern clinic and HVAC scenes is patchy, and many CC0 photos show a real named business, which we must not use.
2. **Licensed stock with a free account: Unsplash or Pexels API.** Much better coverage of generic scenes. Both licences allow commercial use with no attribution (Unsplash: no selling without significant modification, no building a competing service; Pexels: no implied endorsement by people or brands in the image, identifiable people not shown in a bad light, not part of a trade name). Each needs a free developer account and API key, so **ask Kriv first**. Download-tracking rules in their API terms also apply.
3. **AI-generated generic scenes (optional, paid): ask Kriv first.** Use OpenAI's image API, Google's Gemini image models or Kie.ai/Seedream directly, with prompts that name only the niche and services ("sunlit modern dental operatory, empty chair, no people, no text, no logos"). Check each provider's terms on output ownership and commercial use before the first call, and record model, prompt and date in `sources`.

## Rules for every image (all sources)

- Generic scene of the niche or service only: an empty treatment room, tools, a condenser unit, a skincare tray. Never the lead's own office, staff, building, logo, vehicles or results, and never anything that could pass for them.
- No visible business names, signs, logos, uniforms with logos, branded vans or readable text. No before/after or results images (med spa, dental).
- Prefer no identifiable people. If a person appears, they must not look like the lead's staff or patient. A small "Stock photo" caption under such images is the safe default.
- Match the lead's services from its sources (a lead offering implants gets an implant or chair scene, an HVAC lead doing heat pumps gets a heat pump), but not its location or equipment brands.
- Record for each image: source page URL, licence name and URL, creator, download date. Store the source page URL in the lead's `sources`; keep the full licence record next to the image file.
- Host the files ourselves, in the preview app's `public/` folder or the later database or blob store, not hot-linked. Licence and source travel with the file.

## Next step if approved

A `scripts/find-images.mjs <niche> <service...>` that searches Openverse (and Unsplash/Pexels if Kriv creates keys), shows candidates with their licence for Kriv to pick, downloads the chosen files and writes their licence records. Generated images only after Kriv approves a provider and budget.
