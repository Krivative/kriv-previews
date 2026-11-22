# Pricing review · 22 November 2026

The editable catalog is `src/offers/pricing.ts`. It includes the frozen pricing consumed by quotes issued before this change. The calculation helpers are in `src/offers/pricing-math.ts`. The two public pages use the same section and calculator components. The main site rewrites /pricing to /for/pricing on this app, using the same /for assets proxy already used for lead pages. Applications or video tools can import the typed catalog at a pinned revision.

## Protected leads

Existing offer records stay on their original presentation and pricing. These 12 candidates are the union of the two confirmed in the brief and the ten non-fixture records marked sent in the repository. The repository does not establish which 11 went out in the brief's batch. No private Lead Desk records or inboxes were inspected.

| Evidence | Slugs |
| --- | --- |
| Existing PH quotations confirmed in brief | pco-dental-clinic, dv-shop-cebu |
| Marked sent with no offer in repo | ac-best-price, accurate-air-lakeland, air-source-1, aj-monier, atkinson-chiropractic, bayside-lakes-chiropractic, fidelity-air, kyles-air-conditioning, poinciana-air, springer-bros |

Do not replace any sent terms. Public concept records cannot confirm prices supplied outside the repository. New quotations require an explicit catalog version. Records already marked sent or replied are blocked from automatic offer addition.

## Review details

- The published monthly price is the annual baseline divided by 12. The approved 25% annual reduction and free months produce the stated all-in monthly example. Worth prices describe value and do not enter the discount calculation.
- A switch is suggested only for a package that covers every selection and saves on setup or monthly fees without increasing either. Fees paid separately to agents, usage, ad budgets and conditional services are described separately from the catalog estimate.
- US packages use the shared website, inbox and content scope, with CRM and caller on Full Business. A USD package does not inherit PH-only add-ons or policies.
- PH caller overage and the wallet cost-plus rule are both shown as approved. Verify the accounting relationship between the overage rate and actual wallet cost before configuring billing.
- The trial window control is an estimate. It does not establish a client's trial start or initiate payment.
- The release is paired: verify the previews app's pricing route first, then activate the main site's rewrite and navigation. For a local paired preview set KRIV_PREVIEWS_ORIGIN on the main site to the running previews app before building or starting dev.

## Additions, 22 November (second pass)

- New items in both markets: Discord setup and community management, email management (owner's inbox, separate from the CRM), LinkedIn makeover, content, hand engagement and company page management. PH also has the LinkedIn Presence bundle; the US had no bundle price in the brief, so none is shown.
- LinkedIn Presence (PHP 8,000 a month, setup included) costs more per month than its parts bought separately (6,500 a month plus 5,000 once), so it is cheaper only for the first three months. The menu's switch nudge never suggests it, because it would raise the monthly total. Kriv may want to revisit this.
- US free website: the Website item has no setup fee (worth USD 5,000). Approved by Kriv on 22 Nov: the same USD 5,000 comes off each package's setup (Presence 5,000 to 0, Growth 5,000 to 0, Full Business 15,000 to 10,000).
- One-time items (Discord setup, LinkedIn makeover) are shown as "one time" and sit outside the PH annual discount.

### Proposed buyout fee (NOT PUBLISHED, needs Kriv's approval)

A client who cancels and wants to keep the free website pays a one-time buyout, stepping down with time subscribed: USD 3,500 within the first 6 months, USD 2,000 in months 7 to 12, USD 1,000 after 12 months (70%, 40% and 20% of the USD 5,000 build value). The figures live in `pricingRules.us.freeWebsite.proposedBuyout` with `approved: false`; the page only says "ask us about the buyout", and the smoke check fails if USD 3,500 appears on /pricing.

## Handover (22 November, evening)

Kirsten is continuing on another laptop and accounts. Everything for pricing is on branch `claude/project-thread-rucatg` (draft PR 3), stacked on Codex's `pricing-catalog` (draft PR 2). The Kriv side rewrite is Codex's `pricing-usd` (Krivative/Kriv draft PR 32). Nothing is in production.

Done:
- Discord, email management and LinkedIn services in both markets, with the PH LinkedIn Presence bundle. All of them are in `src/offers/pricing.ts`.
- US free website: no setup fee, and USD 5,000 off each US package setup (approved by Kriv), with the "Your website, free." headline, Shopify note and LinkedIn guardrail.
- The services menu opens as a sheet with folding groups and a running total. A package takes add-ons on top (`quoteTotal`). The plan details fold away.
- All decisions are logged in docs/DECISIONS.md, and `pnpm preflight` passes.

Open:
1. Buyout fee: the proposal above (USD 3,500 / 2,000 / 1,000) needs Kriv's yes or a new figure. When approved, set `approved: true`, render it in the US plan details and change the smoke check that forbids "$3,500" on /pricing.
2. LinkedIn Presence price: PHP 8,000 a month is more per month than its parts (6,500 a month + 5,000 once). Kriv may want to revisit it.
3. Styling: restyling the pricing pages waits for Kriv's pick of the kriv.agency redesign look (Krivative/Kriv branch `claude/project-thread-wcrc91`, draft PR 33). The current candidates are seed 109 (signal lime with the brand spectrum) and seed 110 (its dark Care-blue sibling). The tokens are in that branch's `lib/design-seed.ts` (COLORWAYS, TYPE_PAIRS, CURATED). The pricing variant is `designFor(seed, "pricing")`, which is about 30% different from home: it re-rolls 3 of 9 traits and keeps the type, logo and light or dark base. The spectrum and section treatments are in `components/seeded/backdrop.jsx` and `seeded.css`, and the full notes are in `docs/HANDOFF-SEEDED-REDESIGN.md` on that branch. Apply them to `src/sections/pricing.module.css` only. Prices and behaviour stay as they are.
4. Before publishing, follow the paired release order above and reconcile the sent-lead roster.

## Local review evidence

- Previews: the five preflight checks passed. The clean-branch run is the release readiness record.
- Main site: typecheck and all 101 unit tests passed. Production-style local build and rewrite checks used fallback font fixtures because the managed environment blocks Google Fonts. The fixtures were not committed.
- Chromium: 320, 390 and 1440 px, no horizontal overflow, full-width section surfaces, sticky mobile CTAs. All four all-in estimates matched the approved figures. Reduced motion showed the same totals. The USD menu switched to Full Business and the main pricing page exposed no PH pricing link.
- Both repositories are local review branches. Production has not received the pricing changes.
