Read HANDOFF.md and docs/PLAN.md before any work. Follow the approval rules in HANDOFF.md.

- Next.js 16: read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.
- Templates and sections are copied from Krivative/Site-Arsenal; see docs/SYNC.md before editing them.
- Before every commit: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:smoke`.
- Never remove the noindex header or meta, the concept banner (`conceptNotice` in src/sections/Chrome.tsx) or the inert links (src/sections/inert.ts).
- After every finished step: tick it in docs/ROADMAP.md (update the "Updated" line and "Next up"), run `NODE_PATH=$(npm root -g) node scripts/roadmap-pdf.mjs`, commit the PDF in docs/reports/ and send it to Kriv.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
