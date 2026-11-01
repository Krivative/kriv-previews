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

## Discover from the finder (2026-11-01)

Kriv chose Discovery as the next stage, using the Desk's existing free finder (Hotfrog plus 16 chamber directories) rather than a new provider.

- The Sales side panel has **Discover from the finder**: businesses the finder already found and checked, with no Sales research yet. Groups: qualified by the finder (default), near misses with no business email yet, and sites waiting for visual review. Filter by niche and state; up to 50 shown, newest checks first. The panel remembers whether it is open and its filters while the Desk tab stays open.
- Hidden: declined, expired, sent or replied businesses, anything on the do-not-contact list, businesses with no dated check or no public source URL, and checks that only say "not checked".
- **Start research** turns the site-check flags and visual-review notes into observations of type "Website issue", using the Desk's existing plain-English wording, the check date and the website (or the directory listing when there is no website). All arrive **unconfirmed**: tick "I checked this observation against its source" after looking yourself. **Use site-check findings** on a business adds any findings not already present.
- Checks older than 30 days are marked in the list. Their observations can be added but never count, even when confirmed, until the website check is run again.
- Discovery makes no network requests, starts no finder run and changes no finder rule, bucket or status. The automatic finder keeps running as before while the Desk is open.

## Every Kriv.Agency service (2026-11-02)

Kriv asked to offer everything Kriv.Agency does, with websites as the lead offer. Services live in `lead-desk/lib/services.mjs` (label, what it is for the Claude prompt, the starter draft's question, and the evidence it needs):

| Offer | Needs a reviewed |
| --- | --- |
| Website | website issue |
| SEO (local search) | search visibility observation |
| Social media marketing (long-form videos, commercials, 3–5 shorts and 3–10 image/carousel posts a week; scope agreed per client) | social media observation |
| Social media management (comments, replies, engagement) | social media observation |
| Booking & CRM setup (KRIV Build demonstration; id `build`) | booking or follow-up observation |
| Ads, Website maintenance, Executive assistant, Outsourcing, Discovery conversation | any observation |

- The website check now also records which social networks the home and contact pages link to (hosts only) and whether the home page has a meta description. From those, Start research adds **unconfirmed** observations: no linked social profile, no meta description, a placeholder page title ("Home", empty), and, for appointment businesses (dental, chiropractic, med spa, salon, fitness, pets, clinics), no link to a known online booking service. Checks from before 2026-11-02 give none of these rather than a guess; automatic building re-checks open businesses with older checks (modern sites first, 20 at a time) after each day's finding is done.
- "Waiting for visual review" is now **Modern website (offer SEO, social media, ads or booking)** in Discover: those businesses already have a working site, so they get a non-website pitch.
- The suggestion order is website, booking & CRM, social media, SEO, otherwise a discovery conversation; the panel also lists other offers the reviewed evidence supports. Starter drafts use the offer's own question and one line naming a few other services. Claude drafting is told what the selected service is and to lead with it. No prices, packages or outcomes are ever written into a draft.

## Claude app connector (2026-11-01)

Kriv chose the app connector as the next Sales stage. `lead-desk/mcp/sales-mcp.mjs` is a local MCP server (stdio, no SDK or new dependency) that the Claude desktop app starts on demand. It opens the Desk database and offers five tools: list businesses, get one business, the Discover list, start research (unconfirmed findings) and save a draft (same validation as the screen: confirmed, fresh evidence only; plain text; under 150 words). There is no tool to approve, publish, send, use LinkedIn or change opt-outs, and business emails and imported contact claims are never returned. Saved drafts appear in the Desk for review.

- Install: `node scripts/install-sales-connector.mjs` (add `--print` to see the target file without writing). It merges a `kriv-sales` entry into the desktop app's config, backing up the old file first. Restart the Claude app (quit it from the tray, not only the window), then ask it, for example, "Show my KRIV Sales discover list". Remove the `kriv-sales` entry to uninstall.
- Config location: current Microsoft Store builds (4.4212, checked 2026-11-01) read `%LOCALAPPDATA%\Claude-Data\claude_pzs8sxrjxfjjc\claude_desktop_config.json`. The first install on 2026-11-01 wrote to the older Store location `%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\`, which this build ignores, so the app never loaded it. The installer now checks Claude-Data first, then the older Store folder, then `%APPDATA%\Claude`; the stale copy in the old folder is harmless.
- Claude Code sessions do not load this connector (it is for the desktop app's chat). From Claude Code, run the server over stdio instead.
- Verified: `tests/sales-mcp.test.ts` drives the server over real stdio on a temporary database and covers the installer's folder choice. On 2026-11-01 a stdio run against the real Desk database answered initialize, tools/list (five tools), list businesses (50, its cap) and Discover (13), with no email addresses in either result (only counts and field names were printed). Not yet verified inside the Claude app: writing the app's live config was blocked for the agent, so Kriv runs the installer.

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
- Live UI check (2026-11-01): `NODE_PATH=$(npm root -g) node scripts/verify-sales-live.mjs` drives the fictional demo in a real browser, enables Claude, requests one draft through the real isolated runtime, then edits, saves and reloads. Passed twice (8.0 s and 7.5 s; 92 and 71 words): edit persisted, Claude version archived, one completed run, zero browser errors and zero browser requests outside the demo. Uses one subscription request per run. Screenshot: `docs/reports/sales-2026-11-01-live-draft.png` (fictional data).
- Code review (2026-11-01): all page insertions escape values, source URLs are restricted to public http(s), opt-out matching covers addresses, domains and subdomains, revision checks guard every write and the daily cap counts failures. No defects found.
- Preview and production data adapters are unchanged. No push or deployment occurred.

Next: founder use of the local combined workflow, including Discover (Open KRIV Sales Demo.vbs first, then Open KRIV.vbs). Reply handling remains a separate later stage that needs Kriv's decision. Reply assistance remains a separate later stage.
