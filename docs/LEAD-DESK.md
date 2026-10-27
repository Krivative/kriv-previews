# KRIV Lead Desk

A local, private workspace for reviewing website concepts and moving each business through checks, publication and manual outreach. The hybrid inbox and focused review keep one next action visible. Existing template preparation uses no paid AI.

## Start it

In a terminal in `C:\Users\user\kriv-previews`:

```
pnpm.cmd lead-desk
```

It opens http://localhost:4321 in the browser. Leave the window open while you work; Ctrl+C (or closing the window) stops it. Starting it a second time just opens the browser on the one already running.

- Database: `C:\Users\user\kriv-leads\lead-desk.db` (outside Git; holds business emails). Screenshots and finder output: `C:\Users\user\kriv-leads\shots\` and `finder\`. Email drafts are also saved as text files in `C:\Users\user\kriv-leads\emails\`.
- It listens on this PC only (127.0.0.1) and every change needs a token from the page, so other websites can't drive it. After a restart, reload the page.
- First time on a new PC: `corepack pnpm install`, Playwright installed globally (`npm i -g playwright` and `npx playwright install chromium`), then `node lead-desk/lib/import.mjs` once to load the old lead files.

## Daily routine: Inbox and focused review

After updating, stop/restart the Desk, reload the browser and open Workspace. The first screen is the hybrid inbox: Needs my attention, Ready for review, Revisions, Remaining checks, Ready for publishing, Outreach, Follow-ups and Completed/declined. Search/filter/sort the compact list, or click Continue where I left off.

1. Open one business. Inspect the desktop and mobile captures; open the full screenshot or interactive concept when needed. The latter uses the existing local preview app on port 3100.
2. **Approve** records visual approval for this exact version only. The confirmation names the next incomplete step: verify business information, finish checks, review the email, or review publication readiness. Design approval never publishes.
3. **Revise** asks what should change, with an optional section. Feedback saves and the concept becomes Awaiting revision. Its record/captures and decision history are preserved privately. Nothing is generated or queued. Open revision editor only when separately ready to work on changes, or Review next lead.
4. **Decline** accepts an optional reason and distinguishes this concept from the business as a prospect. Both block the current concept's publication/outreach; History retains the decision and a Reconsider action. Revising/declining an unpublished approved concept revokes publication readiness and preserves its original approved version.
5. **Run verification checks** refreshes sources and desktop/mobile captures without replacing the design. Unchanged source-matched offers use the preparation report; custom or changed facts still need the existing human fact review. Automatic checks cannot be ticked manually. Changed records/captures/template presentation require a new visual review.
6. Read the email in the Email tab and click **I've reviewed this email**. Complete the draft first if needed. Review publication readiness, **Approve for publication**, then **Publish preview...** and its explicit confirmation. The existing publishing copy and full checks remain in use. Wait for live verification; a verification-only retry does not republish.
7. Once published and verified, review the outgoing email and **Open Gmail compose**. Read and send it yourself in Gmail, then **I sent this email**. Record replies and a next follow-up date/note manually. Follow-up tracking does not send messages.

Feedback, notes, email edits and follow-up reminders save after a short typing pause and before internal navigation. Saving/Saved/Failed feedback is visible. A failed save keeps your screen and text; stale windows cannot silently replace a newer version. Saved work and Continue survive restarts. Manual QA, history and old approvals remain intact.

Check Gmail for opt-outs first. Use **More tools > Dashboard** to add a do-not-contact address/domain before any outreach. Critical contact restrictions stay visible and block decisions, publication and outreach. The existing 20-email daily limit and footer remain in place (docs/OUTREACH.md). LinkedIn remains manual.

## Optional background preparation

Preparation settings at the bottom of the inbox retain the existing opt-in template worker: up to 10 initial offers per UTC day while the local Desk runs, plus checking/collection with the existing qualification/mailbox rules. Default search remains Ocala FL and the six existing niches; settings accept one to three TX/FL/UT towns. Blocks are reported and skipped. No paid AI is enabled.

Reviewed designs and revision requests are excluded from automatic preparation. Freeform feedback is never treated as an instruction to run the worker. Existing private backups precede any separately authorized preset replacement; concurrent edits hold jobs. Unsupported optional facts are omitted; missing identity/mailbox, unreadable sources, failed/stale checks and incomplete emails block progression.

## Advanced manual routine (More tools)

The original screens are retained for investigation and custom edits. They keep their manual QA checklist; the Review inbox uses a separate preparation report and does not tick those boxes on your behalf.

1. **Dashboard**: read *Needs Kriv*. Add any opt-out replies ("unsubscribe", "stop") to the do-not-contact list first: the address and its domain are blocked for good and the lead is set to expired.
2. **1 Find**: pick a state, towns and niches, click Find. Hotfrog town pages and ChamberMaster directories, one request every 4 to 9 seconds. Chains, specialists and the do-not-contact list are skipped; businesses already known are not added twice. A source that blocks this network is reported and skipped, never worked around (Hotfrog showed a verification page on 2026-10-26).
3. **2 Check**: check the new websites, 20 at a time (about 5 to 10 minutes per batch). Results show in plain English with a phone screenshot. Blocked sites are "not checked", never weak.
4. **3 Review**: *Qualified* leads are ready for a preview. *Visual review*: tick what fails on each site's screenshots (2 or more failed items make it weak; a site that already looks professional is not a lead: click *Not dated*).
5. **4 Build**: the form fills itself from their website and listing. Check every fact against its source on the right; every fact needs its source URL, and empty means the section is hidden. Pick a template and photos (their own first; otherwise generic Unsplash scenes, credited automatically). *Save draft*, then *Screenshots and QA*. Look at both screenshots and tick the rest of the QA list.
6. **6 Email**: write the email draft (every lead gets one) from a template; fill every `[[blank]]`. The footer is added automatically.
7. **5 Approve**: *Approve this page* (needs every QA item and the email draft). Then *Publish…*, read what will change, and *Confirm*. The desk commits that one lead file to main from its own clean copy (`C:\Users\user\kriv-previews-publish`), runs lint, typecheck, tests, build and smoke checks, pushes, and waits until kriv.agency shows the page. *Dry run* runs the checks without committing.
8. **6 Email** again: *Open in Gmail* (only once the page is live) opens a filled-in compose window from hello@kriv.agency. Read it, click Send in Gmail, then click *I sent it*. When someone replies, click *They replied*.
9. **7 LinkedIn** (extra, never instead of email): copy the note (200 characters at most), open the profile in your browser, send it yourself, and set the status. The desk never logs in to LinkedIn.

Stay at 20 emails a day for now (the Email screen counts them; docs/OUTREACH.md).

## Source reads and service suggestions

- The Build screen shows when the selected source was last read, in UTC. An initial read may reuse a successful copy from the same UTC day. Older or unknown dates need a fresh read before checking facts.
- *Read their pages again* always requests fresh copies of the business's pages and listings. It preserves your form edits, including changes made while the read is running. A failed request lets you retry; a blocked source shows its failed attempt instead of old text presented as fresh.
- Suggested service names come only from clearly labeled service sections or service/treatment pages on the business's own site. Unrelated homepage headings and directory listings are not used for service suggestions. Suggestions may miss services or include unsuitable text: verify each name, delete incorrect suggestions and add missing services manually.
- Service descriptions and the required line under the hero headline are left for you to write from a source. Suggested services are not automatically turned into hero claims. Existing saved drafts are not rewritten by this change.
- Reading a page does not verify its claims or approve a preview. The existing QA and Kriv's approval still apply. Finder qualification rules are unchanged.

## Paid AI disabled

Kriv chose no paid AI on 2026-10-26. The legacy AI switch, prefill and suggestion routes are blocked in code, even if an older saved setting is enabled or a key exists. Template preparation uses no AI provider, key, AI budget or AI subscription. Previous SDK code is retained dormant for continuity; enabling it would require a separately approved code change. Existing hosting and photo-service configuration are separate from AI spending.

## Rules the desk enforces

- Facts only from sources; noindex, the concept banner and the inert links are untouched (the preview app's own checks run before every publish).
- Approve only after a current preparation report (or completed advanced manual QA) and an email draft; publish only on the confirm click. A preparation report binds the page, email, sources and screenshots; edits invalidate it. Gmail only opens for a live page, an address not on the do-not-contact list, a draft with no blanks, and under the daily limit; an email marked sent can't be opened again.
- No secrets or personal data in Git: the database, emails, screenshots and finder output live in `C:\Users\user\kriv-leads\`.

## For Claude and other agents

Code: `lead-desk/` (server, `lib/`, `public/`), lead rules shared with the CLI scripts in `scripts/finder/rules.mjs` and `sources.mjs`. Tests include `tests/lead-desk.test.ts`, `tests/build-sources.test.ts` and `tests/preparation.test.ts`. The `preparations` table is additive; existing manual QA/history are retained. Never call live approve or publish endpoints yourself: approving and publishing are Kriv's clicks. Agent tests use only synthetic businesses, in-memory databases and temporary directories, never Kriv's private lead directory.
