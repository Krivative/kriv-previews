# Outreach rules (US pilot)

Emails go from `hello@kriv.agency`, one at a time, written for one business, and are
**sent by Kriv by hand** after reviewing the preview page. Claude only writes Gmail drafts.
This is our reading of the FTC's CAN-SPAM guidance, not legal advice.

## Every email

- **Honest From and subject.** From: Kriv <hello@kriv.agency>. The subject says what the
  email is about (for example "A website concept for Acme Heating & Air"). No "Re:" or
  "Fwd:" on a first email, no fake urgency.
- **Says it is a business offer** and where KRIV is based. The footer does this.
- **Postal address:** Block 3 Lot 7, Rajah Townhomes, Mactan, Lapu-Lapu City, Cebu 6015, Philippines.
- **Opt-out:** "Reply 'unsubscribe' and I won't email you again." It must keep working
  for at least 30 days after sending. In practice: forever.
- **No claims we can't back up** about them or about KRIV (no invented results,
  reviews, clients or prices). Same rule as the preview pages.
- The footer text lives in `src/outreach/footer.ts`; the drafter must use `emailFooter()`.

## Opt-out handling

Since 2026-11-02 the Desk does steps 2 and 5 automatically once Gmail is connected
(docs/REPLIES.md): unsubscribes and bounces are added to the do-not-contact list within
30 minutes and the thread is labeled. Kriv still checks the Replies screen.

1. Check replies to `hello@kriv.agency` at least every few days.
2. A reply that asks to stop (unsubscribe, remove me, not interested, stop, no thanks):
   - add the Gmail label **KRIV Outreach/Opt-out** to the thread,
   - add the email address **and** its domain to the do-not-contact list,
   - set that lead's `status` to `expired` (the preview stops showing).
3. Do this within **10 business days** (the legal limit). Aim for same day.
4. Never email that address or domain again, never re-add it, never share or sell it.
5. The daily pipeline checks the do-not-contact list **before** it creates any draft and
   also scans new replies with `isOptOut()` to flag opt-outs for Kriv.

Do-not-contact list: kept with the lead records in the database (roadmap: "Database
adapter"), not in Git, because it holds email addresses. Until then, Kriv keeps the
Opt-out label as the list.

## Volume

Start with 20 to 30 emails a day from `hello@kriv.agency`. Raise slowly only if replies
stay healthy and nothing lands in spam. Bulk senders (5,000+ a day to Gmail) need
one-click unsubscribe headers; we are far below that.

## Canada and other countries (2026-11-02)

Kriv targets Canada as well as the US. This is general guidance, not legal advice.

- **Canada (CASL):** a business email address that is published openly (its website or a
  directory) implies consent only for messages about the recipient's business, and only when
  no notice says they do not want unsolicited email. The website check records such notices
  (`noSolicitation`), the finder puts those businesses in "none", and Sales holds them. Every
  email identifies KRIV with the postal address and an unsubscribe that keeps working; honour
  an opt-out within 10 business days (the Desk records it at once). Quebec expects French:
  not targeted yet.
- **Australia and New Zealand:** similar "conspicuous publication" rules to Canada.
- **UK:** limited companies may be emailed with an opt-out; sole traders and partnerships need
  prior consent. Not targeted yet.

## When to send

Best: 9:30-11:30 am in the recipient's time (early afternoon is the fallback); avoid the
first hour of Monday. Use Gmail's Schedule send and space emails 3-5 minutes apart. From the
Philippines (UTC+8) in North American winter time: Eastern 10:00 am = 11:00 pm PHT, Central
= midnight, Mountain = 1:00 am, Pacific = 2:00 am, Atlantic (Halifax) = 10:00 pm. During US
and Canadian daylight time (from the second Sunday of March) each is one hour earlier in PHT.
The Florida panhandle west of the Apalachicola River and most of Texas are Central; El Paso is
Mountain; Arizona stays on Mountain standard time all year.
