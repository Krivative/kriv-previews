# KRIV Previews roadmap

Updated: 2026-10-25 · Last step finished: Phase 3 verified on the PR's Vercel preview (Kriv)

Goal: a daily run that finds qualified leads, builds a concept preview for each and writes a Gmail draft. Kriv reviews every page and sends every email by hand.

## Next up

- [ ] Claude: Phase 4 lead finder for San Antonio, TX (dental, HVAC, chiropractic, med spa); list saved outside Git for Kriv's review
- [ ] Claude: report on images for the preview photo placeholders (herk-edit-kit or another generic/licensed source)

## Done

- [x] Phase 3: checked on the PR's Vercel preview: homepage looks like kriv.agency, /test-lead shows the preview with the concept banner, /nope shows "Nothing here"; recorded in the PR description (Kriv, 2026-10-25)

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
- [x] Vercel project kriv-previews imported in the Kriv team (Kriv)
- [x] Postal address completed: Block 3 Lot 7, Rajah Townhomes, Mactan, Lapu-Lapu City, Cebu 6015 (Kriv)
- [x] Site Arsenal: Kriv is the sole owner; no other copies or deployments exist (Kriv)
- [x] Google Places API skipped for the pilot; leads found by web search, public directories and the business's own site (Kriv)
- [x] Network access for this Claude environment widened (Kriv)
- [x] Phase 3: draft pull request Krivative/Kriv#19 with the two rewrites and the robots.txt disallow for /for/. Local check against the live preview app passed: main-site pages unchanged, /test-lead and /Test-Lead show the preview, unknown paths 404; Vercel build of the PR succeeded (Claude)
- [x] Phase 2: production preview at kriv-previews.vercel.app/for/test-lead is public; 8/8 smoke checks pass (noindex header and meta, banner, expiry, drafts, unknown slugs); page loads in a browser with styles and no failed requests (Claude)

## Decisions needed from Kriv

- [ ] Merge the docs branch `claude/amazing-edison-juyem3` of kriv-previews into main (a merge to main redeploys production)

## Kriv's setup tasks

- [ ] In the RECEIVING Gmail (e.g. krvinsocito918@gmail.com), open a test email from hello@kriv.agency → ⋮ → Show original: SPF, DKIM and DMARC should all say PASS
- [ ] Upgrade to Vercel Pro before the first real preview is sent

## Setup (Claude builds, Kriv approves)

- [ ] US-ready content: US spelling, phone and address formats

- [ ] Phase 3: Kriv approves the merge and production deploy of the main site
- [ ] Database adapter for lead records (new leads need no deploy)
- [ ] Private review link so Kriv can see draft previews before they go live

## Pipeline (Phase 4)

- [ ] Lead finder: web search + directories for one niche in one city, check each website, filter, deduplicate, skip a do-not-contact list
- [ ] Preview builder: facts from sources only, validate, render, screenshot, QA checklist
- [ ] Email drafter: one personal Gmail draft per lead with address and opt-out line (never sent automatically)
- [ ] Lead tracker: status per lead and a daily summary

## Pilot and automation

- [ ] 3 real leads end to end, each page and email approved by Kriv
- [ ] Batches of 10 a day with Kriv's review; track reply rates
- [ ] Daily scheduled run of the finder, builder and drafter
