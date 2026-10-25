# Lead finder (Phase 4)

How leads are found and qualified. The lead lists themselves are never committed: they hold business emails and live outside Git (`C:\Users\user\kriv-leads\` on Kriv's Windows machine). Check results (`check-site.mjs` output) list every visible email, so they stay outside Git too.

## Rules (Kriv, 2026-10-25, second update)

- Areas: smaller cities and towns, where sites tend to be older. Texas: towns around San Antonio (New Braunfels, Seguin, Boerne, Schertz, Universal City, Converse, Helotes, Live Oak), then Waco, Tyler, Killeen/Temple. Florida: Ocala, Lakeland, Port St. Lucie, Sebring, Panama City. Utah: Ogden, Provo/Orem, Logan, St. George, Cedar City. Adjust when a town yields nothing.
- Business email: a role mailbox (info@, office@, frontdesk@...) or a mailbox named after the business (acmedental@gmail.com for "Acme Dental"): `isBusinessMailbox` in `scripts/site-flags.mjs`. Never a person's address.
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

## Checker caveats

- **Bot walls and geo-blocks are not weak sites.** Many US small-business sites answer a non-US or headless visitor with a Cloudflare challenge (403 "Just a moment..."), an empty 202, or "418 Country Blocked". `flagsFor` now marks these, and timeouts and mid-check redirects, as `not-checked` with `weak: false`. Re-check them from a US network before drawing any conclusion.
- **Script-rendered sites** (React, Wix) fill the page after the load event; the checker waits for the network to settle before reading it.
- **Sideways scroll can flicker** (pop-ups, animations). Re-run a site before quoting `sideways-scroll-on-phone` to its owner.
- Every flag must be something the owner can check for themselves; re-verify a lead's flags on the day its preview is built.
