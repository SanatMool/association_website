import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminContext } from "@/lib/adminAuth";
import MembersClient, { type MemberRow } from "./MembersClient";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const links = await prisma.memberAssociation.findMany({
    where: { associationId: associationId ?? undefined },
    include: { member: true },
    orderBy: [
      { member: { featured: "desc" } },
      { member: { name: "asc" } },
    ],
  });

  const rows: MemberRow[] = links.map(({ member: m, visible }) => ({
    id:       m.id,
    memberId: m.id,
    name:     m.name,
    area:     m.area,
    capacity: m.capacity,
    category: m.category,
    type:     m.type,
    phone:    m.phone,
    email:    m.email,
    featured: m.featured,
    visible,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage venue members for this association.</p>
        </div>
        <Link
          href="/admin/members/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] transition-colors"
        >
          <Plus size={14} />
          Add member
        </Link>
      </div>

      <MembersClient rows={rows} totalCount={rows.length} />
    </div>
  );
}
