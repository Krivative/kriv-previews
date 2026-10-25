# HANDOFF: KRIV Previews

Any AI agent (Claude Code, Claude Cowork, ChatGPT/Codex or other) continuing this work: read this file top to bottom, then `docs/PLAN.md`. Update the "Latest checkpoint" section at the top after every verified stage, and tick docs/ROADMAP.md and send Kriv its PDF (see CLAUDE.md). Never mark something done that you have not verified.

## Latest checkpoint

- Date: 2026-10-25
- Agent: Claude Code (Windows desktop, PowerShell: use `corepack pnpm`, and `$env:NODE_PATH = (npm root -g)` for the Playwright scripts)
- Current phase: Phases 1, 2 and 3 done. Phase 3 verified 2026-10-25 by Kriv on PR #19's Vercel preview: `/` looks like kriv.agency, `/test-lead` shows the Example Family Dental preview with the concept banner, `/nope` shows "Nothing here". PR #19 stays a draft until Kriv approves the merge. Templates for all 4 pilot niches approved; outreach footer and opt-out process done. Now: Phase 4 lead finder.
- Repos: `Krivative/kriv-previews` main, plus docs/lead-finder work on branch `claude/amazing-edison-juyem3` (not merged; a merge to main redeploys production); `Krivative/Site-Arsenal` work is on branch `claude/new-session-3jaiso` (audit + batch 5 templates, not merged to main); `Krivative/Kriv`: draft PR #19 only.
- Vercel: project `kriv-previews` in team Kriv (`team_yYcyLMl2aXoeWOfajA5FMlOh`). The Vercel connector can list projects but gets 403 on deployments, project creation and protected fetches.
- Network: Kriv widened the cloud environment's network access on 2026-10-24 (earlier sessions could not reach *.vercel.app, kriv.agency or business websites).
- Tests (2026-10-25): lint, typecheck, 87 unit tests, build, 8 smoke checks all pass locally (Windows).
- GitHub connector (Krivative) gets 404 on `Krivative/Kriv`; git over HTTPS works with the credential manager login, which Kriv allowed (2026-10-25) for PR #19 description updates.
- Roadmap with checkboxes: docs/ROADMAP.md; PDF snapshots in docs/reports/ (send Kriv a new PDF after every finished step, see CLAUDE.md).
- Next actions, in order:
  1. ~~Verify production~~ done 2026-10-24 (8/8).
  2. ~~Phase 3~~ verified 2026-10-25: https://github.com/Krivative/Kriv/pull/19 (draft, branch `claude/amazing-edison-juyem3`, head `91329b5`). Local check passed, Vercel build succeeded, and Kriv checked the PR's Vercel preview (see Current phase); the PR description records it. Do not merge: Kriv approves the merge and the main-site production deploy.
  3. Phase 4 lead finder for San Antonio TX (dental, HVAC, chiropractic, med spa): web search + directories + the business's own site; no Google Places API; facts only from sources.

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
