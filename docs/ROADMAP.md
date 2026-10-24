# KRIV Previews roadmap

Updated: 2026-10-24 · Last step finished: pilot decisions (US; dental, HVAC, chiropractic, med spa; email)

Goal: a daily run that finds qualified leads, builds a concept preview for each and writes a Gmail draft. Kriv reviews every page and sends every email by hand.

## Next up

- [ ] Kriv: import Krivative/kriv-previews in the Vercel dashboard (Kriv team → Add New → Project → Import; keep the default settings). Claude's Vercel access cannot create projects.
- [ ] Claude: verify the deployment (test lead live, noindex, real 404s), then Phase 3
- [ ] Claude: build HVAC and chiropractic templates (calm + bold each)

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

## Decisions needed from Kriv

- [ ] Pilot city or state to start with (suggested: one metro area)
- [ ] Also target businesses with a weak or outdated website? (their email is on their site, so it can be found automatically)
- [ ] Email finder: OK to use Hunter.io (paid, finds emails by domain), or manual lookup only?
- [ ] OK to use the free Upstash Redis tier for lead records
- [ ] Can the 5 batch-4 templates (still "for review") be used for real leads?
- [ ] Is Site Arsenal still deployed from the original client's Vercel account? (it is not in the Kriv team; its public gallery lists every site)

## Kriv's setup tasks

- [ ] In Gmail, open a test email from hello@kriv.agency → ⋮ → Show original: SPF, DKIM and DMARC should all say PASS (receiving mail does not prove this)
- [ ] Create a Google Cloud project with billing and a Places API key (stored as a Vercel/environment secret, never in Git)
- [ ] Postal address to put in every email (US CAN-SPAM requires a valid physical or PO box address)
- [ ] Agree a daily sending limit (suggested 20 to 30 personal emails a day)
- [ ] Upgrade to Vercel Pro before the first real preview is sent

## Setup (Claude builds, Kriv approves)

- [ ] US-ready content: US spelling, phone and address formats, CAN-SPAM footer text
- [ ] HVAC templates (calm + bold) built in Site Arsenal, copied here
- [ ] Chiropractic templates (calm + bold) built in Site Arsenal, copied here

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
