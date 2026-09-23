import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "node:crypto";
import {
  authwardBaseUrl,
  authwardConfigured,
  authwardSignInUrl,
  CSRF_COOKIE,
  SESSION_COOKIE,
} from "@/lib/authward";

function safeEqual(a: string, b: string): boolean {
  const hash = (value: string) => createHash("sha256").update(value).digest();
  const bufA = hash(a);
  const bufB = hash(b);
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const csrf = request.cookies.get(CSRF_COOKIE)?.value;
  const headerCsrf = request.headers.get("x-csrf-token");
  const signInUrl = authwardSignInUrl();

  if (!authwardConfigured()) {
    const response = NextResponse.json({ message: "Signed out." }, { status: 200 });
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(CSRF_COOKIE);
    return response;
  }

  if (!csrf || !headerCsrf || !safeEqual(csrf, headerCsrf)) {
    return NextResponse.json(
      { error: "Invalid CSRF token", redirectUrl: signInUrl },
      { status: 403 },
    );
  }

  const cookieHeader = [
    token ? `${SESSION_COOKIE}=${token}` : null,
    csrf ? `${CSRF_COOKIE}=${csrf}` : null,
  ]
    .filter(Boolean)
    .join("; ");

  let response: NextResponse;
  try {
    const upstreamRes = await fetch(`${authwardBaseUrl()}/api/auth/signout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        "x-csrf-token": csrf,
      },
    });

    const body = (await upstreamRes.json().catch(() => null)) as {
      message?: string;
      redirect?: string;
    } | null;

    response = NextResponse.json(
      {
        message: body?.message ?? "Signed out.",
        redirectUrl: signInUrl,
      },
      { status: upstreamRes.status },
    );

    try {
      const setCookies =
        typeof upstreamRes.headers.getSetCookie === "function"
          ? upstreamRes.headers.getSetCookie()
          : upstreamRes.headers.get("set-cookie")
            ? [upstreamRes.headers.get("set-cookie") as string]
            : [];
      for (const cookie of setCookies) {
        response.headers.append("set-cookie", cookie);
      }
    } catch {
      // Cookie forwarding is best-effort; upstream still revoked the session.
    }
  } catch {
    response = NextResponse.json(
      { error: "Sign-out relay failed", redirectUrl: signInUrl },
      { status: 502 },
    );
  }

  return response;
}