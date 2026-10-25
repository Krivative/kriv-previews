# HANDOFF: KRIV Previews

Any AI agent (Claude Code, Claude Cowork, ChatGPT/Codex or other) continuing this work: read this file top to bottom, then `docs/PLAN.md`. Update the "Latest checkpoint" section at the top after every verified stage, and tick docs/ROADMAP.md and send Kriv its PDF (see CLAUDE.md). Never mark something done that you have not verified.

## Latest checkpoint

- Date: 2026-10-25
- Agent: Claude Code (Windows desktop, PowerShell: use `corepack pnpm`, and `$env:NODE_PATH = (npm root -g)` for the Playwright scripts)
- Current phase: Phases 1, 2 and 3 done and live. Kriv approved going live on 2026-10-25: Krivative/Kriv#19 merged as `be83831`, production deployment `dpl_G3nuQV6UvDkScFkQPc1ZWU8tqWYG` serves kriv.agency (rollback target `dpl_36Ue9WMy5gs1iqkAuyUTdJoyhzoF`). Live checks 20/20: main-site pages unchanged from a pre-merge baseline, https://kriv.agency/test-lead and /Test-Lead show the preview with banner and noindex, /nope is 404 "Nothing here", robots.txt has `Disallow: /for/`. Release note in Krivative/Kriv#20 (open; merging redeploys the main site, needs Kriv). Status dashboard: `C:\Users\user\kriv-reports\status.html` (outside Git; regenerate with `node C:\Users\user\kriv-reports\build-status.mjs`). Templates for all 4 pilot niches approved; outreach footer and opt-out process done. Now: Phase 4 lead finder.
- Repos: `Krivative/kriv-previews` main at `2c34918` (branch `claude/amazing-edison-juyem3` fast-forwarded into main with Kriv's OK on 2026-10-25; production `dpl_Hknvh92tvv2VZppyz2Kg2zwuuX89`, 8/8 smoke checks; rollback target `kriv-previews-7oyb9vzpm-kriv5.vercel.app`). Work continues on the branch; each later merge to main needs Kriv's OK because it redeploys production; `Krivative/Site-Arsenal` work is on branch `claude/new-session-3jaiso` (audit + batch 5 templates, not merged to main); `Krivative/Kriv`: draft PR #19 only.
- Vercel: project `kriv-previews` in team Kriv (`team_yYcyLMl2aXoeWOfajA5FMlOh`). The Vercel connector can list projects but gets 403 on deployments, project creation and protected fetches.
- Network: Kriv widened the cloud environment's network access on 2026-10-24 (earlier sessions could not reach *.vercel.app, kriv.agency or business websites).
- Tests (2026-10-25): lint, typecheck, 87 unit tests, build, 8 smoke checks all pass locally (Windows).
- GitHub connector (Krivative) gets 404 on `Krivative/Kriv`; git over HTTPS works with the credential manager login, which Kriv allowed (2026-10-25) for PR #19 description updates.
- Roadmap with checkboxes: docs/ROADMAP.md; PDF snapshots in docs/reports/ (send Kriv a new PDF after every finished step, see CLAUDE.md).
- Next actions, in order:
  1. ~~Verify production~~ done 2026-10-24 (8/8).
  2. ~~Phase 3~~ verified 2026-10-25: https://github.com/Krivative/Kriv/pull/19 (draft, branch `claude/amazing-edison-juyem3`, head `91329b5`). Local check passed, Vercel build succeeded, and Kriv checked the PR's Vercel preview (see Current phase); the PR description records it. Do not merge: Kriv approves the merge and the main-site production deploy.
  3. Phase 4 lead finder for San Antonio TX (dental, HVAC, chiropractic, med spa): first run done 2026-10-25. 242 sites graded, 0 businesses met every rule (weak or no site AND a business mailbox); 28 sites sit behind bot walls or geo-blocks from Kriv's network in the Philippines. Review list: `C:\Users\user\kriv-leads\san-antonio-2026-10-25.md` (outside Git). Method, sources and checker caveats: docs/LEAD-FINDER.md. Waiting for Kriv to choose how to widen the search (see ROADMAP "Next up").
  4. Preview images: Unsplash chosen by Kriv (key in `.env.local`, never committed). Picker `scripts/pick-photos.mjs`; footer credit and schema rule in place (docs/PREVIEW-IMAGES.md).
  6. Lead finder Texas/Florida/Utah done 2026-10-25: 3 qualified (Florida HVAC) of the 10 targeted; drafts `leads/springer-bros.json`, `leads/air-source-1.json`, `leads/kyles-air-conditioning.json` (status draft: production serves them as 404 until Kriv approves, sets status approved and approves a merge to main). Email drafts in `C:\Users\user\kriv-leads\emails\` (outside Git). Lead Desk: `C:\Users\user\kriv-reports\leads.html` (rebuild with `node C:\Users\user\kriv-reports\build-leads.mjs`). Finder scripts used (outside the repo, in the session scratchpad): Hotfrog collector, ChamberMaster crawler, qualify step with MX check; worth moving into `scripts/` before a daily run.
  7. Kriv approved the 3 leads on 2026-10-25: status `approved` on the branch (production build serves them). Going live needs Kriv's OK to merge into main. Before Air Source 1's email: US re-check of its site. Lead finder round 2 (Kriv approved): one-off cloud routine on a US network (claude.ai/code/routines/trig_01CgTHbKXajKUwjruKxgDaom, connectors removed, results only in its final message) and Hotfrog in 32 more towns; scripts in `scripts/finder/`.
  8. Live 2026-10-25 (Kriv approved the merge): kriv-previews main fast-forwarded to `2f30705`, production `dpl_9oSYKAvLW4w3BRAQXhYjb7J2jwKH` (rollback target `dpl_Hknvh92tvv2VZppyz2Kg2zwuuX89`). kriv.agency/springer-bros, /air-source-1, /kyles-air-conditioning: 200, noindex, banner, browser check clean; 8/8 smoke. Kriv sends emails by hand after the Vercel Pro upgrade; Air Source 1 waits for the US re-check.
  9. Round 2 (2026-10-25): Kriv widened the email rule (own-domain addresses; free-mail addresses the business publishes, except plain first.last names). 10 qualified leads (FL 7, TX 3). 7 new drafts in `leads/` (status draft) with email drafts in `C:\Users\user\kriv-leads\emails\`; Fidelity Air, Accurate Air and A/C Best Price each have a fact for Kriv to confirm. Air Source 1: the cloud run checked airsource1.com, but the listing's address is airsource1llc.com, still to re-check from the US.
  5. Kriv's second update (2026-10-25): DMARC passes; Krivative/Kriv#20 merged by Kriv and re-verified live (20/20); lead finder now runs Texas, Florida and Utah towns with the business-name mailbox rule (docs/LEAD-FINDER.md), target 10 qualified leads; then leads.html dashboard and 3 draft leads end to end (docs/LEAD-QA.md). Nothing goes live or gets sent without Kriv's approval per lead.
- Windows machine note (2026-10-25): two parallel background `check-site.mjs` runs were stopped by Claude Code for low memory. Run the checker in the foreground in batches of about 20 URLs and save each batch.

## Verified facts

- Site Arsenal was originally a private repo under a client's GitHub account and was transferred on 2026-10-24. Verified 2026-10-24: it is at `Krivative/Site-Arsenal` and readable from Claude Code.
- Site Arsenal is a Next.js 16 app with 20 data-driven templates, no secrets or client data in its full history (4 commits, all by Claude, 2026-10-23 to 2026-10-24). Details and gaps: `docs/SITE-ARSENAL-AUDIT.md`.
- The Vercel connector sees one team, "Kriv" (`kriv5`), with zero projects; the `kriv` project and any Site Arsenal deployment are under an account it cannot see.
- Main KRIV website: repo `Krivative/Kriv`, domain `https://kriv.agency`, Vercel project `kriv`. It has its own `PROJECT-HANDOFF.md` and an approval flow; read it before touching that repo.
- Vercel limits checked 2026-10-24 (docs.vercel.com/docs/limits): Hobby is non-commercial, 200 projects, 50 domains per project, 100 deployments per day. Pro: unlimited projects, unlimited domains per project (soft limit 100,000), 6,000 deployments per day.

## Decisions (approved direction from Kriv in chat, 2026-10-24)

Added after Phase 0 (Kriv, 2026-10-24): written OK from Site Arsenal's original owner for KRIV commercial use received (per Kriv); Phase 1 approved including repo creation; copy all 20 Site Arsenal templates; call, message, email, map and social links on previews are disabled.
Kriv, 2026-10-24: stay on Vercel Hobby until the first paying client, then upgrade to Pro. Risk accepted by Kriv: Vercel's Hobby terms are non-commercial and previews sent to leads may count as commercial use regardless of revenue.


1. Lead previews are served at `https://kriv.agency/<lead-slug>` (changed from `/for/<lead-slug>` by Kriv on 2026-10-24), not subdomains and not `.vercel.app` links. Main site uses a fallback rewrite: docs/MAIN-SITE-REWRITE.md.
2. Previews live in a separate app/repo `kriv-previews`; the main site only gets two rewrite rules (see docs/MAIN-SITE-REWRITE.md).
3. One app renders all leads from data records; no deployment per lead.
4. Guardrails in the plan's section 3 apply to every preview (noindex, KRIV concept banner, no fake claims, non-working forms, 30-day expiry).
5. Outreach is personal Gmail drafts reviewed and sent by Kriv.

## Still open (needs Kriv)

- Which Vercel account still deploys Site Arsenal (its public gallery lists every site), and connector access to the team holding the `kriv` project.
- Upgrade to Vercel Pro (main site and previews in one team) when the first client signs.
- Kriv, 2026-10-24: skip Google Places API for the pilot (lead finding by web search and the business's own site); Kriv is Site Arsenal's sole owner, no other copies. Vercel project `kriv-previews` (prj_JzD8zhDBPc2JqXsCzcDZ7FNMgPri) imported by Kriv; Claude's Vercel connector cannot list or fetch its deployments (403) and this environment's network blocks *.vercel.app and kriv.agency.
- Pilot defaults chosen by Claude at Kriv's request (2026-10-24): San Antonio TX metro; no-website and weak-website leads; emails from the business's own site and listing, no paid finder; Upstash free tier; 20 emails/day for 2 weeks then up to 30. See docs/ROADMAP.md.
- Lead volume target for the first month.
- Later: database provider for Phase 5.

## Approval rules (always)

Ask Kriv before: creating or deleting repos, merging any PR, production deploys, DNS or domain changes, billing or paid services, sending any email, publishing any lead page, or changing anything in `Krivative/Kriv` beyond an open PR. A local build passing is not proof anything is live.

## Never

Commit secrets or client personal data. Invent reviews, results, prices, credentials or testimonials. Use a client's Claude or GitHub account for KRIV's own work. Remove the noindex or the concept banner. Send bulk cold email.

## Phase log

| Date | Phase | Agent | Result | Commit/PR |
|---|---|---|---|---|
| 2026-10-24 | Planning | Claude (Claude.ai) | Plan and handoff written | n/a |
| 2026-10-24 | 0 Access and audit | Claude Code | Repo confirmed, audit written, no secrets found; 3 major gaps (static build per lead, public gallery, soft 404) | Krivative/Site-Arsenal `claude/new-session-3jaiso` |
| 2026-10-24 | 1 Scaffold | Claude Code | App built: 20 templates, request-time `getLead`, guardrails 1 to 6, tests and smoke check pass locally. Lead schema = Site Arsenal SiteData + lead fields (supersedes plan section 4 field names) | Krivative/kriv-previews `main` `f7cab60` |
| 2026-10-24 | 2 Vercel project | Claude Code | Production public, 8/8 smoke checks, browser load clean | n/a (verification only) |
| 2026-10-24 | 3 Main-site rewrite | Claude Code | Draft PR, local check passed, Vercel build OK; preview check blocked by Vercel login | Krivative/Kriv#19 |
| 2026-10-25 | 3 Main-site rewrite | Kriv + Claude Code | Verified by Kriv on the PR's Vercel preview (`/`, `/test-lead`, `/nope`); PR description updated; still draft | Krivative/Kriv#19 |
| 2026-10-25 | 3 Go live | Claude Code (Kriv approved) | Merged `be83831`, deployed `dpl_G3nuQV6UvDkScFkQPc1ZWU8tqWYG`, 20/20 live checks, browser clean | Krivative/Kriv#19, #20 |
| 2026-10-25 | kriv-previews release | Claude Code (Kriv approved) | Branch fast-forwarded into main `2c34918`, deployed `dpl_Hknvh92tvv2VZppyz2Kg2zwuuX89`, 8/8 smoke on production | Krivative/kriv-previews main |
