# KRIV Previews roadmap

Updated: 2026-10-25 · Last step finished: 5 plumbing and auto repair leads drafted and approved (Kriv pre-approved qualifying leads); waiting for Kriv's OK to merge

Goal: a daily run that finds qualified leads, builds a concept preview for each and writes a Gmail draft. Kriv reviews every page and sends every email by hand.

## Next up

- [ ] Kriv: OK to merge into main so the 5 plumbing and auto repair pages go live (boggs-plumbing, ronnie-lee-davis-plumbing, scooter-plumbing, genesis-auto-service, advanced-car-care)
- [ ] Claude: A&L Mobile Mechanics (Seguin TX) and Michigan Auto Repair (Kissimmee FL) qualify but their listing details were cut off in the cloud log; fetch them again before drafting
- [ ] Claude: watch hello@kriv.agency for replies and opt-outs to the 10 sent emails (Kriv forwards or labels them)

## Done

- [x] Plumbing and auto repair lead finder (US cloud runs, Yellowpages): 1,021 independent listings in 28 towns; 10 picked, re-verified: 7 qualify (Boggs Plumbing, Ronnie Lee Davis Plumbing, Scooter Plumbing, Genesis Auto Service, Advanced Car Care Center, A&L Mobile Mechanics, Michigan Auto Repair); Marc's Master Mechanics and Red Rock Collision have modern sites; Southern Plumbing not checked (Claude, 2026-10-25)
- [x] 5 plumbing and auto repair pages built (Tap, Pressure, Workshop, Torque), QA per docs/LEAD-QA.md, screenshots clean; set to approved under Kriv's pre-approval; email drafts outside Git (Claude, 2026-10-25)
- [x] Poster hero: headline now scales down on phones so a long uppercase word (e.g. BRAUNFELS) never scrolls sideways (Claude, 2026-10-25)
- [x] Kriv sent all 10 lead emails by hand from hello@kriv.agency (including Air Source 1); lead status set to sent (Kriv, 2026-10-25)
- [x] 7 more approved leads live (Kriv approved the merge): main fast-forwarded to a838212, production dpl_AQaQZL9VwEyWFj8pFeBdk7x3vm5J; all 7 pages return 200 with noindex and the banner, browser check clean on desktop and phone; the first 3 still live; 8/8 smoke checks on production (Claude, 2026-10-25)
- [x] Kriv approved the plumbing templates Tap and Pressure, and the 7 new drafts (poinciana-air, fidelity-air, accurate-air-lakeland, ac-best-price, aj-monier, bayside-lakes-chiropractic, atkinson-chiropractic); open facts: keep the listing's version (Kriv, 2026-10-25)
- [x] Virtus Outreach sheet reviewed: no rows in KRIV's niches; 61 of 163 website domains don't exist; the 5 Fort Worth plumbing and auto repair rows don't qualify (modern sites, or no public email). Nothing from it used or stored in Git (Claude, 2026-10-25)
- [x] Plumbing and auto repair added as niches (Kriv, 2026-10-25): finder categories and chain list updated; plumbing templates Tap and Pressure built (batch 6, for review); auto repair uses Workshop and Torque (Claude)
- [x] Social profiles for near misses (Kriv chose search engines only): 16 searched, 0 emails; Facebook needs a login, other networks hide emails; stopped as expected yield is near zero (Kriv decided, Claude, 2026-10-25)
- [x] 7 more draft previews (status draft, not live): poinciana-air, fidelity-air, accurate-air-lakeland, ac-best-price, aj-monier, bayside-lakes-chiropractic, atkinson-chiropractic; facts from listings and the business's own pages, street address left out where sources disagree; Unsplash photos credited; QA per docs/LEAD-QA.md, desktop and phone screenshots clean; email drafts outside Git, not sent (Claude, 2026-10-25)
- [x] Target of 10 qualified leads reached (Kriv's free-mail rule: a Gmail/AOL/BellSouth address the business publishes counts, unless plainly a person's first.last name): Florida 7 (HVAC 6, chiro 1), Texas 3 (HVAC 2, chiro 1), Utah 0; 3 dropped on review; lists outside Git (Kriv decided, Claude, 2026-10-25)
- [x] Business email rule widened by Kriv: any address on the business's own website domain counts, including a first name (small and family businesses); a person's free-mail address still does not. isBusinessMailbox and tests updated; re-applied: 1 more lead (A.J. Monier Service Co., San Antonio TX HVAC), 5 qualified in total (Kriv decided, Claude, 2026-10-25)
- [x] Lead finder round 2, Hotfrog in 32 more towns: 66 listings, 42 sites graded, 1 new qualified lead (Fidelity Air & Refrigeration, FL HVAC); totals 4 qualified, 127 near misses, 63 not checked (Claude, 2026-10-25)
- [x] 3 approved leads live (Kriv approved the merge): main fast-forwarded to 2f30705, production dpl_9oSYKAvLW4w3BRAQXhYjb7J2jwKH; kriv.agency/springer-bros, /air-source-1, /kyles-air-conditioning return 200 with noindex and the concept banner, browser check clean on desktop and phone; 8/8 smoke checks on production (Claude, 2026-10-25)
- [x] Kriv approved the 3 draft leads (Springer Bros., Air Source 1, Kyle's Air Conditioning): status set to approved; production build serves all 3 (200, noindex, banner); not live until the merge to main (Kriv, 2026-10-25)
- [x] Kriv chose all three ways to reach 10 leads: a cloud run on a US network, business emails from Facebook and Google listings, more Hotfrog towns. Finder scripts moved into scripts/finder (Kriv decided, Claude, 2026-10-25)
- [x] Lead finder, Texas, Florida and Utah (2026-10-25): 573 businesses collected from web search, Hotfrog (49 towns), 7 chamber directories, TACCA and medspanear.me; 488 sites graded; 3 qualified (all Florida HVAC), 93 near misses (weak or no site but no deliverable business email), 59 not checked (bot walls). Below the target of 10. Lists outside Git in C:\Users\user\kriv-leads\ (Claude)
- [x] Lead Desk dashboard (leads.html, outside Git): state filter, Needs Kriv, setup tasks, qualified leads, drafts with screenshots, facts and email drafts, near misses, not checked; linked from status.html (Claude, 2026-10-25)
- [x] 3 draft previews (status draft, not live): springer-bros (Thermal), air-source-1 (Breeze), kyles-air-conditioning (Breeze); facts checked against sources, Unsplash photos credited, QA per docs/LEAD-QA.md, desktop and phone screenshots clean; one email draft each outside Git, not sent and not in Gmail (Claude, 2026-10-25)

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
- [x] Vercel Pro: team Kriv (kriv5) is on Pro, checked with `vercel teams ls` (Kriv, 2026-10-25)

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

- [x] 3 real leads end to end, each page and email approved by Kriv: 10 sent by hand on 2026-10-25 (Kriv)
- [ ] Batches of 10 a day with Kriv's review; track reply rates
- [ ] Daily scheduled run of the finder, builder and drafter
