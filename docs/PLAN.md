# KRIV Previews: Build Plan (for Claude Code)

Prepared 2026-10-24 in the KRIV Agency Claude Project. Paste this file into the first Claude Code session, or commit it to the new repo as `docs/PLAN.md`. Status of every phase lives in `HANDOFF.md`, not here.

## 1. Objective

Let KRIV produce a tailored concept website for a qualified lead in minutes, host it at `https://kriv.agency/for/<lead-slug>`, and send the lead a personal email linking to it. The system must work the same at 50 leads or 100,000 leads.

## 2. Architecture (decided)

| Piece | Decision | Why |
|---|---|---|
| Templates | Site Arsenal repo (transferred from client account to Kriv's GitHub; exact `owner/repo` still to confirm) | Existing template library |
| Preview app | New private repo `Krivative/kriv-previews`, one Next.js App Router app with `basePath: "/for"` | One app serves every lead; no deploy per lead |
| Lead data | Storage interface `getLead(slug)`; MVP adapter reads `leads/<slug>.json`; later adapter uses a database (Upstash Redis or Postgres) | Starts simple, scales without rewrite |
| Rendering | `/for/[slug]` looks up the lead and renders its chosen template | 100k leads = 100k records, not 100k deployments |
| Hosting | One Vercel project `kriv-previews`; Hobby until the first paying client, then Pro (decided 2026-10-24) | Hobby is non-commercial and capped at 200 projects / 100 deployments per day |
| Public URL | Rewrite in the main site `Krivative/Kriv`: `/for/:path*` → `https://kriv-previews.vercel.app/for/:path*` | Clean kriv.agency URL, no DNS changes, main site untouched apart from one rule |
| Outreach | Gmail drafts, one per lead, reviewed and sent by Kriv | Personal 1:1 email; no bulk sender for cold outreach |

Not chosen, with reasons: building lead pages inside `Krivative/Kriv` (risks the approved flagship site and its build); one Vercel project per lead (hits project and deployment limits); `.vercel.app` links in emails (shared hosting domains are often filtered); wildcard `*.kriv.agency` (needs nameservers moved to Vercel; revisit only if path URLs prove a problem).

## 3. Non-negotiable guardrails for every preview

1. `noindex, nofollow` meta and `X-Robots-Tag` header on every `/for/*` page; `/for/` disallowed in kriv.agency `robots.txt`; never in any sitemap.
2. Visible banner: "Concept preview prepared by KRIV for <Business Name>. Not affiliated with or endorsed by <Business Name>."
3. Forms, booking and checkout are non-functional and say so. No data is collected from visitors.
4. Only facts from the lead's own public materials. No invented reviews, testimonials, awards, prices, credentials or results. Placeholder images must be generic or licensed, never another business's photos presented as the lead's.
5. Every lead record has `expiresAt` (default 30 days). Expired slugs return a polite "This preview has expired, contact KRIV" page.
6. Unknown slugs return a 404 that does not reveal other slugs.
7. No secrets in Git. No client personal data in Git (lead JSON holds business-level public info only; move to the database before scaling).

## 4. Lead record schema (v1)

```json
{
  "slug": "acme-dental",
  "businessName": "Acme Dental",
  "industry": "dental clinic",
  "location": "Austin, TX, US",
  "template": "<site-arsenal-template-id>",
  "brand": { "primary": "#...", "accent": "#...", "logoText": "Acme Dental" },
  "hero": { "headline": "...", "subhead": "..." },
  "services": [{ "name": "...", "summary": "..." }],
  "about": "...",
  "contact": { "phone": "public business phone", "address": "public business address" },
  "sources": ["https://their-current-site.com", "https://their-google-profile"],
  "createdAt": "2026-10-24",
  "expiresAt": "2026-11-23",
  "status": "draft | approved | sent | replied | expired"
}
```

`sources` is required: every claim on the page must trace back to one.

## 5. Phases

Each phase ends with: tests passing, a commit, and `HANDOFF.md` updated at the top. Stop and ask Kriv wherever the Approvals column says so.

| # | Phase | Work | Acceptance | Approval needed |
|---|---|---|---|---|
| 0 | Access and audit (read-only) | Confirm Site Arsenal's exact repo; inventory framework, templates, dependencies, licenses of any paid themes; scan full Git history for `.env`, keys, client data | Written audit in `docs/SITE-ARSENAL-AUDIT.md`; any secrets reported to Kriv (rotate, don't just delete) | Kriv confirms written OK from the original owner for KRIV commercial use |
| 1 | Scaffold `kriv-previews` | Create repo; Next.js + TypeScript; `basePath: "/for"`; port 1 to 3 Site Arsenal templates as data-driven components; `getLead` interface with JSON adapter; guardrails 1 to 6; `leads/test-lead.json`; `CLAUDE.md`, `AGENTS.md`, `HANDOFF.md` | `pnpm typecheck`, `pnpm test`, `pnpm build` pass; `/for/test-lead` renders locally with banner and noindex; expired and unknown slugs behave correctly | Creating the repo |
| 2 | Vercel project | Create `kriv-previews` project, connect repo, production deployment public, previews protected | `https://kriv-previews.vercel.app/for/test-lead` loads publicly with correct headers | Disabling protection on production (Hobby for now; Pro after first client) |
| 3 | Main-site rewrite | Read `Krivative/Kriv` `PROJECT-HANDOFF.md` first. On a feature branch from the current approved baseline, add only the `/for/:path*` rewrite and the `robots.txt` disallow | PR open; Vercel preview of the main site serves `/for/test-lead`; every existing route, Field Note, canonical and JSON-LD unchanged | Merge and production deploy of `Krivative/Kriv` |
| 4 | Lead pipeline | `scripts/new-lead` that validates a lead JSON against the schema; a Claude Code skill `kriv-lead-site` (research brief → lead JSON → render → QA checklist → Gmail draft text); QA checklist in `docs/LEAD-QA.md` | Three real qualified leads produced end to end, each passing QA and approved by Kriv | Each lead page and each email before sending |
| 5 | Scale | Database adapter (Upstash Redis or Postgres), admin script to bulk-load and expire leads, basic aggregate page-view counts (no visitor tracking), Lead Desk tracker | 1,000 synthetic leads render with no deploy; expiry job works | Database provider and billing |

