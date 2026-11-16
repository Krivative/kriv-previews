Read STATE.md before any work: it is short and current. Follow its rules and the approval rules in HANDOFF.md.
HANDOFF.md is the long history (over 140 KB): never read it whole. Search it for your topic and read that part. Read docs/PLAN.md only when planning new phases.

- Next.js 16: read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.
- Templates and sections are copied from Krivative/Site-Arsenal; see docs/SYNC.md before editing them.
- Before you start and before every publish: `pnpm preflight --status`. Before every commit: `pnpm preflight` (lint, typecheck, test, build, smoke in one call).
- Never remove the noindex header or meta, the concept banner (`conceptNotice` in src/sections/Chrome.tsx) or the inert links (src/sections/inert.ts).
- After every finished step: update STATE.md if what is live or waiting changed; add a dated entry to HANDOFF.md's "Latest checkpoint"; tick docs/ROADMAP.md (the "Updated" line and "Next up"), run `NODE_PATH=$(npm root -g) node scripts/roadmap-pdf.mjs`, commit the PDF in docs/reports/ and send it to Kriv.
