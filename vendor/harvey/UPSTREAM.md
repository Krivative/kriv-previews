# Harvey components used by KRIV

Source: https://github.com/ethanplusai/harvey
Pinned commit: `4237f07f5873e270c362b43aec76e60fc4faa9cf`
Retrieved: 2026-10-31. MIT; copyright Ethan Rogers. See LICENSE.

The Python files in `harvey/` and Markdown in `skills/` are unmodified reference
copies at that commit. KRIV's `lead-desk/lib/harvey-runtime.mjs` adapts the isolated
Claude call and untrusted-text fencing to the Desk's existing Node runtime.
The drafting prompt loads the three upstream skills with KRIV's narrower rules.

This is a component integration, not the complete Harvey application. Harvey's
heartbeat, discovery providers, mail connectors, sender, account database and
reply handler are not installed or started. KRIV owns business identity, source
review, offer selection, draft revisions and history. No background inference.

When updating: pin a new commit; compare upstream isolation flags, environment,
native Windows executable resolution and skill changes; rerun runtime and sales
tests. Do not replace the references without updating the adaptation and notice.
