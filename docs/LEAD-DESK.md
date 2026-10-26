# KRIV Lead Desk

A local app on Kriv's Windows PC that prepares initial website offers using existing niche templates and reusable wording, with no paid AI. Kriv reviews the finished preview and email, approves or declines, or requests a preset revision. Publishing and sending remain Kriv's explicit actions. Subjective weak-site grading and custom changes can still need a Codex session.

## Start it

In a terminal in `C:\Users\user\kriv-previews`:

```
pnpm.cmd lead-desk
```

It opens http://localhost:4321 in the browser. Leave the window open while you work; Ctrl+C (or closing the window) stops it. Starting it a second time just opens the browser on the one already running.

- Database: `C:\Users\user\kriv-leads\lead-desk.db` (outside Git; holds business emails). Screenshots and finder output: `C:\Users\user\kriv-leads\shots\` and `finder\`. Email drafts are also saved as text files in `C:\Users\user\kriv-leads\emails\`.
- It listens on this PC only (127.0.0.1) and every change needs a token from the page, so other websites can't drive it. After a restart, reload the page.
- First time on a new PC: `corepack pnpm install`, Playwright installed globally (`npm i -g playwright` and `npx playwright install chromium`), then `node lead-desk/lib/import.mjs` once to load the old lead files.

## Daily routine: Review inbox

After this update, stop the old Desk with Ctrl+C, run `pnpm.cmd lead-desk` again, reload the browser, and select **Review inbox** if an old tab still opens Build.

1. Click **Start background preparation** once. It is paused by default; the choice is saved locally. Leave the terminal running and the PC awake. The worker checks for work once a minute; **Prepare next item** starts that check immediately. Pause stops new work; Cancel stops the current job where supported.
2. Wait for **Ready for review**. The worker prepares qualified leads first, using a niche template, neutral wording, freshly readable sources, credited photos, desktop/phone screenshots and technical checks. It aims for up to 10 initial offers per UTC day; this is a ceiling, not a promise of 10 qualifying leads. Preset revisions have priority. The inbox refreshes as work progresses.
3. Look at both screenshots and read the email. Click **Approve preview**, **Decline**, or **Request revision**. Revisions are preset choices: a different look/wording, calmer, bolder, shorter or more direct. There are no 23 manual boxes on this path. Your approval is the final review of appearance, wording and image suitability.
4. After approval, click **Publish approved preview**, then its separate confirmation. This uses the existing publishing workflow and production checks; it does not happen automatically. Once the page is checked live, use **Email and replies** to open the draft in Gmail, review it and send it yourself. Then click **I sent it**; record replies with **They replied** and negotiate in Gmail. Inbox reading and sending are not automated.

The system confirms the business name and contact mailbox on current source pages. Unsupported optional fields (for example a town, phone or service) are omitted; missing identity, unreadable sources, invalid records or failed technical checks hold the offer. Source matching does not understand every claim or judge a design: inspect the finished preview before approving. Revisions back up the previous draft, saved form and email under the private `kriv-leads/revisions/` directory before replacing them. Concurrent edits are preserved and hold the job. Existing dates/expiry are retained.

When no qualified draft remains, the worker can collect screenshots for the existing visual-review queue, check ungraded sites in batches of 20, and try the configured Hotfrog search once per UTC day. Default search: Ocala FL across the six existing niches; Search settings accepts up to three TX/FL/UT town identifiers. Directory blocks are skipped and reported. A modern site's subjective weak-site grade is never invented, so that queue can still require a Codex-assisted review. Finder/mailbox rules are unchanged.

If an offer is held, its reason appears under **In preparation**. It normally retries on the next UTC day; a preset revision can explicitly queue a new attempt. No photo key is needed when an existing draft has suitable credited photos; otherwise the existing Unsplash picker must be configured locally. Search metadata filters are conservative hints, not visual proof. Preview and email edits invalidate preparation and require checks again before approval or publishing.

Check Gmail for opt-outs first. Use **More tools > Dashboard** to record them on the do-not-contact list before any further outreach. The existing 20-email daily limit and footer remain in place (docs/OUTREACH.md).

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
