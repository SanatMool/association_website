import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import DesignationsClient from "./DesignationsClient";

export const dynamic = "force-dynamic";

export default async function DesignationsPage() {
  const ctx = await getAdminContext();
  if (!ctx?.associationId) redirect("/admin/login");
  if (ctx.systemRole !== "admin") redirect("/admin/dashboard");

  const designations = await prisma.designation.findMany({
    where: { associationId: ctx.associationId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      systemRole: true,
      permissions: true,
      isDefault: true,
      order: true,
      createdAt: true,
      _count: { select: { adminUsers: true } },
    },
  });

  return (
    <DesignationsClient
      initialDesignations={designations.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        userCount: d._count.adminUsers,
      }))}
    />
  );
}
