// Runs before every /admin request (Next.js 16 calls this file "proxy"; older versions
// called it "middleware"). It is a convenience, not the lock: it only looks whether a
// session cookie is present, to send visitors without one to the login page early. The
// real check — signature, database row, expiry, password fingerprint — happens in every
// admin page and action through lib/auth/admin.ts.
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

const LOGIN_PATH = "/admin/login";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = request.cookies.has(SESSION_COOKIE);

  if (!hasCookie && pathname !== LOGIN_PATH) {
    // API calls get a status code; pages get a redirect.
    if (pathname.startsWith("/admin/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  const response = NextResponse.next();
  // Belt and braces next to the robots meta tag: nothing under /admin is for indexing.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
