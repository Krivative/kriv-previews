# Lead database adapter (Phase 5, code only)

Added 2026-11-01. Kriv chose "code only, no account": nothing is connected and production still reads only
the committed `leads/<slug>.json` files.

- `src/lib/lead-store.ts`: `upstashLeadStore` reads `lead:<slug>` from Upstash Redis over its REST API
  (no SDK, never cached, 3-second timeout, errors are loud). `layeredLeadStore` tries committed JSON first,
  then the database, so existing pages never change. `defaultLeadStore` uses the database only when
  `LEAD_STORE=upstash` and `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (or the Vercel KV names
  `KV_REST_API_URL`/`KV_REST_API_TOKEN`) are set.
- Records in the database go through the same schema validation, draft, expiry and 404 rules as JSON files.
- `scripts/lead-db.mjs put <slug...> [--dry-run] | list | del <slug>` validates and loads records.
- Tests: `tests/lead-store.test.ts` (fake REST server; no network).

To activate later (needs Kriv's go-ahead: it creates an account and stores credentials): create a free
Upstash Redis database (or add it through the Vercel Marketplace), set the two variables plus
`LEAD_STORE=upstash` on the kriv-previews project, redeploy, then `put` a test record and check it.
The Lead Desk would then publish by writing the record instead of committing a file (not built yet).
