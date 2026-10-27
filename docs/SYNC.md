# Keeping templates in sync with Site Arsenal

`Krivative/Site-Arsenal` is where templates are designed and reviewed. This repo
carries a copy taken from Site Arsenal commit `d8e3581` on branch `claude/new-session-3jaiso` (2026-10-24, 24 templates).

2026-10-27: Kriv requested a whole-arsenal multi-page revamp. The local source
checkout at `shots/site-arsenal-source` now has the same 26-template kit, including
the existing plumbing/cinematic additions and the new shared page system. Its
own local commit and exported patch are recorded in HANDOFF.md. Neither repo has
been pushed or deployed. See `docs/ARSENAL-REVAMP.md` for scope and verification.

| Path here | Relation to Site Arsenal |
|---|---|
| `src/templates/*.ts`, `src/lib/templates.ts` | Identical. Copy over when a template changes. |
| `src/sections/Sections.tsx`, `Chrome.tsx`, `sections.module.css`, `Pages.tsx` | Shared presentation; manually adapt address `region`/`province` and the source-only fictional-sample ribbon. Both copies preserve concept notices and inert business actions. |
| `src/sections/SiteRenderer.tsx`, `inert.ts`, `src/lib/site-pages.ts` | Shared page/navigation kit. Internal links work; business actions stay inert. |
| `src/lib/site-schema.ts` | Shared presentation fields include `lang`, photo credits, service detail/includes and About chapters. Previews omit `mode`, add lead sources/dates/status and use `region`; the source keeps `mode`/`province`. |
| `src/app/[slug]/[...path]/page.tsx` | Adapt manually: previews use the request-time lead lookup, draft/expiry rules and real 404s; source uses the static sample registry and Cache Components. |
| Site Arsenal's gallery, `src/sites/`, `index-sites.mjs`, `new-site.mjs`, `robots.ts` | Not copied (public listing, build-time data). |

Interaction pilot update (2026-10-27): `SignatureSections.tsx`, `GalleryViewer.tsx`
and `signature.module.css` are identical shared presentation files. The new
`explorer`/`editorial`/`journey` section variants are mirrored in both schemas.
Breeze, Linen and Align template definitions match exactly. `Photo.tsx` shares
explicit hero loading priority. Existing source-only sample and province fields
are retained. See `docs/INTERACTION-PILOTS.md`; local source checkpoint and patch
are recorded in HANDOFF.md. Kriv approved the pilots and their selective rollout.

The subsequent 26-template rollout enhances the same shared section files without
changing template definitions or either schema. Service disclosures retain each
existing layout; step grids and strip/mosaic galleries reuse the native controls.
Both copies include the phone strip fallback and centered-hero loading fixes.
See `docs/INTERACTION-ROLLOUT.md` for coverage and local source patch delivery.

After syncing: `pnpm test` renders every template with full/minimal data and every
known page. Only known internal destinations and credited Unsplash links are
allowed; live business actions, forms and missing notices fail. Run the full
required validation suite and the source's page/navigation/screenshot checks.

`docs/TEMPLATES.md` and `docs/FINGERPRINTS.md` are copies of Site Arsenal's
`CATALOG.md` and `FINGERPRINTS.md` (fingerprint method adapted from Nate Herk's
scroll-craft, MIT).

## Distinct compositions (2026-10-28)

Kriv approved cross-industry rotation while all 26 designs are rebuilt gradually.
`TemplateDef.composition` selects original Canvas/Index/Stage layouts for Linen,
Ledger and Torque. `ComposedSite.tsx` (region/province adapted),
`compositions.module.css`, `Photo.tsx`, renderer, page guides and the three
template definitions are mirrored. Both schemas add optional `contentNiche`;
source mode/province and preview lifecycle metadata remain separate. Old records
keep prefix fallback; explicit `design.sections` retains its existing layout.
No real record migration. Three source-only samples intentionally share fictional
spa content and one credited photo to demonstrate layout differences. Source
gallery thumbnails live in `public/template-previews/`; no public lead listing
is added to this app. The source navigation verifier supports native menus and
loads nested-page images before screenshots. See `docs/DISTINCT-COMPOSITIONS.md`
for checks and the source checkpoint/export.
