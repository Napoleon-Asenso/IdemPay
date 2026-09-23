import { NextResponse, type NextRequest } from "next/server";
import {
  authwardConfigured,
  authwardSignInUrl,
  SESSION_COOKIE,
} from "@/lib/authward";

function isExempt(pathname: string): boolean {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/apple-touch-icon.png" ||
    pathname === "/opengraph-image.png" ||
    pathname === "/twitter-image.png" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isExempt(pathname)) {
    return NextResponse.next();
  }

  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PUBLIC_SKIP_AUTH === "true"
  ) {
    return NextResponse.next();
  }

  if (!authwardConfigured()) {
    return NextResponse.json(
      { error: "Authward is not configured. Set AUTHWARD_URL or NEXT_PUBLIC_AUTHWARD_URL." },
      { status: 500 },
    );
  }

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);

  if (!hasSessionCookie) {
    const signInUrl = new URL(authwardSignInUrl());
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-touch-icon.png|opengraph-image.png|twitter-image.png|sitemap.xml|robots.txt).*)"],
};