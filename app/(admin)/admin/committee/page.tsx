import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminContext } from "@/lib/adminAuth";
import CommitteeArchiveButton from "./CommitteeClient";
import CommitteeListClient from "./CommitteeListClient";

export const dynamic = "force-dynamic";

export default async function CommitteePage() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const members = await prisma.committeeMember.findMany({
    where: { associationId, active: true },
    orderBy: { order: "asc" },
    select: {
      id: true, name: true, nameNe: true, role: true, roleKey: true,
      venue: true, highlighted: true, order: true,
    },
  });

  const rows = members.map((m) => ({
    id:          m.id,
    name:        m.name,
    nameNe:      m.nameNe,
    role:        m.role,
    roleKey:     m.roleKey,
    venue:       m.venue,
    highlighted: m.highlighted,
    order:       m.order,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Current Committee</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} active member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <CommitteeArchiveButton memberCount={members.length} />
          <Link
            href="/admin/committee/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] transition-colors"
          >
            <Plus size={14} />
            Add member
          </Link>
        </div>
      </div>

      <CommitteeListClient members={rows} />
    </div>
  );
}
