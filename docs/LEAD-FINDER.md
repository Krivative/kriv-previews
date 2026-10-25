# Lead finder (Phase 4)

How leads are found and qualified. The lead lists themselves are never committed: they hold business emails and live outside Git (`C:\Users\user\kriv-leads\` on Kriv's Windows machine). Check results (`check-site.mjs` output) list every visible email, so they stay outside Git too.

## Rules (Kriv, 2026-10-25, second update)

- Areas: smaller cities and towns, where sites tend to be older. Texas: towns around San Antonio (New Braunfels, Seguin, Boerne, Schertz, Universal City, Converse, Helotes, Live Oak), then Waco, Tyler, Killeen/Temple. Florida: Ocala, Lakeland, Port St. Lucie, Sebring, Panama City. Utah: Ogden, Provo/Orem, Logan, St. George, Cedar City. Adjust when a town yields nothing.
- Business email: a role mailbox (info@, office@, frontdesk@...) or a mailbox named after the business (acmedental@gmail.com for "Acme Dental"): `isBusinessMailbox` in `scripts/site-flags.mjs`. Never a person's address.
- Any address on the business's own website domain also counts, including a first name (jane@smithdental.example), since small and family businesses often use one (Kriv, 2026-10-25). A person's address on Gmail, Yahoo and similar still does not, and addresses are never guessed.
- A free-mail address (Gmail, AOL, BellSouth and similar) also counts when the business publishes it on its site or listing, unless it is plainly a person's first.last name (Kriv, 2026-10-25).
- The weak-website rule stays exactly as it is.
- Bot-walled or geo-blocked sites are not re-checked; list them separately as "not checked".
- Run `check-site.mjs` in foreground batches of about 20 URLs and save each batch.
- Record per lead: state, town, niche, name, address, public phone, website, the site's flags in plain English, the business email and where it was found, and the source URL for every fact.
- Target: at least 10 qualified leads across the three states, then stop and report per state and niche.

## Rules (Kriv, 2026-10-25, first run)

- Niches: dental clinics, HVAC companies, chiropractors, med spas. San Antonio metro (first run).
- Sources: web search, public directory listings and the business's own website. No Google Places API, no paid lead lists. A few pages per niche, with pauses between requests. Never get around a block or captcha.
- Skip chains, franchises, multi-city groups and specialists (orthodontists, pediatric dentists, oral surgeons, periodontists, endodontists).
- Deduplicate by website domain and by phone number.
- Grade each business's own site with `scripts/check-site.mjs` (iPhone 13 profile). Keep a business only if it has no website or a weak one (`weak: true`), and shows a business mailbox (info@, office@, frontdesk@ and similar; see `isRoleEmail` in `scripts/site-flags.mjs`) on its own site or listing. A person's private address doesn't count.
- Record per lead: name, niche, address, public phone, website, the site's flags, the business email, and the source URL for every fact. Facts only from sources.
- Don't contact anyone. No lead page or email draft until Kriv approves the list.

## Sources tried (2026-10-25, from Kriv's network in the Philippines)

| Source | Result |
|---|---|
| Superpages, Yellowpages, Yelp, BBB, Manta, Chamber of Commerce, DexKnows, Cylex, Brownbook | 403 (Cloudflare or similar) for curl, headless Chromium and the web fetch tool. Not used. |
| Web search (directories excluded) | Main source. Returns mostly well-ranked, modern sites. |
| Hotfrog (`hotfrog.com/search/san-antonio-tx/<category>`) | Works with curl (403 for Node's fetch). Few listings: 42 across the niches. Listings show name, address, phone, website, sometimes an email. |
| TACCA Greater San Antonio "Find an Expert" | Works; links to member HVAC contractors' sites. |
| medspanear.me | Works; links to about 110 local med spa sites. |
| wellness.com, chirodirectory.com, dentalclinicdirectory.com, txhealthdirectory.com | Work, but profiles rarely link to the business's site. |

## Texas, Florida and Utah run (2026-10-25)

| | Texas | Florida | Utah | Total |
|---|---|---|---|---|
| Qualified (weak or no site + deliverable business email) | 0 | 3 (all HVAC) | 0 | 3 |
| Near misses (weak or no site, no deliverable business email) | 49 | 28 | 16 | 93 |
| Not checked (bot wall or geo-block from this network) | 41 | 14 | 4 | 59 |

Sources that worked: Hotfrog town pages (49 towns; listings skew to older businesses and often show an email), ChamberMaster directories (Metro SA, Boerne, Logan, Tyler, St. George, Ogden-Weber, Utah Valley), TACCA, medspanear.me, web search. Web search found almost only modern sites (0 weak among 150 town results). Extra checks added in the qualify step: the email's domain must have MX records (dead domains bounce), and a business whose email domain is another working, modern site is not a lead. Weak sites are usually dead domains, and the email on a dead domain is dead too, which is why the near-miss count is high.

## Round 2 (2026-10-25, Kriv approved all three suggestions)

- Hotfrog in 32 more towns (16 FL, 10 TX, 6 UT): 66 listings, 42 new websites graded. 1 new qualified lead: Fidelity Air & Refrigeration (HVAC, Spring Hill FL area; no website, business-name mailbox). Its address differs between Hotfrog and BuildZoom; confirm before building a page. Ma Mi Skin Care (Orlando) passed the script but sells skincare products, so it is not a med spa.
- Totals after this step: 4 qualified (all Florida HVAC), 127 near misses, 63 not checked.
- Own-domain mailbox rule (Kriv, 2026-10-25) re-applied to everything collected: 1 more lead, A.J. Monier Service Co. (San Antonio TX, HVAC; staff address on the company domain). Totals: 5 qualified (FL 4, TX 1, all HVAC), 126 near misses (118 with no email found anywhere), 63 not checked.
- Free-mail rule (Kriv, 2026-10-25) re-applied: 13 passed the script; 3 dropped on review (one has a modern site elsewhere, one sells skincare products, one is a lash specialist). **10 qualified: Florida 7 (HVAC 6, chiro 1), Texas 3 (HVAC 2, chiro 1), Utah 0.** Target reached. 121 near misses, 63 not checked. Four need a fact confirmed before a page (address or name differs between sources).
- Cloud run on a US network (Google Cloud, South Carolina): of the 59 blocked sites, 25 load and all are modern, 33 are still bot-walled (Cloudflare blocks datacenter IPs too). Air Source 1's site does not load from the US either (connection timeout). Yellowpages, Superpages and BBB search pages load from there; Yelp, Manta, Hotfrog and BBB profile pages do not.

## Social profiles (Kriv, 2026-10-25: search engines only)

- Facebook answers 400 to any page request without a login, so pages are not read. Google Maps shows no emails; Instagram, LinkedIn, X and TikTok sit behind logins; YouTube hides emails behind a captcha; Reddit has no business contact details.
- Search-engine pass on 16 of the 96 in-niche near misses without an email: 0 emails found. Many of these listings are old or the business has closed or renamed. One had an unknown website (burnscomfort.com), which grades as modern. Stopped there: the rest would cost about 80 more searches for an expected yield near zero.

## Scripts

All output holds business emails, so the data folder lives outside Git (`/finder-data/` is ignored as a safety net).

1. `node scripts/finder/hotfrog.mjs <data>/hotfrog-<run>.json waco-tx,ocala-fl,...` collects Hotfrog listings for the four niches.
2. `node scripts/finder/chamber.mjs <data>/chamber-<run>.json <ChamberMaster /list/ URL...>` collects chamber members.
3. Web-search finds go in `<data>/r<n>-search.txt`, one `state|town|niche|url` per line.
4. `scripts/finder/grade.sh <data> <list> <prefix>` grades websites in foreground batches of 20 into `<data>/batches/`.
5. `node scripts/finder/qualify.mjs <data> <outDir>` applies the rules (business mailbox, MX records, chains and specialists, a modern site on the email's domain) and writes `qualified.json`, `near-misses.json` and `not-checked.json`.

## Checker caveats

- **Bot walls and geo-blocks are not weak sites.** Many US small-business sites answer a non-US or headless visitor with a Cloudflare challenge (403 "Just a moment..."), an empty 202, or "418 Country Blocked". `flagsFor` now marks these, and timeouts and mid-check redirects, as `not-checked` with `weak: false`. Re-check them from a US network before drawing any conclusion.
- **Script-rendered sites** (React, Wix) fill the page after the load event; the checker waits for the network to settle before reading it.
- **Sideways scroll can flicker** (pop-ups, animations). Re-run a site before quoting `sideways-scroll-on-phone` to its owner.
- Every flag must be something the owner can check for themselves; re-verify a lead's flags on the day its preview is built.
