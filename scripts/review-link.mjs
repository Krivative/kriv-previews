// Prints a private review link for a draft preview, valid for N days (1-14, default 7).
// Usage: PREVIEW_REVIEW_SECRET=... node scripts/review-link.mjs <slug> [days]
// The secret must match the one set on the kriv-previews Vercel project. Never commit it.
import { createReviewToken } from "../src/lib/review-token.ts";
const [slug, days] = process.argv.slice(2);
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.toLowerCase())) { console.error("Usage: node scripts/review-link.mjs <slug> [days]"); process.exit(1); }
const token = createReviewToken(slug, { days: days ? Number(days) : 7 });
console.log(`https://kriv.agency/${slug.toLowerCase()}?review=${token}`);
console.log(`Valid through ${token.slice(0, 10)} (UTC). Anyone with this link can view the draft until then.`);
