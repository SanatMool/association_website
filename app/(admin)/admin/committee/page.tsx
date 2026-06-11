import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Users2 } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Users2 size={22} className="text-amber-500" /> Current Committee
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} active member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <CommitteeArchiveButton memberCount={members.length} />
          <Link
            href="/admin/committee/new"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] transition-colors"
          >
            <Plus size={14} /> Add member
          </Link>
        </div>
      </div>

      <CommitteeListClient members={rows} />
    </div>
  );
}
