# KRIV Sales: local Harvey integration

Implemented 2026-10-31 in kriv-previews. This adds a Sales workspace to the existing Lead Desk. KRIV owns the business records, qualification, previews, approval and outreach; selected MIT Harvey runtime safeguards and playbooks support optional Claude drafting. This is not a separate Harvey installation or a replacement for KRIV.

## Open it

- Double-click `Open KRIV Sales Demo.vbs` in the repository for fictional businesses at http://127.0.0.1:4324/#sales. Each new demo process starts with a fresh temporary database; restarting discards your demo session. Only Sales works in the demo.
- Double-click `Open KRIV.vbs` for your normal Desk at http://127.0.0.1:4321/#sales. The launcher starts a hidden local server if needed. If an older server occupies that port, it asks you to close that server and retry; it never kills another process.
- The normal Desk retains its existing automatic-building setting. Starting it can resume that existing worker. This release does not change that setting or add automatic Sales drafting.
- The server runs until stopped or Windows restarts. Closing the browser leaves it running. To stop a server launched hidden, use Windows Task Manager to identify the `node.exe` process by its command line (`lead-desk/server.mjs` or `scripts/sales-demo.mjs`) and end only that process.
- If Windows disables VBScript, run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/open-sales.ps1` from the repository (add `-Demo` for fictional data). This applies only to that invocation, not your system execution policy.

## First workflow

1. Open Sales. Existing businesses share their original records. Add a business manually or import a Harvey CSV with `company_name` and `website` columns. Imports merge by website and never promote imported email claims to verified contacts or qualification.
2. Record a public source URL, observation and date. Review each observation before confirming it. You can bring in existing saved research as unconfirmed observations.
3. Choose Discovery, Website or Build. Website needs a confirmed website issue; Build needs a booking or follow-up observation. Confirmed evidence must be from the last 30 days. A suggestion is not automatic qualification.
4. Start with a template, or enable Claude in Drafting settings and request a draft. Edit and save it. The draft is separate from the existing outreach email; use Copy saved draft and the existing email workspace for the manual handoff.
5. Continue through KRIV's existing preview, review, approval and publication steps. This screen never approves, publishes or sends email. Build here selects an offer about enquiry handling; it does not generate a working CRM or backend.

## Claude status and limitations

Double-click `Check KRIV Claude.vbs` to run one fictional live draft from your desktop. It uses the same isolated runtime and draft validation as Sales, saves a sanitized result to `shots/sales-provider-check.json`, and shows a completion message. It does not open the Desk database, send email or enable drafting in your real workspace. The check uses one subscription request. A successful report has `mode: "live-fictional"` and `liveVerified: true`; an installation-only report does not verify inference. The continuation prompt is in `docs/CONTINUE-KRIV.md`.

Claude Code must be installed and signed in with your subscription. ChatGPT or Claude web-app subscriptions are not a direct API connection to this local workspace. This first version uses Claude Code as the optional drafting runtime; chat-app connectors are future work.

Installation compatibility and subscription login were checked successfully on 2026-10-31. One live fictional draft timed out. Independent requests to both `api.anthropic.com` and `claude.ai` returned `EACCES` in the agent sandbox. Live inference is now **verified** (2026-11-01, Claude Code session): `scripts/verify-sales-provider.mjs` produced `mode: "live-fictional"`, `liveVerified: true`, `result: "live-draft-passed"`, a 76-word validated fictional draft in 9.5 s through the unchanged isolated runtime. Only the sanitized report was stored; no prompt, output or account detail was saved. The in-app installation check confirms required CLI flags, not account capacity or network access.

Claude drafting is off by default, serial, and capped at 20 attempts per UTC day. Failures count toward that limit and leave saved drafts unchanged. It uses the subscription login, an isolated temporary working directory, no tools/MCP/project instructions, no persistent conversation and bounded execution. API keys and provider overrides are excluded. Only the business name, selected offer and reviewed observations are included; avoid adding private information to observations. Model drafts still require human review.

## Persistence and safeguards

Three additive SQLite tables hold workspaces, drafting attempts and replaced draft versions. Existing lead fields, drafts and qualification rules remain in place. Edits use revision checks; changing evidence makes previous drafts stale. Opt-outs, bounces, declined prospects and already-sent initial outreach prevent new initial drafts. Draft history is stored for recovery; a history browser is not included yet.

Harvey provenance and license: `vendor/harvey/UPSTREAM.md` and `vendor/harvey/LICENSE`. Discovery providers, campaign scheduling, reply handling and sending were not imported. No external service or paid API was provisioned.

## Verification and continuation

- Lint, typecheck, 384 unit/integration tests, production build and 16 smoke checks passed.
- Browser checks passed through real HTTP routes and temporary SQLite: saved edits/reload, injected model success/failure, stale evidence, CSV imports, desktop/tablet/phone layouts and CSRF. No emails or external requests occurred. Model output was injected; this is not a live-Claude success claim.
- Both launcher configurations passed `-CheckOnly`. The normal Desk was not started or opened during verification, so private records and settings were not inspected. The demo handshake was checked separately.
- Preview and production data adapters are unchanged. No push or deployment occurred.

Next: founder use of the local combined workflow (Open KRIV Sales Demo.vbs first, then Open KRIV.vbs). Discovery providers, reply assistance and app connectors remain separate later stages.
