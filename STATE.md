# STATE: KRIV Previews (read this first; keep it under 80 lines)

The short, current state. `HANDOFF.md` is the long history: do not read it whole.
Search it for the topic you are touching (`grep -n "<topic>" HANDOFF.md`) and read only that part.

## Rules that never change
- Ask Kriv before: pushing, merging, deploying, publishing a lead page, sending any email, DNS, billing, or anything in `Krivative/Kriv` beyond an open pull request. "Publish" is needed each time; one approval does not carry to the next.
- Never: invent reviews, results, prices, credentials, services or photos of real people; remove noindex, the concept banner or the inert links; commit secrets or private lead data; touch LinkedIn; call approval or publishing endpoints.
- Do not promise results, rankings, leads, uptime or round-the-clock cover. The competitor's name never appears on a client-facing page.
- Commit after each verified stage. Stage files by name, never `git add .`.

## Commands
- `pnpm preflight --status` before you start and before every publish: says if the live branch moved under you.
- `pnpm preflight` runs the five checks in one call (lint, typecheck, test, build, smoke).
- `pnpm offer:ready <slug>` / `--all`: is a lead ready to be sent its offer, and what blocks it.
- `pnpm look <slug>`: measures a story page at phone, tablet and desktop and prints one small table.
- `pnpm story:shuffle <slug> [--audience adults | --theme | --genre | --lore | --sound]`.
- `pnpm workflow:check`: the numbers this file's last section is built from.

## What is live (17 Nov 2026)
- `kriv.agency/pco-dental-clinic`: dental story in the grown-up register (`audience: adults`, porcelain and teal, no cast, no scenery). Offer at `/for/pco-dental-clinic/offer`. Record still has placeholders (hours, services, team).
- `kriv.agency/ph-rates`: KRIV's Philippine rates story (sand and violet, cat-eared host, the road).
- `kriv.agency/dv-shop-cebu`: sneaker story, brand revamp and offer.
- 161 other concept sites from templates (US and Canada), no offer pages.
- Main site `Krivative/Kriv`: producer opening live; the studio floor and community restyle wait in draft pull request 24.

## How a story site is made (details in the `story-site` skill and `docs/STORY-CAST.md`)
1. Decide who it is for FIRST: `storyStyle.audience` (`adults` for general and aesthetic practices). The randomizer then stays in that register.
2. Let the seed choose the look; pin only what the client asked for.
3. A new business needs a story file, a cast file (if it has a cast) and narration recordings. Nothing in the engine changes.
4. An offer needs a plan written for the business's market. Only `ph-local` exists.

## Waiting on Kriv
- Clinic's real hours, services, team and booking method for PCO; approval of cast lines (drafts).
- An adult story spine for PCO (general care, then aesthetics) and its recording.
- A price-free "consult first" offer page so leads outside the Philippines can have a presentation.
- Phone style pick (the phone audit session), kriv.agency pull request 24, Next.js security upgrade.

## Working cheaply (measured 17 Nov: six sessions, 2,159 turns)
Three quarters of all usage was re-reading the conversation on every turn, not doing work. So:
- One task per session. Start a fresh session for the next task; this file is what it needs.
- Never paste or read long things into the conversation: send command output to a log and print only failures; search notes, do not read them whole.
- Measure with a script (`pnpm look`, `pnpm preflight`) instead of taking screenshots; screenshot only what a person must judge by eye.
- Batch: one command that does five things beats five commands.
- Never put long text in a URL or a tool call that gets echoed back.
