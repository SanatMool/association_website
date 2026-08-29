import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getAdminContext } from "@/lib/adminAuth";
import CommitteeForm from "@/components/admin/CommitteeForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditCommitteeMemberPage({ params }: { params: { id: string } }) {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const [member, members, designations, memberModeSetting] = await Promise.all([
    prisma.committeeMember.findUnique({ where: { id: params.id } }),
    prisma.member.findMany({
      where: { associations: { some: { associationId: associationId ?? undefined } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, nameNe: true, area: true, image: true, phone: true, email: true, description: true },
    }),
    prisma.designation.findMany({
      where: { associationId: associationId ?? undefined },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
    prisma.siteSettings.findUnique({
      where: { key_associationId: { key: "member_mode", associationId: associationId ?? "" } },
    }),
  ]);
  if (!member) notFound();
  const memberMode = memberModeSetting?.value === "person" ? "person" : "venue";

  return (
    <div>
      <Link href="/admin/committee" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={14} />
        Back to committee
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Committee Member</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <CommitteeForm member={member} members={members} designations={designations} memberMode={memberMode} />
      </div>
    </div>
  );
}
