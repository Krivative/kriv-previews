import { cookies } from "next/headers";
import { cookieName, verifyReviewToken } from "./review-token";

/** Whether this request carries a valid private review token for `slug` (query or cookie). */
export async function reviewAllowed(slug: string, query?: string | string[]): Promise<boolean> {
  const s = slug.toLowerCase();
  const fromQuery = typeof query === "string" ? query : undefined;
  if (verifyReviewToken(s, fromQuery)) return true;
  return verifyReviewToken(s, (await cookies()).get(cookieName(s))?.value);
}
