# Main-site rewrite (Phase 3)

Previews are served at `https://kriv.agency/<slug>` (decided by Kriv, 2026-10-24),
for example `https://kriv.agency/clinicare-dental-clinic`. Letter case does not matter.

## Change in Krivative/Kriv `next.config.ts`

```ts
const PREVIEWS = "https://kriv-previews.vercel.app"; // the kriv-previews production URL

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    return {
      // This app's pages and assets live under /for on the preview app.
      beforeFiles: [{ source: "/for/:path*", destination: `${PREVIEWS}/for/:path*` }],
      afterFiles: [],
      // Only for paths the main site has no page or file for, so its own pages always win.
      fallback: [{ source: "/:slug", destination: `${PREVIEWS}/for/:slug` }],
    };
  },
};
```

And in `app/robots.ts`, add `disallow: "/for/"` next to `allow: "/"`.

## What this does

- `/`, `/about`, `/book`, `/insights/...` etc. are untouched: the main site serves them first.
- Any other single-segment path goes to the preview app. A lead slug shows the preview;
  anything else gets the preview app's 404 ("Nothing here", links to kriv.agency).
  That 404 replaces the main site's own 404 page for unknown single-segment paths.
- Lead pages are kept out of search by `X-Robots-Tag: noindex, nofollow` and the robots
  meta tag on every response. They cannot be listed in robots.txt without publishing
  every lead's slug, and robots.txt alone does not stop indexing anyway.
- Lead slugs may not be main-site page names (`RESERVED_SLUGS` in `src/lib/site-schema.ts`).
  Add any new top-level main-site route there.

## Verified locally (2026-10-24)

A stand-in main site with this exact config, in front of `kriv-previews` built locally:
`/` and `/about` served by the main site; `/test-lead` and `/Test-Lead` show the preview
with its styles loaded through `/for/_next/...`; `/test-expired` shows the expired notice;
`/test-draft` and `/nope` return 404; noindex header on every preview response; no browser
errors or failed requests. Must be re-checked on the real Vercel preview of the PR.
