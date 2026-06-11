import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const users = await prisma.adminUser.findMany({
    where: { associationId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <UsersClient
      users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
    />
  );
}
