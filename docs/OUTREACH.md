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
