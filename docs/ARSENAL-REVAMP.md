# Arsenal multi-page revamp

2026-10-27. Requested by Kriv for the whole arsenal, across all niches.

## Reference study

These informed structure and presentation; no code, branding, photography or business claims were copied from them.

| Reference | Pattern carried into the arsenal |
|---|---|
| [Birch’s Air](https://www.birchsair.com/) | Scannable services, company introduction and clear contact information |
| [Cook’s Air About](https://www.cooksairofocala.com/about/), [services](https://www.cooksairofocala.com/service/ac-services/), [contact](https://www.cooksairofocala.com/contact/) | Dedicated About, service and Contact destinations; the homepage timed out in direct retrieval, so dedicated pages and indexed content informed the review |
| [AC Pros](https://www.acprosnow.com/) | A clear path from service discovery to practical next-step information |
| [Gulf Coast Air](https://gulfcoastairpc.com/) | Service-specific navigation and prominent location/contact details |
| [Done Right warranty repair](https://www.donerightpoolheating.com/factory-warranty-repair) | A focused detail page with preparation information and related next steps |
| [ACT Cooling](https://www.actcooling.com/) | Separation of offerings, company information and contact details |

Reviews, ratings, credentials, experience, financing, warranty support and service territories from the references are never reused as claims about another business.

## Coverage

All 26 templates share the new page system and retain their own colors, typography, hero variants and distinctive sections.

| Niche | Offering label |
|---|---|
| Dental / chiropractic | Care |
| Aesthetics | Treatments |
| HVAC / plumbing / auto / salon | Services |
| Café / restaurant | Menu |
| Spa / resort | Experiences |
| Gym | Training |
| Professional office | Expertise |

Every record gets Home and Contact. Offering indexes and individual detail pages appear when offerings are supplied. About, Questions and Gallery appear only when their content exists. Optional service `detail` and `includes`, and `about.sections`, accept richer sourced content. Existing records remain valid.

Homepages gain an information strip, linked offering names, visitor planning questions, discovery cards, a contact panel and navigation footer. Nested pages have breadcrumbs, their own headings and related destinations. Native mobile menus, current-page state, focus outlines and a skip link support accessible navigation. Single-photo layouts expand to fill their available frame; new section backgrounds preserve the template's text contrast.

`nicheGuides` contains visitor questions and preparation prompts, not promises about the business. Unknown real-business facts remain omitted. The Lead Desk's preparation logic, private data and real lead records are unchanged.

## Routes and safeguards

Preview routes are `/for/<slug>`, `/for/<slug>/about`, `/for/<slug>/contact`, `/for/<slug>/services/<item>`, etc. Next Link adds `/for` automatically. The existing main-site `/for/:path*` rewrite already forwards them; no `Krivative/Kriv` change is needed. Existing root-level public homepage/outreach links stay valid.

Internal concept navigation works. Calls, email links, maps, booking and other outbound actions stay inert. No forms or submissions are added. The exact concept notice, noindex header/meta, expiry, draft handling and anonymous unknown-page behavior remain. Photo credits keep their existing outbound-link exception.

## Site Arsenal companion

The existing source branch `claude/new-session-3jaiso` was cloned to `shots/site-arsenal-source`. Its earlier 24-template copy is updated to the preview app's 26-template kit, including the existing plumbing designs and cinematic sections. Every fictional sample gets About chapters, offering detail, credited stock imagery and navigation. Unfinished address, biography, custom-section and FAQ placeholders are omitted. Samples remain visibly fictional concepts. The gallery adds direct About/Contact links and page counts.

Source `mode` and `province` remain distinct from preview lifecycle fields and `region`. No dependencies, lockfiles or live records change. The source checkout reuses installed dependencies through an ignored junction. Turbopack cannot follow that junction outside its Git root, so local source verification uses `next build --webpack`; its default build command is unchanged. The preview app uses its normal Turbopack build.

The source gallery retains its existing Cache Components limitation: unknown URLs can stream the anonymous “No site here” view with HTTP 200. Its verifier checks that no business content is exposed. The preview app's smoke suite requires actual 404 responses. Source routing hardening remains a separate task.

## Verification and delivery

The preview suite has 247 tests, including full/minimal rendering across every template and every generated page. The smoke suite has 16 HTTP checks, including nested pages, noindex, disabled actions, drafts, expiry and unknown URLs. The source verifier covers 282 sample pages and four anonymous not-found views. Final screenshot and click-through results are recorded in the handoff/roadmap.

Source changes are saved in their own local commit and exported as a patch alongside this checkpoint, so the ignored checkout is not their only record. No push, merge, deployment, lead approval, publishing or email sending is included.

Local gallery review from the preview workspace: run `npm.cmd --prefix shots/site-arsenal-source start -- -p 3101`, then open `http://localhost:3101`. Stop the server with Ctrl+C when finished. The root preview app can be started with `pnpm.cmd start -- -p 3100` and reviewed at `/for/test-lead`.
