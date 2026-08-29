import MemberForm from "@/components/admin/MemberForm";
import PersonMemberForm from "@/components/admin/PersonMemberForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";

export default async function NewMemberPage() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const memberModeSetting = await prisma.siteSettings.findUnique({
    where: { key_associationId: { key: "member_mode", associationId: associationId ?? "" } },
  });
  const memberMode = memberModeSetting?.value === "person" ? "person" : "venue";

  return (
    <div>
      <Link href="/admin/members" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={14} />
        Back to members
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Member</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {memberMode === "person" ? <PersonMemberForm /> : <MemberForm />}
      </div>
    </div>
  );
}
