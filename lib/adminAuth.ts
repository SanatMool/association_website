import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

type SessionUser = Session["user"] & { associationId?: string | null };

/**
 * Returns { session, associationId } for server components and API routes.
 * Returns null if no session exists.
 */
export async function getAdminContext() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const associationId = (session.user as SessionUser)?.associationId ?? null;
  return { session, associationId };
}
