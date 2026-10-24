# KRIV Previews

Concept websites for qualified leads, served at `https://kriv.agency/<slug>`
(the main site forwards unknown paths here; see `docs/MAIN-SITE-REWRITE.md`).
One Next.js app renders every lead from a data record; a new lead needs no deploy.

Start with `HANDOFF.md` (status and approval rules), `docs/ROADMAP.md` (checklist) and `docs/PLAN.md` (the plan).

## Layout

```
leads/<slug>.json        one record per lead (business-level public facts only)
src/lib/site-schema.ts   the lead schema (Site Arsenal's SiteData + lead fields)
src/lib/lead-store.ts    LeadStore interface + JSON adapter (database adapter later)
src/lib/leads.ts         getLead(slug): slug check, drafts, expiry, template lookup
src/app/[slug]/page.tsx  renders a lead on request; unknown slugs get a real 404
src/sections/            shared section kit (from Site Arsenal; links made inert)
src/templates/           20 templates (from Site Arsenal)
tests/                   vitest: schema, lookup, expiry, every template renders safely
scripts/smoke.mjs        HTTP checks against the built server or a deployment
src/outreach/footer.ts   email footer, sender details, opt-out detection
docs/                    plan, roadmap, outreach rules, audit, template catalog, sync notes
```

## Commands

```bash
pnpm install
pnpm dev                 # http://localhost:3000/for/test-lead (drafts visible in dev only; /for is the app's internal prefix)
pnpm lint && pnpm typecheck && pnpm test
pnpm build && pnpm test:smoke
BASE_URL=https://<deployment>/for pnpm test:smoke   # check a deployment
```

## Guardrails (built in, covered by tests)

1. `X-Robots-Tag: noindex, nofollow` on every response, plus the robots meta tag.
2. Banner: "Concept preview prepared by KRIV for <name>. Not affiliated with or endorsed by <name>." at the top and in the footer.
3. No forms. Call, message, email, map and social links render without `href`, so nothing contacts the business.
4. `sources` is required; every fact on a page must come from one of them. Photos are labelled placeholders.
5. `expiresAt` is required (default `createdAt` + 30 days). After it, or with `status: "expired"`, the page shows a generic "preview has expired" notice.
6. Unknown, malformed, reserved and draft slugs return the same 404, with no list or link to other leads. There is no index page. Slugs are case-insensitive and may not be main-site page names.

## Lead status

`draft` (only visible under `pnpm dev`) → `approved` (Kriv approved the page) → `sent` → `replied`, or `expired`.
