# Private review links for draft previews

Added 2026-11-01 (roadmap: "Private review link so Kriv can see draft previews before they go live").

- A draft record (`status: "draft"`) is a plain 404 for everyone. A signed link opens it for a limited time:
  `https://kriv.agency/<slug>?review=<token>`.
- Create a link: `PREVIEW_REVIEW_SECRET=... node scripts/review-link.mjs <slug> [days]` (1-14 days, default 7).
  The secret must match the `PREVIEW_REVIEW_SECRET` environment variable on the kriv-previews Vercel project
  (32+ characters). Without it set on the server, no link works and drafts stay 404.
- The token is `<end date>.<HMAC-SHA256 of slug and end date>`. It works for one slug only, stops after its
  end date (UTC) and can never run more than 14 days ahead. `src/proxy.ts` turns a valid `?review=` into an
  HttpOnly cookie so the draft's About, Services and Contact pages open as well.
- Everything else is unchanged: noindex header and meta, the concept banner, inert business links, expiry
  and real 404s. Anyone holding a valid link can view the draft until it expires; to revoke all links at
  once, change the secret on Vercel.
- Code: `src/lib/review-token.ts`, `src/lib/review-access.ts`, `src/proxy.ts`, both `[slug]` pages.
  Tests: `tests/review-token.test.ts`; `scripts/smoke.mjs` checks valid, tampered, wrong-slug, expired and
  cookie cases over real HTTP.
