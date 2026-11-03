# Reply handling (2026-11-02)

Kriv chose **Gmail read + drafts**, with one follow-up, a booking link and a daily summary.
The Desk never sends email: it only reads replies to hello@kriv.agency, labels unsubscribes
and puts suggested answers and follow-ups in **Gmail Drafts**. Kriv reviews each one in Gmail
and presses Send.

## What happens every 30 minutes

While the Desk is open (or during the unattended Windows runs), once Gmail is connected:

| Reply | What the Desk does |
| --- | --- |
| Unsubscribe / not interested / remove me | Address **and** its domain (not free-mail domains) go on the do-not-contact list, the lead becomes `expired`, the Gmail thread gets the label **KRIV Outreach/Opt-out**. No answer is drafted. Honoured within minutes (the legal limit is 10 business days). |
| Bounce (mailer-daemon) | That address goes on the do-not-contact list; it is never emailed again. |
| Out-of-office / automatic reply | Recorded only; the follow-up still happens later. |
| Interested, question, not now, other | Lead becomes `replied`; a suggested answer is created as a Gmail draft in the same thread. Interested and question answers offer the booking link (or ask for a call time if no link is saved). |
| No reply 4 days after the email | **One** polite follow-up draft in the same thread, with the full footer. Never a second one. Not for replied, unsubscribed, declined or bounced businesses. |

Sorting uses fixed word patterns (no AI). Reply text is treated as untrusted data: stored in
the private Desk database and matched against patterns, never used as instructions.

The **Replies** screen in the Desk lists every reply with what happened and an "Open in Gmail"
link, the follow-ups drafted, counts, the booking link setting and **Check replies now**. The
status board shows a daily summary (business names and categories only, no addresses or text),
from `kriv-leads\replies-summary.json`.

## One-time Gmail setup (about 10 minutes, free)

Use the Google account that receives hello@kriv.agency.

1. Open https://console.cloud.google.com/ and sign in with that account. Create a project
   named **KRIV Desk** (top bar, project picker, New project).
2. **APIs & Services > Library**: search **Gmail API** and click **Enable**.
3. **APIs & Services > OAuth consent screen** (Google Auth Platform > Branding/Audience):
   app name **KRIV Desk**, your support email. Audience: **Internal** if you see it (Google
   Workspace accounts; no review needed). Otherwise choose External and add your own address
   under **Test users**.
4. **Clients** (or Credentials > Create credentials > OAuth client ID): type **Desktop app**,
   name **KRIV Desk**, Create, then **Download JSON**.
5. Save that file as `C:\Users\user\kriv-leads\secrets\gmail-client.json` (create the
   `secrets` folder). It stays on this laptop: never in Git, and the Desk never serves files
   from that folder.
6. In a terminal in `C:\Users\user\kriv-previews` run `node scripts/gmail-setup.mjs`. The
   browser opens Google's sign-in: choose the hello@kriv.agency account and allow access.
   The page then says **Connected**. The sign-in is saved as
   `kriv-leads\secrets\gmail-token.json` and is never printed.
7. Open the Desk's **Replies** screen, save your booking link (Calendly, Google Calendar
   appointment page...), and click **Check replies now** once.

Access: Google's `gmail.modify` permission (read, label and create drafts). Google offers no
"drafts only" permission, so the code itself has no send function and refuses any request to
a send endpoint (tested). To disconnect: delete `kriv-leads\secrets\gmail-token.json` and
remove **KRIV Desk** at https://myaccount.google.com/permissions.
