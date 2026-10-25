# KRIV Previews roadmap

Updated: 2026-10-25 · Last step finished: release note live (Krivative/Kriv#20), Unsplash picker and photo credits built, lead rules updated

Goal: a daily run that finds qualified leads, builds a concept preview for each and writes a Gmail draft. Kriv reviews every page and sends every email by hand.

## Next up

- [ ] Claude: lead finder runs in Texas, Florida and Utah towns until at least 10 qualified leads; report per state and niche
- [ ] Claude: lead dashboard (leads.html, outside Git) with state filter, "Needs Kriv" and Kriv's setup tasks; linked from status.html
- [ ] Claude: 3 best leads end to end as drafts (preview, QA, screenshots, email draft) for Kriv's approval

## Done

- [x] Krivative/Kriv#20 (release note) merged by Kriv as 1355a1a and deployed (dpl_7maxfVQwFuC1DqhobSz4HnZpAkpx); kriv.agency re-checked: 20/20 live checks, main-site pages unchanged, /test-lead clean in the browser (Claude, 2026-10-25)
- [x] Image source: Unsplash (Kriv's key in .env.local, never committed; Pexels on hold). Picker `scripts/pick-photos.mjs` (hotlinks, download tracking, flags people, signs and business-owned accounts); footer credit "Stock photos for illustration, not of <Business>: <photographer> on Unsplash"; schema requires one credit per photo (Kriv decided, Claude built, 2026-10-25)
- [x] Lead rules updated (Kriv, 2026-10-25): next runs in Texas, Florida and Utah towns; a mailbox named after the business counts as a business email, never a person's address; weak-website rule unchanged; bot-walled and geo-blocked sites listed as "not checked", not re-checked
- [x] docs/LEAD-QA.md written: guardrails, facts against sources, photos, layout screenshots, email draft, approval (Claude, 2026-10-25)
- [x] Site checker: parked and expired domains (HugeDomains, "Website Expired") now count as placeholder pages (Claude, 2026-10-25)

- [x] kriv-previews: branch claude/amazing-edison-juyem3 merged into main (fast-forward to 2c34918; docs, site checker and tests only, no app code) and deployed to production (dpl_Hknvh92tvv2VZppyz2Kg2zwuuX89); 8/8 smoke checks against kriv-previews.vercel.app/for and kriv.agency live checks still pass (Kriv approved, Claude, 2026-10-25)

- [x] Phase 3 live: Kriv approved; Krivative/Kriv#19 merged (be83831) and deployed to production (dpl_G3nuQV6UvDkScFkQPc1ZWU8tqWYG). Live checks 20/20: main-site pages unchanged from a pre-merge baseline, kriv.agency/test-lead and /Test-Lead show the preview with banner and noindex, /nope 404 "Nothing here", robots.txt disallows /for/; browser check clean. Release note: Krivative/Kriv#20 (Claude, 2026-10-25)

- [x] Lead finder first run, San Antonio: 242 business sites graded from web search, Hotfrog, TACCA and medspanear.me; 21 weak (mostly dead domains), 28 could not be checked from this network, none with a weak site and a business email. Near misses and sources in the list for Kriv, outside Git (Claude, 2026-10-25)

- [x] Images report: herk-edit-kit makes video only (its one still-image route is a paid Kie.ai script), so it can't fill placeholders on its own; proposed Openverse CC0/public-domain stock first, with licence and source recorded per image (Claude, 2026-10-25)
- [x] Site checker fixed: bot walls, geo-blocks and failed checks are "not-checked", never weak; script-rendered sites read after they finish loading (Claude, 2026-10-25)

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

- [x] Merge the docs branch `claude/amazing-edison-juyem3` of kriv-previews into main (approved and done 2026-10-25; later commits on the branch need a new OK to merge)

## Kriv's setup tasks

- [x] DMARC live; Gmail shows SPF, DKIM and DMARC all PASS for hello@kriv.agency (Kriv, 2026-10-25)
- [ ] Upgrade to Vercel Pro before the first real preview is sent

## Setup (Claude builds, Kriv approves)

- [ ] US-ready content: US spelling, phone and address formats

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
