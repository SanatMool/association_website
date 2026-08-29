import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const ctx = await getAdminContext();
  if (!ctx?.associationId) redirect("/admin/login");
  if (ctx.systemRole !== "admin") redirect("/admin/dashboard");

  const [users, designations] = await Promise.all([
    prisma.adminUser.findMany({
      where: { associationId: ctx.associationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        systemRole: true,
        createdAt: true,
        designation: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.designation.findMany({
      where: { associationId: ctx.associationId },
      select: { id: true, name: true, systemRole: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <UsersClient
      users={users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        designationName: u.designation?.name ?? null,
        designationId: u.designation?.id ?? null,
      }))}
      designations={designations}
      currentAdminId={ctx.adminId}
    />
  );
}
