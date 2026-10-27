# Distinct compositions and cross-industry rotation

Verified locally: 2026-10-28. Baseline preview checkpoint: `51840d6`.

## Direction and delivery

Kriv's feedback was that the arsenal still felt like two layouts with different
colours. The earlier interaction rollout improved controls, but did not solve
that structural repetition. The new direction is a library of individually
composed designs usable across industries. All 26 remain in rotation while
they are rebuilt gradually. This milestone rebuilds three; it does not claim
that the other 23 are now unique compositions.

Kriv chose one restrained direction and two contrasting directions, with three
fictional samples. The comparison intentionally uses the same Hilom Wellness
content and the same illustrative photograph in all three:

| Existing ID / name | New composition | Local sample |
|---|---|---|
| aesthetic-calm / Linen | Canvas: one continuous scene, floating paper navigation, offset essay and offering panels | http://localhost:3101/sample-aesthetic-calm |
| office-calm / Ledger | Index: persistent desktop navigation rail, oversized editorial type, narrow image and indexed service ledger | http://localhost:3101/sample-office-calm |
| auto-bold / Torque | Stage: graphic masthead, framed photograph, offset contents ticket and large expandable offering index | http://localhost:3101/sample-auto-bold |

Mobile has ordinary vertical scrolling, compact native menus, touch-sized
controls and independently stacked content. There is no scroll hijacking,
video, WebGL or new animation library. Native disclosures work without
JavaScript. Reduced-motion preferences remain supported.

## References and imagery

- [Ivory Premier](https://ivorypremier.com/): one strong image, restrained serif typography, warm surfaces and generous spacing informed Canvas. No site code, branding or photographs were copied.
- [Awwwards public gallery](https://www.awwwards.com/websites/): studied contrasting page silhouettes and editorial composition, rather than adding the same effects to every layout.
- [Mobbin public homepage](https://mobbin.com/): studied hierarchy and spacing. No paid component library or authenticated flows were accessed.

The single new stock image is Zara Johnson's
[modern hallway photograph](https://unsplash.com/photos/a-modern-hallway-with-a-chair-by-the-window-qraqqY9i860),
verified free under the Unsplash License on the photo page. It is explicitly
labelled an architectural light study, not the fictional business's premises.
The original hotlink and photographer credit remain in the sample records.
Responsive widths use the same source image; no business-hosted URL is altered.

## Lead Desk and content separation

The existing hybrid inbox/focused review is retained. The design picker makes
all 26 designs available across industries, describes each signature and marks
the three rebuilt compositions. Preparation rotates over the complete sorted
pool; later attempts can reach every design, while calmer/bolder requests still
use the requested look. This is deterministic rotation, not a global round-robin
counter or a guarantee that adjacent businesses receive different designs.

Optional `contentNiche` stores the business's content classification independently
of its template ID. Newly saved Desk forms derive it from the lead's existing
niche; medspa maps to aesthetic and unknown classifications use neutral wording.
Services, source matching and finder qualification rules are unchanged. Existing
records without the field keep their old template-prefix fallback. No real
records are bulk migrated. Manual cross-industry JSON records should supply
`contentNiche` to retain appropriate page labels.

Existing explicit `design.sections` overrides retain their tailored renderer.
The three compositions apply to their default recipes; they do not silently
discard a saved per-lead layout. Presentation hashing includes the new files,
so stale screenshots/visual approvals are detected. Refresh verification and
review affected concepts before publication.

The actual local Desk was restarted at Kriv's request using the existing SQLite
database, with no importer or replacement database. Only static frontend assets
were fetched for availability checks; private lead content and runtime logs were
left unopened. Saved automation preferences retain their existing behavior.

## Verification

- Preview lint/typecheck, 301 tests in 12 files, production build and all 16 smoke checks pass.
- Source lint and webpack production build pass; its existing dependency junction still requires the documented webpack workaround.
- New compositions: 18 desktop/tablet/phone and motion-preference combinations, real touch-mode phone interactions, keyboard navigation, nested About navigation and three JavaScript-disabled fallbacks pass.
- All 26: 156 device/motion combinations, 26 JavaScript-disabled fallbacks and two multi-image/change-of-props fixtures pass.
- Source: 287 known pages and four anonymous not-found views checked; 78 nested-page captures/click-throughs across 13 existing template-family representatives pass. Three samples now intentionally share spa content, so this is not a claim of 13 distinct content niches in that browser subset. Unit tests separately cover all 13 supported content guides across all 26 templates.
- Synthetic Desk browser journeys pass with zero actual network requests and zero browser errors, covering decisions, reload persistence, save failure, separate publication confirmation and manual follow-up tracking.

Visual inspection includes the three desktop and phone openings and service
views. Browser checks found a narrow Index About-page overflow, corrected using
container-aware layouts, and an overbroad nested list selector, now scoped to
direct offering rows. No new runtime dependencies or framework migrations.

These are local synthetic browser checks with reviewed photo fixtures and public
fonts, not production validation, a physical-phone benchmark or measured Core
Web Vitals. Source gallery's pre-existing streamed-404 HTTP-status limitation
remains; preview app smoke checks still require real 404 responses.

## Saved delivery and next review

Shared presentation is mirrored to Site Arsenal with only the required
region/province adaptation. Source gallery includes actual fictional screenshot
thumbnails. Source checkpoint: `688cdbb` on `claude/amazing-edison-juyem3`, based on `f4770a0`.
Binary export: `docs/reports/site-arsenal-2026-10-28-distinct-compositions.patch`.
Review then apply against that source base with `git apply --unidiff-zero`;
the export includes the fictional gallery screenshot thumbnails. Earlier commits, patches, PDFs and real lead edits remain.

Review the three local samples, then approve the preferred quality level before
rebuilding the remaining designs in small batches. Local availability does not
publish any real lead or release code to public hosting. Public release scope
remains unconfirmed; no push, merge or deployment was performed.
