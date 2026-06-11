import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminContext } from "@/lib/adminAuth";
import MembersClient, { type MemberRow } from "./MembersClient";

export const dynamic = "force-dynamic";

function checkIncomplete(m: {
  phone: string | null; email: string | null; ownerName: string | null;
  description: string | null; image: string | null; category: string | null;
  capacity: number | null; location: string | null;
}): string[] {
  return [
    (!m.phone     || !m.phone.trim())       && "Phone",
    (!m.email     || !m.email.trim())       && "Email",
    (!m.ownerName || !m.ownerName.trim())   && "Owner name",
    (!m.description || !m.description.trim()) && "Description",
    !m.image                                && "Photo",
    (!m.category  || !m.category.trim())    && "Category",
    !m.capacity                             && "Capacity",
    (!m.location  || !m.location.trim())    && "Address",
  ].filter(Boolean) as string[];
}

export default async function MembersPage() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const [links, pendingGroups] = await Promise.all([
    prisma.memberAssociation.findMany({
      where: { associationId: associationId ?? undefined },
      include: {
        member: {
          select: {
            id: true, name: true, area: true, capacity: true, category: true,
            type: true, phone: true, email: true, featured: true,
            description: true, image: true, ownerName: true, location: true,
          },
        },
      },
      orderBy: [
        { member: { featured: "desc" } },
        { member: { name: "asc" } },
      ],
    }),
    prisma.duesPayment.groupBy({
      by: ["memberId"],
      where: { associationId: associationId ?? undefined, status: "pending" },
      _sum: { amount: true },
    }),
  ]);

  const pendingMap = new Map(
    pendingGroups.map((p) => [p.memberId, Number(p._sum.amount ?? 0)])
  );

  const rows: MemberRow[] = links.map(({ member: m, visible }) => ({
    id:              m.id,
    memberId:        m.id,
    name:            m.name,
    area:            m.area,
    capacity:        m.capacity,
    category:        m.category,
    type:            m.type,
    phone:           m.phone,
    email:           m.email,
    featured:        m.featured,
    visible,
    missingFields:   checkIncomplete(m),
    pendingDues:     pendingMap.get(m.id) ?? 0,
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
