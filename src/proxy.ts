import { NextResponse, type NextRequest } from "next/server";
import { cookieName, verifyReviewToken } from "@/lib/review-token";
import { SLUG_PATTERN } from "@/lib/site-schema";

// Private review links: a valid ?review= token becomes an HttpOnly cookie so the
// draft's internal pages open too. Everything else passes through untouched.
export function proxy(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("review");
  if (!token) return NextResponse.next();
  const slug = (request.nextUrl.pathname.split("/").filter(Boolean)[0] ?? "").toLowerCase();
  if (!SLUG_PATTERN.test(slug) || !verifyReviewToken(slug, token)) return NextResponse.next();
  const response = NextResponse.next();
  response.cookies.set({
    name: cookieName(slug), value: token, httpOnly: true, sameSite: "lax", path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(`${token.slice(0, 10)}T23:59:59Z`),
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/((?!_next/|favicon).*)"] };
