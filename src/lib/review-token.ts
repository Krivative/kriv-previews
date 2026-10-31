// Private review links for draft previews: https://kriv.agency/<slug>?review=<token>.
// A token is "<YYYY-MM-DD>.<HMAC>" bound to one slug and an end date at most
// MAX_DAYS ahead. Without PREVIEW_REVIEW_SECRET (32+ characters) nothing verifies,
// so drafts stay a plain 404 exactly as before.
import { createHmac, timingSafeEqual } from "node:crypto";

export const MAX_DAYS = 14;
export const cookieName = (slug: string) => `kriv_review_${slug}`;

function secretFrom(secret?: string): string | null {
  const s = secret ?? process.env.PREVIEW_REVIEW_SECRET ?? "";
  return s.length >= 32 ? s : null;
}
const sign = (slug: string, expires: string, secret: string) =>
  createHmac("sha256", secret).update(`kriv-review:${slug}:${expires}`).digest("base64url");
const addDays = (day: string, days: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Creates a token valid through `today + days` (UTC), capped at MAX_DAYS. */
export function createReviewToken(slug: string, opts: { days?: number; today?: string; secret?: string } = {}): string {
  const secret = secretFrom(opts.secret);
  if (!secret) throw new Error("Set PREVIEW_REVIEW_SECRET (32+ characters) to create review links.");
  const days = Math.min(Math.max(Math.trunc(opts.days ?? 7), 1), MAX_DAYS);
  const expires = addDays(opts.today ?? new Date().toISOString().slice(0, 10), days);
  return `${expires}.${sign(slug.toLowerCase(), expires, secret)}`;
}

/** True when `token` was signed for `slug`, has not passed its end date and is within the cap. */
export function verifyReviewToken(slug: string, token: string | undefined | null, opts: { today?: string; secret?: string } = {}): boolean {
  const secret = secretFrom(opts.secret);
  if (!secret || !token || token.length > 120) return false;
  const m = /^(\d{4}-\d{2}-\d{2})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!m) return false;
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  if (m[1] < today || m[1] > addDays(today, MAX_DAYS)) return false;
  const want = Buffer.from(sign(slug.toLowerCase(), m[1], secret));
  const got = Buffer.from(m[2]);
  return want.length === got.length && timingSafeEqual(want, got);
}
