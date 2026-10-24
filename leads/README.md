# leads/

One JSON file per lead, named `<slug>.json`, validated by `src/lib/site-schema.ts`
(`pnpm test` checks every file here).

- Business-level public facts only: name, category, public phone and address, services.
  No personal data about people. Move to the database adapter before scaling.
- `sources`: the public pages the facts came from. Required.
- `expiresAt`: last day served (UTC). Default `createdAt` + 30 days.
- `status`: keep new leads at `draft` until Kriv approves the page.

Slugs: lowercase, hyphens, ideally the business name (`clinicare-dental-clinic`). Not a kriv.agency page name.

Fixtures used by the tests and the smoke check (all fictional):
`test-lead` (live, does not expire), `test-expired`, `test-draft`.
