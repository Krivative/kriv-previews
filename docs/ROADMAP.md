# KRIV Previews roadmap

Updated: 2026-10-24 · Last step finished: Phase 1 pushed to Krivative/kriv-previews

Goal: a daily run that finds qualified leads, builds a concept preview for each and writes a Gmail draft. Kriv reviews every page and sends every email by hand.

## Next up

- [ ] Kriv: answer the decisions below (market, lead source, contact method, Vercel account)
- [ ] Claude: Phase 2, deploy the test lead to Vercel (needs the Vercel account and Kriv's go-ahead)

## Done

- [x] Phase 0: Site Arsenal located and audited (no secrets, no client data) (Claude)
- [x] Written OK from Site Arsenal's original owner for commercial use (Kriv)
- [x] Phase 1 approach approved: all 20 templates, contact links disabled (Kriv)
- [x] Repo Krivative/kriv-previews created (Kriv)
- [x] Phase 1 app built, tested and pushed: guardrails, 55 tests, smoke checks (Claude)
- [x] Hosting: stay on Vercel Hobby until the first real preview or client (Kriv)

## Decisions needed from Kriv

- [ ] Pilot market and niche (suggested: one city, one industry, such as dental or cafés in Cebu)
- [ ] Lead source and budget: Google Places API with a Google Cloud billing account?
- [ ] Contact method for no-website leads: manual Facebook lookup, Messenger or phone
- [ ] Vercel account for the kriv-previews project (ideally the same one as the kriv main site)
- [ ] OK to use the free Upstash Redis tier for lead records
- [ ] Can the 5 batch-4 templates (still "for review") be used for real leads?
- [ ] Is Site Arsenal still deployed from the original client's Vercel account? (its public gallery lists every site)

## Kriv's setup tasks

- [ ] Confirm SPF, DKIM and DMARC records exist for kriv.agency (Claude could not check from its workspace)
- [ ] Agree a daily sending limit (suggested 20 to 30 personal emails a day)
- [ ] Upgrade to Vercel Pro before the first real preview is sent

## Setup (Claude builds, Kriv approves)

- [ ] Phase 2: Vercel project created, test lead loads publicly with noindex headers
- [ ] Phase 3: pull request on Krivative/Kriv sending kriv.agency/for/* to the preview app, plus robots.txt disallow
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
