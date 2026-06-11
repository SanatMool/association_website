import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import CommitteeForm from "@/components/admin/CommitteeForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewCommitteeMemberPage() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const members = await prisma.member.findMany({
    where: { associations: { some: { associationId: associationId ?? undefined } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, nameNe: true, area: true },
  });

  return (
    <div>
      <Link href="/admin/committee" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={14} />
        Back to committee
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Committee Member</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <CommitteeForm members={members} />
      </div>
    </div>
  );
}
