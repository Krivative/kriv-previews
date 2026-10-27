# Website interaction foundation and pilots

2026-10-27. Implemented after Kriv approved the audit plan with "start". These three existing template upgrades await founder review before broader rollout.

## Working pilots

| Template | Signature | Content and fallback |
|---|---|---|
| Breeze / hvac-calm | Numbered service explorer with an illustrative equipment portrait, expanding descriptions and direct detail-page navigation | Supplied services/detail/includes only. Native exclusive disclosures work without JavaScript; unsupported exclusive grouping still leaves readable disclosures. No photo means no invented visual. |
| Linen / aesthetic-calm | Editorial image study with a native modal gallery, deliberate image framing and restrained hover depth | Existing credited photos and labels only. Single-photo layout remains finished; multiple supplied photos gain previous/next and arrow-key controls. Static images/captions remain readable without JavaScript. Native dialog supplies focus containment, Escape and return focus. |
| Align / chiro-calm | Expandable first-visit journal with numbered journey parts and a distinct typographic composition | Existing custom title/body/items only. No fabricated consultation, examination or treatment steps. Body-only content is preserved without interactive controls. Native disclosures work without JavaScript. |

All three retain their established palette, typography, hero, navigation and closing identity. The other 23 templates retain their section recipes. Shared hero photography now opts into eager/high-priority loading; other images remain lazy. No facts, business records, photo URLs, credits, booking actions or production configuration were changed.

## Foundation and technology

Original implementations use CSS Modules and semantic browser controls. Motion tokens use 160 ms controls, 420 ms detail reveals and a shared easing curve; gallery hover scale is subtle and only active on devices with hover. Reduced motion disables this choreography. Phone layouts stack vertically and expose tap controls, with no scroll hijacking or forced horizontal rails.

ServiceExplorer and VisitJourney remain Server Components. GalleryViewer is the small client boundary needed for the native modal. No scroll handlers, continuous animation loop, canvas/WebGL, video engine, tracking, forms or visitor storage were introduced. The local Next.js 16 server/client and lazy-loading guides were read; the React review checked component boundaries, derived state, keyboard behavior and omitted content. A gallery selection clamps safely when photos change.

No dependency was added. shadcn/ui, Radix, TailGrids, Scroll Craft and Motion were evaluated during the read-only audit; none is required for these pilots. React Bits components/ports remain excluded from the reusable template kit because its component redistribution restriction conflicts with the potential template business. No third-party component code was copied.

## Validation and review

- Preview app: lint, typecheck, 268 tests across 10 files, production build and all 16 HTTP smoke checks. Existing full/minimal rendering and same-concept navigation safeguards cover all 26 templates; targeted tests cover supplied/absent content, no-JavaScript markup, gallery semantics and hero priority.
- Source library: lint and production webpack build (the documented local dependency-junction workaround). The page verifier covers all 282 sample pages and four anonymous not-found views; the existing source streamed-404 limitation remains unchanged. The preview app still requires actual unknown/draft 404s.
- Browser harness: `scripts/verify-pilots.mjs` starts/stops its own local source server, targets fictional sample slugs only, and uses previously reviewed local photo copies with configured public web fonts. The first sandbox run blocked fonts; the authorized rerun loads them successfully. It never opens the real Desk or private lead directory.
- Three pilots x desktop 1440/tablet 768/phone 390 x normal/reduced motion = 18 combinations. Actual disclosures, keyboard activation, gallery modal/focus/Escape/return-focus, overflow, image loading and inert actions pass. Additional JavaScript-disabled tests confirm readable/native fallbacks. All final combinations have zero browser errors, overflow, broken visible images or submissions.
- Local resource measurements record approximately 140 KB of encoded script bodies per initial pilot navigation, including the existing Next.js/React runtime. This is an observed local fixture measurement, not a production Core Web Vitals result or a physical-phone benchmark. No dependency/runtime was added for animation.
- Visual QA inspected representative desktop/phone captures and corrected focus-outline spacing. Evidence is in ignored `shots/interaction-pilots/`, with representative copies under `docs/reports/`. Existing stock imagery is reused; Linen's current sample intentionally demonstrates the single-image fallback rather than inventing more photographs.
- Companion source navigation checks retain desktop/phone About, Contact and service-detail coverage across all 13 niches. Source checkpoint/patch delivery is recorded in HANDOFF.md; no remote push or release is implied.

## Saved source checkpoint

The local Site Arsenal checkpoint is `956edd5` on `claude/amazing-edison-juyem3`, based on `98deca6`. The older source branch/checkpoint is preserved. `docs/reports/site-arsenal-2026-10-27-interaction-pilots.patch` exports all 11 changed/new source files as a zero-context Git diff. After reviewing the source base, apply with `git apply --unidiff-zero`; no remote push or release has occurred. The preview copy retains its own lifecycle/schema adaptations.

Local review: `npm.cmd --prefix shots/site-arsenal-source start -- -p 3101`, then visit `/sample-hvac-calm#services`, `/sample-aesthetic-calm#gallery` and `/sample-chiro-calm#custom` on `http://localhost:3101`. Close any old gallery server before restarting it. Lead Desk restart remains `pnpm.cmd lead-desk`; do not use the real Desk for agent verification without private-data authorization.

Kriv reviews the working signatures before any broader template rollout. Pushes, merges, publishing and deployment remain separate explicit decisions. The unchanged noindex header/meta, exact concept notice, inert business links, expiry and data/source rules continue to apply.
