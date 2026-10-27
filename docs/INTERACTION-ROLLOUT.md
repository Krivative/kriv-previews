# Approved interaction rollout

2026-10-27. Kriv accepted the hybrid workspace and the Breeze/Linen/Align pilots with "approved". This authorizes selective local rollout and QA, not publishing, a push, a merge, deployment or access to private lead data.

## What changed

The shared kit enhances the existing 26 template recipes rather than assigning every industry the same new layout. All template definitions, palettes, typography, hero/navigation/section order/closing composition and fingerprint axes remain unchanged. No sample or real business content is rewritten.

Services with a supplied longer description or inclusions receive a native Explore details control inside their existing rows, cards, tiles, columns or menu. Concise descriptions and direct detail-page links remain visible; navigation and disclosure are separate controls. Several offerings can stay open for comparison. Empty/duplicate longer descriptions do not create empty interactions. No symptoms, diagnoses, prices, outcomes or services are inferred.

Existing strip/mosaic galleries gain the approved image viewer while retaining their framing. Label-only slots stay visible without becoming false photographs or modal slides. Single-photo states remain finished; multiple actual photos support previous/next, arrows, wraparound and a live position label. Focus stays inside the native dialog and returns to the opener after Escape. Phone strip galleries stack vertically, including placeholder-only fallbacks, rather than requiring horizontal scrolling.

Existing numbered step grids become native disclosures where their supplied items contain explanatory text. Name-only items remain plain text. The original grid/numerals/order remain, distinct from Align's journal. Body-only custom sections retain their content. Centered hero compositions now prioritize the first supplied photo, matching the other hero layouts.

## Template coverage

The following signature enhancements depend on supplied content. They are not promises about a particular business.

| Template | Interaction within its existing identity |
|---|---|
| Clear / dental-clear | Teal numbered treatment ledger with inline details and direct treatment pages |
| Bright / dental-bold | Navy/yellow treatment cards, numbered visit parts and image strip viewer |
| Linen / aesthetic-calm | Approved warm editorial gallery plus treatment-row details |
| Gloss / aesthetic-bold | Rose-lined treatment menu with detail reveals and image strip viewer |
| Poster / cafe-poster | Chalkboard menu details and photo mosaic viewer |
| Bean / cafe-calm | Serif menu-column details and photo strip viewer |
| Table / restaurant-calm | Menu-card details and mosaic image exploration |
| Ember / restaurant-bold | Ember-accented dish/service tiles and image strip viewer |
| Mane / salon-calm | Sage service rows, numbered visit disclosures and mosaic viewer |
| Studio / salon-bold | Hairline/lime service tiles and lookbook mosaic viewer |
| Still / spa-calm | Misty treatment-column details and a vertical-on-phone image strip |
| Onyx / spa-bold | Gold-ruled treatment-menu details and mosaic viewer |
| Workshop / auto-calm | Condensed numbered service details, maintenance steps and workshop image viewer |
| Torque / auto-bold | Red-numbered process disclosures before service cards and workshop images |
| Form / gym-calm | Indigo class-card details and studio mosaic viewer |
| Pulse / gym-bold | Programme-card details with the existing offer strip and image mosaic |
| Ledger / office-calm | Navy practice-area rows with details; principal portrait and preparation note retained |
| Counsel / office-bold | Forest/bone practice columns and numbered process disclosures |
| Shore / resort-calm | Room-card details, early mosaic image viewer and existing booking-information steps |
| Fiesta / resort-bold | Mango package-tile details and rounded mosaic viewer |
| Breeze / hvac-calm | Approved numbered service explorer and equipment portrait |
| Thermal / hvac-bold | Amber service-tile details and equipment mosaic viewer |
| Align / chiro-calm | Approved source-backed first-visit journal and numbered treatment details |
| Posture / chiro-bold | Electric-blue numbered treatment details and image strip viewer |
| Tap / plumbing-calm | Aqua numbered service details with the existing contact strip |
| Pressure / plumbing-bold | Safety-yellow service-tile details and image strip viewer |

## Motion, accessibility and performance

No dependency, Tailwind migration, scroll listener, continuous animation loop, visitor storage or tracking is added. Services and steps remain server-rendered native controls. The only interactive client boundary is the existing GalleryViewer, extended with layout and missing-image handling. No booking, contact, submission, checkout or diagnosis action is activated.

