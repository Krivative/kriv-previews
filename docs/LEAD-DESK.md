# KRIV Lead Desk

A local app on Kriv's Windows PC that runs the lead pipeline: find leads, check their sites, review, build a preview, approve, publish, email and LinkedIn. Daily work needs no Claude session. Nothing is sent or published without Kriv's click.

## Start it

In a terminal in `C:\Users\user\kriv-previews`:

```
corepack pnpm lead-desk
```

It opens http://localhost:4321 in the browser. Leave the window open while you work; Ctrl+C (or closing the window) stops it. Starting it a second time just opens the browser on the one already running.

- Database: `C:\Users\user\kriv-leads\lead-desk.db` (outside Git; holds business emails). Screenshots and finder output: `C:\Users\user\kriv-leads\shots\` and `finder\`. Email drafts are also saved as text files in `C:\Users\user\kriv-leads\emails\`.
- It listens on this PC only (127.0.0.1) and every change needs a token from the page, so other websites can't drive it. After a restart, reload the page.
- First time on a new PC: `corepack pnpm install`, Playwright installed globally (`npm i -g playwright` and `npx playwright install chromium`), then `node lead-desk/lib/import.mjs` once to load the old lead files.

## Daily routine

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

## Optional AI help (off by default)

With `ANTHROPIC_API_KEY=...` in `.env.local` (never committed), a switch appears on the Dashboard under *Data*. When on, Claude Haiku 5.5 can fill the preview form from the text of their pages and suggest email or LinkedIn wording. Each call shows its cost (about US$0.002 to fill a form, US$0.001 per wording suggestion); the total is on the Dashboard. A source URL it gives is kept only if it is one of the pages read, and everything it writes is checked by Kriv like any other draft.

## Rules the desk enforces

- Facts only from sources; noindex, the concept banner and the inert links are untouched (the preview app's own checks run before every publish).
- Approve only after QA and an email draft; publish only on the confirm click; Gmail only opens for a live page, an address not on the do-not-contact list, a draft with no blanks, and under the daily limit; an email marked sent can't be opened again.
- No secrets or personal data in Git: the database, emails, screenshots and finder output live in `C:\Users\user\kriv-leads\`.

## For Claude and other agents

Code: `lead-desk/` (server, `lib/`, `public/`), lead rules shared with the CLI scripts in `scripts/finder/rules.mjs` and `sources.mjs`. Tests: `tests/lead-desk.test.ts`. Never call the approve or publish endpoints yourself: approving and publishing are Kriv's clicks.
