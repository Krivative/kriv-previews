# Continuation prompt

Paste this into the next coding session:

> Continue the KRIV + Harvey integration in C:\Users\user\kriv-previews on claude/amazing-edison-juyem3. Read AGENTS.md, HANDOFF.md, docs/PLAN.md and docs/KRIV-SALES.md first. The local Sales integration already exists; review and continue it rather than rebuilding. Keep HANDOFF.md current after every verified stage. Monitor session usage only through available telemetry, state when quota is unavailable, and give me an updated continuation prompt before a visible usage/context limit.
>
> First inspect shots/sales-provider-check.json if it exists. This is a synthetic provider-check report, safe to read. Only mode=live-fictional with liveVerified=true proves live drafting passed; installation-only is not inference verification. As of 2026-11-01 it records live-fictional/liveVerified=true (76-word draft, 9.5 s). If a later report fails, the user can double-click Check KRIV Claude.vbs outside the restricted agent session. Do not bypass sandbox network restrictions or keep retrying the same blocked request. If the live check fails, diagnose its sanitized result without weakening runtime isolation.
>
> Existing verification: lint, typecheck, 384 tests, build, 16 smoke checks and fictional HTTP/browser/SQLite flows passed. Claude installation, subscription login and one live fictional draft passed. Template drafting works. Check HANDOFF.md for newer results.
>
> The integration is saved as a local commit on the branch (see HANDOFF.md); not pushed. Never blanket-stage: leads/chucks-ducts.json is an unrelated modification; beck-brian.json, j-tech-mechanical.json, precision-mechanical.json and sunset-automotive.json are unrelated untracked leads. Leave them unread and unstaged.
>
> Do not open C:\Users\user\kriv-leads, secrets, the normal Desk UI/API or start its worker during verification. Use temporary fictional databases and the Sales demo. Preserve automation settings and existing preview safeguards. No real approval, publication, email, LinkedIn, remote push or deployment is authorized. Discovery, reply handling and app connectors remain later stages; do not treat a fictional drafting pass as approval to activate them.

## Usage checkpoint

On 2026-10-31 the available usage query returned `goal: null`, `remainingTokens: null` and `completionBudgetReport: null`. Account quota and an exact remaining-session percentage are unavailable. Do not invent a percentage or promise a warning that depends on unavailable telemetry. Preserve progress at stage boundaries and on any explicit limit warning.
