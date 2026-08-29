import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mergePermissions } from "@/lib/permissions";
import type { Session } from "next-auth";

type SessionUser = Session["user"] & {
  id?: string;
  associationId?: string | null;
  systemRole?: string;
};

export interface AdminContext {
  session: Session;
  associationId: string | null;
  adminId: string;
  systemRole: string;      // "admin" | "editor" | "member"
  permissions: string[];   // merged from designation + extraPermissions; ["*"] for admin
}

/**
 * Returns full admin context for server components and API routes.
 * Fetches systemRole + permissions fresh from DB on every call.
 * Returns null if no session or if user is soft-deleted.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const u = session.user as SessionUser;
  const adminId = u.id;
  if (!adminId) return null;

  const associationId = u.associationId ?? null;

  // Fetch fresh role + designation from DB (not cached in JWT — stays accurate after role changes)
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: {
      systemRole: true,
      deletedAt: true,
      extraPermissions: true,
      designation: {
        select: { permissions: true },
      },
    },
  });

  // Reject if not found or soft-deleted
  if (!admin || admin.deletedAt) return null;

  const permissions =
    admin.systemRole === "admin"
      ? ["*"]
      : mergePermissions(
          admin.designation?.permissions ?? [],
          admin.extraPermissions ?? []
        );

  return {
    session,
    associationId,
    adminId,
    systemRole: admin.systemRole,
    permissions,
  };
}