## 6. Out of scope for now

Cold email at volume (needs separate warmed sending domains, compliance review for US/AU/NZ/CA, and a positioning decision), any paid lead lists, live forms, payments, custom domains per lead, and changes to the main site beyond the rewrite.

## 7. Model and tool recommendation

| Work | Where | Model | Effort |
|---|---|---|---|
| Phases 0 to 3 (audit, architecture, main-site PR) | Claude Code (desktop or terminal) | Claude Opus 5.5 | High |
| Phase 4 skill design | Claude Code | Claude Opus 5.5 | High |
| Producing individual lead sites once the skill exists | Claude Code (mobile works for on-the-go) | Claude Sonnet 5.5 | Medium |
| Lead research, offer angle, email wording, approvals | Claude.ai KRIV Project | Claude Opus 5.5 | Default |
| Cross-app follow-up (Gmail drafts, tracker updates) | Claude Cowork | Claude Sonnet 5.5 | Default |

Switch models in Claude Code with `/model`. Use Kriv's own Claude plan for this work, not a client's account.

## 8. First prompt for Claude Code

> Read `KRIV-PREVIEWS-PLAN.md` and `HANDOFF.md`. Start Phase 0 only. Confirm which GitHub repo holds Site Arsenal, then audit it read-only and write `docs/SITE-ARSENAL-AUDIT.md`. Do not create repos, deploy, merge, or change DNS. When done, update `HANDOFF.md` and stop for my approval.
