# Keeping templates in sync with Site Arsenal

`Krivative/Site-Arsenal` is where templates are designed and reviewed. This repo
carries a copy taken from Site Arsenal commit `d8e3581` on branch `claude/new-session-3jaiso` (2026-10-24, 24 templates).

| Path here | Relation to Site Arsenal |
|---|---|
| `src/templates/*.ts`, `src/lib/templates.ts` | Identical. Copy over when a template changes. |
| `src/sections/Sections.tsx`, `Chrome.tsx`, `sections.module.css` | Changed: outbound links use `inert` (no `href`), the banner uses `conceptNotice`, address uses `region`, footer carries the notice. Port Site Arsenal changes by hand. |
| `src/sections/SiteRenderer.tsx` | Changed: sets `lang` from the lead. |
| `src/sections/inert.ts` | Only here. |
| `src/lib/site-schema.ts` | Changed: no `mode`; adds `lang`, `sources`, `createdAt`, `expiresAt`, `status`; address `province` → optional `region`, `country` is a required ISO code. |
| Site Arsenal's gallery, `src/sites/`, `index-sites.mjs`, `new-site.mjs`, `robots.ts` | Not copied (public listing, build-time data). |

After syncing: `pnpm test` renders every template with full and minimal data and fails
if a live link, form or missing banner appears.

`docs/TEMPLATES.md` and `docs/FINGERPRINTS.md` are copies of Site Arsenal's
`CATALOG.md` and `FINGERPRINTS.md` (fingerprint method adapted from Nate Herk's
scroll-craft, MIT).
