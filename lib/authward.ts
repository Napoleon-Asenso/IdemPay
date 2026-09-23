export const SESSION_COOKIE = "session_token";
export const CSRF_COOKIE = "csrf_token";
export const AUTHWARD_SIGN_IN_PATH = "/auth?mode=signin";

export interface AuthwardSessionUser {
  id: string;
  email: string;
  name: string;
}

export function authwardConfigured(): boolean {
  if (process.env.NEXT_PUBLIC_SKIP_AUTH === "true") {
    return false;
  }

  return Boolean(
    process.env.AUTHWARD_URL ?? process.env.NEXT_PUBLIC_AUTHWARD_URL,
  );
}

export function authwardBaseUrl(): string {
  const configured = process.env.AUTHWARD_URL ?? process.env.NEXT_PUBLIC_AUTHWARD_URL;

  if (process.env.NEXT_PUBLIC_SKIP_AUTH === "true") {
    return "http://localhost:3000";
  }

  if (!configured) {
    throw new Error("AUTHWARD_URL is not configured for this app instance.");
  }

  return configured;
}

export function authwardSignInUrl(): string {
  if (!authwardConfigured()) {
    return "";
  }
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