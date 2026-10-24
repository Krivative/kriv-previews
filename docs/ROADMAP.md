# KRIV Previews roadmap

Updated: 2026-10-24 · Last step finished: templates approved; open decisions filled in (Claude's recommendations, delegated by Kriv)

Goal: a daily run that finds qualified leads, builds a concept preview for each and writes a Gmail draft. Kriv reviews every page and sends every email by hand.

## Next up

- [ ] Kriv: import Krivative/kriv-previews in the Vercel dashboard (Kriv team → Add New → Project → Import; keep the default settings). Claude's Vercel access cannot create projects.
- [ ] Claude: verify the deployment (test lead live, noindex, real 404s), then Phase 3

## Done

- [x] Phase 0: Site Arsenal located and audited (no secrets, no client data) (Claude)
- [x] Written OK from Site Arsenal's original owner for commercial use (Kriv)
- [x] Phase 1 approach approved: all 20 templates, contact links disabled (Kriv)
- [x] Repo Krivative/kriv-previews created (Kriv)
- [x] Phase 1 app built, tested and pushed: guardrails, 55 tests, smoke checks (Claude)
- [x] Hosting: stay on Vercel Hobby until the first real preview or client (Kriv)
- [x] Pilot market: United States (Kriv)
- [x] Niches: dental clinics, HVAC companies, chiropractic clinics, med spas (Kriv)
- [x] Lead source: Google Maps data (via the official Google Places API) (Kriv)
- [x] Contact method: email (Kriv)
- [x] Vercel account: main Kriv team, next to the kriv project (Kriv)
- [x] Phase 2 go-ahead: create the project and deploy the fictional test lead (Kriv)
- [x] Email from hello@kriv.agency delivers (Kriv)
- [x] Postal address for emails: Lapu-Lapu City, Cebu, Philippines; open about being based there (Kriv)
- [x] Email footer and opt-out process written and tested; Gmail label "KRIV Outreach/Opt-out" created (Claude)
- [x] Preview address: kriv.agency/<slug>, any letter case, never clashing with main-site pages; tested through a stand-in main site (Claude)
- [x] HVAC templates built: Breeze (calm) and Thermal (bold) (Claude)
- [x] Chiropractic templates built: Align (calm) and Posture (bold) (Claude)
- [x] New templates approved: Breeze, Thermal, Align, Posture (Kriv)
- [x] Pilot area: San Antonio, Texas metro (Claude's pick, delegated by Kriv; easy to change)
- [x] Lead segments: no website AND weak or outdated website (Claude, delegated)
- [x] Email finding: read the business's own website and Google listing; no paid finder (Hunter.io) during the pilot (Claude, delegated)
- [x] Lead records: free Upstash Redis tier (Claude, delegated)
- [x] Batch-4 templates (gym, office, resort): not used in the pilot niches, so left "for review" (Claude, delegated)
- [x] Daily sending limit: 20 a day for the first 2 weeks, then up to 30 if replies are healthy and nothing lands in spam (Claude, delegated)
- [x] Separate Vercel project kept (no tracking on previews, main site never redeploys per lead) (Claude, delegated)

## Decisions needed from Kriv

- [ ] Ask Site Arsenal's original owner whether it is still deployed on their Vercel account (it is not in the Kriv team; its public gallery lists every site). Only Kriv can ask.

## Kriv's setup tasks

- [ ] In Gmail, open a test email from hello@kriv.agency → ⋮ → Show original: SPF, DKIM and DMARC should all say PASS (receiving mail does not prove this)
- [ ] Create a Google Cloud project with billing, enable Places API (New), create an API key restricted to that API, and set a budget alert (steps in docs/GOOGLE-PLACES-SETUP.md). Only Kriv can do this: it needs your Google account and a card.
- [ ] Confirm mail actually reaches the postal address as written (add a unit, block or lot number if needed)
- [ ] Upgrade to Vercel Pro before the first real preview is sent

## Setup (Claude builds, Kriv approves)

- [ ] US-ready content: US spelling, phone and address formats

- [ ] Phase 2: Vercel project created, test lead loads publicly with noindex headers
- [ ] Phase 3: pull request on Krivative/Kriv with the two rewrites in docs/MAIN-SITE-REWRITE.md, plus robots.txt disallow for /for/
- [ ] Phase 3: Kriv approves the merge and production deploy of the main site
- [ ] Database adapter for lead records (new leads need no deploy)
- [ ] Private review link so Kriv can see draft previews before they go live

## Pipeline (Phase 4)

- [ ] Lead finder: search one niche in one city, filter, deduplicate, skip a do-not-contact list
- [ ] Preview builder: facts from sources only, validate, render, screenshot, QA checklist
- [ ] Email drafter: one personal Gmail draft per lead with address and opt-out line (never sent automatically)
- [ ] Lead tracker: status per lead and a daily summary

## Pilot and automation

- [ ] 3 real leads end to end, each page and email approved by Kriv
- [ ] Batches of 10 a day with Kriv's review; track reply rates
- [ ] Daily scheduled run of the finder, builder and drafter