The approved short control/reveal timings remain. Reduced motion removes detail choreography. Keyboard activation, focus outlines and minimum 44 px disclosure targets support mouse/touch/keyboard use. Existing CSS scroll enhancement remains progressive. Modal images use contain fitting; supplied credits remain in the footer. Local script-body counts are recorded by the browser harness, not claimed as real-phone performance or production Core Web Vitals.

The local Next.js 16 server/client guides and React review were applied. Derived selected-image indices clamp when the photo list shrinks; missing image slots never enter navigation. No client data fetching or new effect subscription is needed.

## Verification and delivery

`scripts/verify-rollout.mjs` serves only fictional samples on its own local source server. Existing reviewed image copies fulfill photo requests; configured fonts are public. It also uses the Vite dependency already supplied by Vitest for an isolated synthetic multi-image fixture under ignored `shots/`, without modifying a sample or lead. The script closes its own servers and browser.

- Preview baseline: the previous 268 tests and all five required checks passed before edits. The expanded suite now has 279 tests across 10 files; lint, typecheck, production build and all 16 smoke checks pass.
- Source: lint and production webpack build pass using the documented local dependency-junction workaround. The known-page check covers 282 pages and four anonymous not-found views; navigation checks cover all 13 niches with 78 desktop/phone nested-page captures.
- Browser matrix: 26 templates x desktop 1440/tablet 768/phone 390 x normal/reduced motion = 156 combinations. Native service disclosure, keyboard activation, readable copy width, 44 px touch targets, process steps, gallery focus/Escape/return-focus, inert actions, hero priority, image loading and overflow are checked. Another 26 JavaScript-disabled runs confirm native service exploration.
- A separate multi-image fixture at 1440/390 verifies label-only slots, previous/next and arrow wraparound, shrinking the photo list while open, focus fallback after an opener disappears, empty/restore states and no invented image slots. The fixture caught the focus fallback issue; the implementation was corrected.
- Visual review corrected duplicate short descriptions, accent-tile arrow contrast and a mobile numbered-row text-gutter regression. A zero-overflow test alone would not detect the latter; the browser harness now checks a readable minimum width for those descriptions. Final frames replace the earlier captures.
- Initial sandbox runs could not load public fonts. Authorized reruns load them and assert that there are no resource/hydration/browser errors. Existing reviewed photo copies are reused, rather than fetching or inventing new photographs.
- Local resource observations remain approximately 140 KB of encoded initial script bodies, including Next.js/React. This is fixture evidence, not a production Core Web Vitals score or a physical-phone benchmark. Services/steps add no client runtime. No new dependency, lockfile or template recipe changed.

Full captures, seven desktop/phone review sheets and machine-readable results are in ignored `shots/interaction-rollout/`. All seven sheets and representative full-size service/process/gallery frames were visually inspected. `scripts/review-rollout.mjs` can regenerate the sheets without running a server or network check. Four representative screenshots are copied into `docs/reports/` for durable founder review. Prior pilot evidence remains preserved.

Source synchronization retains the source's mode/province fields and preview-specific request-time lookup, lifecycle and 404 behavior. The source copy is checkpointed locally and exported as a patch; no remote release is implied. The older source streamed-404 limitation remains separate.

Saved source checkpoint: `f4770a0` on local `claude/amazing-edison-juyem3`, based on `956edd5`. Export: `docs/reports/site-arsenal-2026-10-27-interaction-rollout.patch`, covering eight source files including its adapted report. After reviewing that source base, apply with `git apply --unidiff-zero`. Earlier revamp/pilot checkpoints and patches are preserved. The preview checkpoint also includes both verification/review-sheet scripts, synthetic unit coverage, representative captures and the ten-page rendered/checked roadmap PDF.

On restarting the real Desk, refresh desktop/mobile captures with Run verification checks before reviewing a concept affected by shared presentation updates. Saved version-bound design/publication approvals detect changed presentation code; previous decisions/history remain. This work does not run the real Desk or rewrite its records. Existing edits to `leads/chucks-ducts.json` remain excluded.

Local review: restart the gallery with `npm.cmd --prefix shots/site-arsenal-source start -- -p 3101`, then open `http://localhost:3101`. Kriv restarts the real Desk personally with `pnpm.cmd lead-desk`. Publication and outreach continue as separate user decisions.
