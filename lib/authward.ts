export const SESSION_COOKIE = "session_token";
export const CSRF_COOKIE = "csrf_token";
export const AUTHWARD_SIGN_IN_PATH = "/auth?mode=signin";

export interface AuthwardSessionUser {
  id: string;
  email: string;
  name: string;
}

export function authwardBaseUrl(): string {
  return (
    process.env.AUTHWARD_URL ??
    process.env.NEXT_PUBLIC_AUTHWARD_URL ??
    "http://localhost:3000"
  );
}

export function authwardSignInUrl(): string {
  return `${authwardBaseUrl()}${AUTHWARD_SIGN_IN_PATH}`;
}

export async function validateSession(
  token: string,
): Promise<AuthwardSessionUser | null> {
  try {
    const res = await fetch(`${authwardBaseUrl()}/api/auth/session`, {
      method: "GET",
      headers: {
        Cookie: `${SESSION_COOKIE}=${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as { user?: AuthwardSessionUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}