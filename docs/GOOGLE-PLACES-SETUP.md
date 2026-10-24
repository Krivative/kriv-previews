# Google Places API setup (Kriv, about 10 minutes)

**Skipped for the pilot (Kriv, 2026-10-24).** Kept for later if the pilot needs more leads. Only Kriv can do this: it uses your Google account and a card.

1. Go to https://console.cloud.google.com/ and create a project named `kriv-leads`.
2. Billing → link a billing account (add a card). Google gives a monthly amount of free
   usage per API; check the current numbers on the Google Maps Platform pricing page.
3. Billing → Budgets & alerts → create a budget for `kriv-leads` (for example US$20 a month)
   with email alerts at 50%, 90% and 100%.
4. APIs & Services → Library → enable **Places API (New)**.
5. APIs & Services → Credentials → Create credentials → API key.
   Edit the key → API restrictions → **Restrict key** → tick only *Places API (New)*. Save.
6. Give the key to Claude **as a secret, not in chat or Git**:
   - Claude Code cloud: add it as an environment variable named `GOOGLE_PLACES_API_KEY`
     in the environment settings (the cloud environment menu → Edit), then start a new session.
7. Read the Google Maps Platform terms on storing Places data before the pilot. Plan:
   keep only the place ID long term; refresh other details when building a preview.
