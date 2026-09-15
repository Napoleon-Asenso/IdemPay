iimport { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "session_token";

function authwardBaseUrl(): string {
  return (
    process.env.AUTHWARD_URL ??
    process.env.NEXT_PUBLIC_AUTHWARD_URL ??
    "http://localhost:3000"
  );
}

function authwardSignInUrl(): string {
  return `${authwardBaseUrl()}/auth?mode=signin`;
}

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

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);

  if (!hasSessionCookie) {
    const signInUrl = new URL("/auth?mode=signin", authwardBaseUrl());
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-touch-icon.png|opengraph-image.png|twitter-image.png|sitemap.xml|robots.txt).*)"],
};