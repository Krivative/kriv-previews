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
- `pnpm recall <words>`: search the project's memory (this file, docs/DECISIONS.md, HANDOFF.md, the roadmap, commits) and print only the matches.
- `pnpm workflow:check`: the numbers this file's last section is built from.

## What is live (17 Nov 2026)
- `kriv.agency/pco-dental-clinic`: dental story in the grown-up register (`audience: adults`, porcelain and teal, no cast, no scenery). Offer at `/for/pco-dental-clinic/offer`. Record still has placeholders (hours, services, team).
- `kriv.agency/ph-rates`: KRIV's Philippine rates story (sand and violet, cat-eared host, the road).
- `kriv.agency/dv-shop-cebu`: sneaker story, brand revamp and offer.
- 161 other concept sites from templates (US and Canada), no offer pages yet. The price-free `consult-first` offer exists for them but is on no live lead until Kriv approves its wording.
- Main site `Krivative/Kriv`: producer opening live; the studio floor and community restyle wait in draft pull request 24.

## How a story site is made (details in the `story-site` skill and `docs/STORY-CAST.md`)
1. Decide who it is for FIRST: `storyStyle.audience` (`adults` for general and aesthetic practices). The randomizer then stays in that register.
2. Let the seed choose the look; pin only what the client asked for.
3. A new business needs a story file, a cast file (if it has a cast) and narration recordings. Nothing in the engine changes.
4. An offer needs a plan for the business's market: `ph-local` (Philippine prices) or `consult-first` (no prices, any other market). `pnpm offer:ready <slug> --add` picks the right one.

## Waiting on Kriv
- Pricing (Discord, email, LinkedIn, US free website, services sheet, seed 110 look) is LIVE: PRs 3 and 2 merged 22 Nov on Kriv's "publish". Open: the US buyout fee and the LinkedIn Presence price. Handover in docs/PRICING-REVIEW.md.
- /ph-rates seeded redesign on `claude/ph-rates-seeded` (not pushed). Round 3 (23 Nov): Kriv chose 205's hero with 204's sea and 206's dots below; seeds 207 (lime footer, push the logo), 208 (Care blue, make waves), 209 (sand, throw the letters). Waiting on Kriv's footer pick, then PH_PINNED_SEED and "publish".
- Review the 22 Nov PH and USD pricing previews and reconcile the sent-lead roster in docs/PRICING-REVIEW.md before publish.
- PCO: the clinic's real hours, services and team (booking method, self-description and service area now come from its public Facebook page); approval of cast lines (drafts).
- An adult story spine for PCO (general care, then aesthetics) and its recording.
- "Consult first" wording is approved (17 Nov). Add it to a lead only when that lead is next sent (`pnpm offer:ready <slug> --add`), never in bulk.
- Phone styles A (Stories) and C (Map walk) are being built in the phone session; they will need "publish". kriv.agency: pull request 24 is superseded; `claude/community-structure` needs a pull request and Kriv's look at the preview.

## Nothing gets lost
- Every decision from Kriv goes into `docs/DECISIONS.md` as one dated line, the day he makes it. Append only.
- Every finished stage gets a dated entry in HANDOFF.md and a commit. If it is not written down and committed, it is not remembered.
- To remember, search (`pnpm recall`), then open the file at the line it names. Do not re-read whole files to find one fact.

## Working cheaply (measured 17 Nov: six sessions, 2,159 turns)
Three quarters of all usage was re-reading the conversation on every turn, not doing work. So:
- One task per session. Start a fresh session for the next task; this file is what it needs.
- Never paste or read long things into the conversation: send command output to a log and print only failures; search notes, do not read them whole.
- Measure with a script (`pnpm look`, `pnpm preflight`) instead of taking screenshots; screenshot only what a person must judge by eye.
- Batch: one command that does five things beats five commands.
- Never put long text in a URL or a tool call that gets echoed back.
