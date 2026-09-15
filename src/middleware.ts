import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "ac_session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/cases",
  "/settings",
  "/upgrade",
  "/api/cases",
  "/api/settings",
  "/api/seed",
  "/api/users",
  "/api/stripe",
];

/** Stripe webhooks authenticate via signature — no session cookie. */
const AUTH_EXEMPT = new Set(["/api/stripe/webhook"]);

const WEAK = new Set(["", "dev-secret-change-me", "appealclinic-dev-secret"]);

function secretKey(): Uint8Array {
  const raw = process.env.AUTH_SECRET?.trim() ?? "";
  const productionLike =
    process.env.APP_MODE === "phi" ||
    process.env.NODE_ENV === "production";
  if (productionLike && (!raw || WEAK.has(raw))) {
    // Fail closed for page/API auth in production / PHI misconfig
    return new TextEncoder().encode("__invalid_production_secret__");
  }
  return new TextEncoder().encode(raw || "appealclinic-dev-secret");
}

function isProtected(pathname: string): boolean {
  if (AUTH_EXEMPT.has(pathname)) return false;
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  let ok = false;
  if (token) {
    try {
      await jwtVerify(token, secretKey());
      ok = true;
    } catch {
      ok = false;
    }
  }

  if (!ok) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cases/:path*",
    "/settings/:path*",
    "/upgrade/:path*",
    "/api/cases/:path*",
    "/api/settings/:path*",
    "/api/seed/:path*",
    "/api/users/:path*",
    "/api/stripe/:path*",
  ],
};
