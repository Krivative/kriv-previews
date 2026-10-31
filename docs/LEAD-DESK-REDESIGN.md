# Hybrid Lead Desk workspace

2026-10-27. Kriv approved the audit plan with "start". This is the first implementation milestone; website interaction pilots follow separately.

## Daily experience

The default inbox is a compact working queue. Needs my attention, Ready for review, Revisions, Remaining checks, Ready for publishing, Outreach, Follow-ups, Completed/declined and In preparation all use the same server-derived stage. Search, industry/location filters and priority/recent/oldest/name sorting stay on the inbox. Continue resumes the saved business/step, falling back to the highest-priority pending item. Find/Check/Build/LinkedIn and the original dashboard remain under More tools.

Open one business to review desktop/mobile captures, access its interactive concept, and Approve, Revise or Decline. Approve records a visual decision only, then explains the next incomplete requirement. Final publication approval and publish confirmation remain separate. Revisions accept freeform text and an optional section, preserve the original record/captures, and never queue generation. A concept decline preserves prospect qualification; a business decline also declines the prospect. Either blocks the current concept from publishing/outreach until explicitly reconsidered. If a previously approved but unpublished concept is revised/declined, its publication status becomes draft while the original approved version stays archived.

Feedback, notes and email changes save after a short typing pause and before internal navigation. Failed saves retain the text and current screen. Follow-up date/notes save locally and never send messages. Desktop review has a decision sidebar; an undecided phone review has visible bottom decision controls. Technical tools and source evidence remain available in secondary tabs.

## Data and safeguards

SQLite receives three additive tables: lead_workflow (latest version-bound decision/readiness and follow-up), review_decisions (append-only request IDs and preserved snapshots), and review_drafts (unfinished feedback). Existing tables, stable lead IDs, decisions, QA and history are retained. No importer/reset/replacement database is required. These schema changes run on Kriv's next normal server start; Codex has tested them only on synthetic databases.

Visual versions bind the normalized record, desktop/mobile capture bytes and template/presentation files. Changed versions require another visual decision. Publication approval additionally binds the email, source/preparation report and manual QA. Email review binds the saved recipient/subject/body. Every decision uses a revision counter plus request ID; stale tabs fail safely, and retries do not duplicate decisions. Notes/email drafts also detect conflicting edits. Reviewed concepts and revision requests are excluded from automatic preparation.

Run verification checks refreshes sources and captures without rewriting the record. Existing source-matched content can be rechecked when unchanged; changed/unverified facts require the founder's existing manual fact review. Automatic QA items can only be populated by actual checks. Known internal same-concept page links are permitted; tel/mailto/forms and cross-lead links remain rejected. Existing paid AI helpers stay disabled.

Publication rechecks review/contact permission after asynchronous work. Published-but-unverified pages get a verification-only retry rather than a second publication. Gmail opens only when the existing live-page/contact/draft/daily-limit checks pass. Sending stays manual. Mark-sent/replied retries retain the first timestamp/history. Opt-outs and manual LinkedIn remain unchanged.

## Verification

- Required suite: pnpm lint, typecheck, test (262 tests), build and test:smoke (16 checks).
- Unit coverage includes old-schema restart continuity, visual approval before QA, feedback-only revisions, archives, template/screenshot changes, stale/repeated requests, email/publication bindings, opt-outs, follow-ups, verification retry and internal-link guards.
- Browser command on Windows: `$env:NODE_PATH = (npm.cmd root -g)` then `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --disable-warning=ExperimentalWarning scripts/verify-workspace.mjs`.
- The browser harness intercepts every request at an HTTPS .test origin, uses a temporary synthetic database/repository, and simulates publication. It never starts the real Desk, reads private data, fetches a real business, sends email, calls Git or deploys.
- Desktop 1440, tablet 768 and phone 390 layouts, search, device switching, visual decisions, failed-save navigation protection, reload persistence, archived versions, email review, publication/cancel, live retry, mark-sent, follow-up and keyboard navigation pass. Zero browser errors or real network requests.
- Screenshots and machine-readable result: ignored `shots/workspace-2026-10-27/`. Representative inbox/review images are copied into `docs/reports/` for founder review. They contain fictional test businesses only.

## Limits and next work

This is local application verification, not a private-data pilot or production verification. The Desk must be restarted/reloaded by Kriv. The SQLite-to-production adapter and unattended scheduling remain future work. An interactive draft requires the existing local preview app; screenshots remain available independently. External publication, source/template releases, pushes and deployment require Kriv's explicit authorization.

Next: CSS-first interaction primitives and three distinct website pilots in the preview and Site Arsenal copies, followed by Kriv's pilot review before broader rollout.
