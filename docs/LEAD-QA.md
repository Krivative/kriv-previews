# Lead page QA

The advanced manual workflow uses the checklist below. A failed check is fixed, never waived. Record the result per lead (date, who, pass/fail per item) where Kriv reviews it; the lead JSON itself carries no QA log.

## Review inbox path (Kriv approved, 2026-10-26)

For initial offers, the Review inbox uses a separate preparation report instead of asking Kriv to complete 23 manual ticks. No manual ticks are fabricated. Existing niche templates, neutral invitation wording and source-matched business details replace bespoke AI-written copy. Unsupported optional details are omitted. Business identity and the contact mailbox must be present on current readable sources. The template defaults provide colour; existing credited photos or the configured Unsplash picker provide images. Metadata filters do not replace Kriv's visual judgment.

The automated path validates the record and checks the served page's noindex, banner, inert links, expiry, credits, email exclusion and SEO, plus desktop/phone screenshots with no console errors, overflow or broken visible images. The full five project checks run again during publishing. Failed or stale preparation blocks approval; changing the page, email, source copies or screenshots invalidates the report. A still-unchanged approved snapshot can be published on a later day before expiry.

Kriv looks at both finished screenshots and reads the email, then approves, declines or chooses a preset revision. That approval is the final appearance, image suitability and wording review. Neutral emails need not criticise the existing site. Draft revisions are backed up privately before replacement. Publishing requires a separate explicit confirmation; sending and monitoring replies remain manual in Gmail. The manual checklist remains available under More tools for custom work.

How to look at a draft: drafts are only served by `next dev` (production returns 404 for them). Run `pnpm dev -p 3100`, open `http://localhost:3100/for/<slug>`, and take screenshots with `NODE_PATH=$(npm root -g) node scripts/shoot.mjs <slug>` (desktop 1440 px and phone 390 px into `shots/`).

## 1. Guardrails (automatic, must all pass)

- [ ] `pnpm test` passes: the record validates against `src/lib/site-schema.ts`, every template renders it with the banner and no live links.
- [ ] Banner at the top reads exactly "Concept preview prepared by KRIV for <Business Name>. Not affiliated with or endorsed by <Business Name>." (`conceptNotice`), and the same notice is in the footer.
- [ ] `X-Robots-Tag: noindex, nofollow` header and `<meta name="robots" content="noindex, nofollow">` on the page.
- [ ] Links: every `href` is an in-page `#anchor`, except the Unsplash credit links in the footer (photographer profile and unsplash.com, each with `utm_source=kriv_previews&utm_medium=referral`). No `tel:`, `mailto:`, map, social or booking links; no forms.
- [ ] `status` is `draft`; `expiresAt` is `createdAt` + 30 days.
- [ ] No email address in the lead JSON (the email lives only in the outreach draft outside Git).

## 2. Facts (by hand, against `sources`)

- [ ] Every fact on the page appears on one of the pages in `sources`, today: name, category, address, phone, hours, services, any "about" sentence. Check each one against the source; a fact found only in a search snippet or an AI summary does not count.
- [ ] Nothing invented or implied: no reviews, ratings, testimonials, prices, offers, insurance lists, credentials, awards, staff names, years in business, "since", "#1", "best", results or guarantees, unless the business states it on its own page, and even then prefer leaving it out.
- [ ] Copy describes services generically ("Cleanings and check-ups") instead of promising outcomes. Hero and close lines are neutral invitations, not claims.
- [ ] Unknown means absent: if a field has no source, it is left out (the template hides the section). No placeholders like "[Street address]" on a real lead.
- [ ] Business name and phone exactly as the business writes them on its own site or listing.

## 3. Photos

- [ ] Own photos and logo first (Kriv, 2026-10-25): when the business's own website or listing shows photos that clearly are of that business (team, vans, premises, finished work), use them with `scripts/pick-site-photos.mjs` (hotlinked, credited "Photos and logo from <Business>'s own website", page in `sources`), and its logo in the header. Never its licensed stock photos, never another business's images. Otherwise Unsplash as below.

- [ ] Each photo is a generic scene of the niche or a service (empty treatment room, tools, an outdoor AC unit, a skincare tray), from Unsplash through `scripts/pick-photos.mjs`, hotlinked from `images.unsplash.com`.
- [ ] Stock photos only: nothing that could pass for the lead's own office, building, staff, patients, vehicles, logo or results: no readable signs, logos, branded vans or uniforms, no before/after, no recognisable local landmark presented as theirs. Prefer no identifiable faces.
- [ ] Footer credit present: "Stock photos for illustration, not of <Business Name>: <photographer(s)> on Unsplash."
- [ ] Each photo's Unsplash page (or, for own photos, the business page it came from) is in `sources`; `brand.photoCredits` matches `brand.photos` one to one.
- [ ] Brand colour (`design.accent`) taken from the business's own site or logo, or the template default. Not invented.

## 4. Layout (screenshots)

- [ ] Desktop 1440 px and phone 390 px screenshots taken with `scripts/shoot.mjs` (it captures with reduced motion so scroll-reveal sections show); the script exits 0 (no console errors, no sideways scroll).
- [ ] Looked at both screenshots: no overlapping or clipped text, no empty or broken image boxes, no section that reads oddly with missing data, banner visible on load.
- [ ] Page title and description (`seo`) name the business and say "Concept preview".

## 5. Outreach draft (outside Git)

- [ ] One personal email per lead, saved as a text file outside Git, never sent and not yet a Gmail draft.
- [ ] Honest subject; neutral concept invitation, or any observations about the existing site stated as checkable facts re-checked the same day; the preview link `https://kriv.agency/<slug>`; the footer from `emailFooter()` in `src/outreach/footer.ts`. Do not invent criticism to personalise an email.
- [ ] No claims about their business beyond the sources, no pressure, no fake familiarity.

## 6. Approval

- [ ] Kriv approves the page and the email (or asks for changes). Only then: `status: "approved"`, merge to main (redeploys production), re-check the live page, and Kriv sends the email by hand.
