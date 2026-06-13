import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// The platform management subdomain (nibjar team only)
const PLATFORM_DOMAIN = "assoc-platform.nibjar.com";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  // ── Helper: forward hostname to server components via request header ────────
  // NextResponse.next({ request: { headers } }) injects into the forwarded request
  // so headers() in Server Components can read x-hostname
  function withHostname(res: NextResponse = NextResponse.next()): NextResponse {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-hostname", hostname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── 1. Platform domain ────────────────────────────────────────────────────
  // assoc-platform.nibjar.com — nibjar team only
  if (hostname === PLATFORM_DOMAIN) {
    // Block public and admin routes on platform domain
    if (!pathname.startsWith("/platform") && !pathname.startsWith("/api/platform-auth")) {
      return NextResponse.redirect(new URL("/platform/login", request.url));
    }

    // Protect all platform routes except the login page
    if (pathname.startsWith("/platform") && pathname !== "/platform/login") {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: "platform-session-token",
      });
      if (!token) {
        return NextResponse.redirect(new URL("/platform/login", request.url));
      }
    }

    const headers = new Headers(request.headers);
    headers.set("x-hostname", hostname);
    headers.set("x-is-platform", "1");
    return NextResponse.next({ request: { headers } });
  }

  // ── 2. Block /platform/* on non-platform domains ──────────────────────────
  // In development (localhost), allow /platform/* so you can test without subdomains
  if (pathname.startsWith("/platform")) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Dev: apply same auth logic as PLATFORM_DOMAIN
    if (pathname !== "/platform/login") {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: "platform-session-token",
      });
      if (!token) {
        return NextResponse.redirect(new URL("/platform/login", request.url));
      }
    }
    const headers = new Headers(request.headers);
    headers.set("x-hostname", hostname);
    headers.set("x-is-platform", "1");
    return NextResponse.next({ request: { headers } });
  }

  // ── 3. Protect /portal/* routes (member portal) ──────────────────────────
  if (pathname.startsWith("/portal") && pathname !== "/portal/login" && !pathname.startsWith("/api/portal-auth")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: "member-portal-token",
    });
    if (!token) {
      return NextResponse.redirect(new URL("/portal/login", request.url));
    }
    const headers = new Headers(request.headers);
    headers.set("x-hostname", hostname);
    return NextResponse.next({ request: { headers } });
  }

  // ── 4. Protect /admin/* routes (association admin) ────────────────────────
  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    !pathname.startsWith("/api/auth")
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If the session belongs to a different association's domain, clear it and redirect to login
    const tokenDomain = token.associationDomain as string | null;
    if (tokenDomain && tokenDomain !== hostname) {
      const loginUrl = new URL("/admin/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("__Secure-next-auth.session-token");
      response.cookies.delete("next-auth.session-token");
      return response;
    }
  }

  // ── 5. All other routes — inject hostname and pass through ─────────────────
  const headers = new Headers(request.headers);
  headers.set("x-hostname", hostname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Run on all routes except static files, images, uploads, and service worker
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|uploads/|.*\\.(?:png|jpg|jpeg|svg|ico|webp|gif)).*)",
  ],
};
