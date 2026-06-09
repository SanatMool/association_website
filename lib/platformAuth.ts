import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Reads and verifies the platform-session-token cookie.
 * Returns the platform user payload, or null if missing/invalid.
 * Used in /platform/* server components.
 */
export async function getPlatformUser(): Promise<PlatformUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("platform-session-token")?.value;
  if (!raw) return null;

  try {
    const payload = await decode({
      token: raw,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    if (!payload?.sub) return null;
    return {
      id: payload.sub,
      name: (payload.name as string) ?? "",
      email: (payload.email as string) ?? "",
    };
  } catch {
    return null;
  }
}
