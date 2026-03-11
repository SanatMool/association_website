import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CommitteeForm from "@/components/admin/CommitteeForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditCommitteeMemberPage({ params }: { params: { id: string } }) {
  const member = await prisma.committeeMember.findUnique({ where: { id: params.id } });
  if (!member) notFound();

  return (
    <div>
      <Link href="/admin/committee" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={14} />
        Back to committee
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Committee Member</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <CommitteeForm member={member} />
      </div>
    </div>
  );
}
