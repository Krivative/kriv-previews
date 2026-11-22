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

## Local review evidence

- Previews: the five preflight checks passed. The clean-branch run is the release readiness record.
- Main site: typecheck and all 101 unit tests passed. Production-style local build and rewrite checks used fallback font fixtures because the managed environment blocks Google Fonts. The fixtures were not committed.
- Chromium: 320, 390 and 1440 px, no horizontal overflow, full-width section surfaces, sticky mobile CTAs. All four all-in estimates matched the approved figures. Reduced motion showed the same totals. The USD menu switched to Full Business and the main pricing page exposed no PH pricing link.
- Both repositories are local review branches. Production has not received the pricing changes.
