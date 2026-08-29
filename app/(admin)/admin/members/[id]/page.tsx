import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import MemberForm from "@/components/admin/MemberForm";
import PersonMemberForm from "@/components/admin/PersonMemberForm";
import MemberCategoryCard from "@/components/admin/MemberCategoryCard";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAdminContext } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function EditMemberPage({ params }: { params: { id: string } }) {
  const [member, ctx] = await Promise.all([
    prisma.member.findUnique({ where: { id: params.id } }),
    getAdminContext(),
  ]);
  if (!member) notFound();

  const associationId = ctx?.associationId ?? null;

  // Fetch current category assignment + visibility flags + all available categories + member_mode in parallel
  const [memberLink, categories, memberModeSetting] = await Promise.all([
    associationId
      ? prisma.memberAssociation.findUnique({
          where: { memberId_associationId: { memberId: params.id, associationId } },
          select: { memberCategoryId: true, showPhone: true, showEmail: true },
        })
      : Promise.resolve(null),
    associationId
      ? prisma.membershipCategory.findMany({
          where: { associationId },
          orderBy: { name: "asc" },
          select: { id: true, name: true, monthlyFee: true, annualRenewalFee: true },
        })
      : Promise.resolve([]),
    prisma.siteSettings.findUnique({
      where: { key_associationId: { key: "member_mode", associationId: associationId ?? "" } },
    }),
  ]);

  const memberMode = memberModeSetting?.value === "person" ? "person" : "venue";

  const currentCategoryId = memberLink?.memberCategoryId ?? null;
  const showPhone = memberLink?.showPhone ?? false;
  const showEmail = memberLink?.showEmail ?? false;
  // Serialize Decimal → string for client component
  const serializedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    monthlyFee: String(c.monthlyFee),
    annualRenewalFee: String(c.annualRenewalFee),
  }));

  return (
    <div>
      <Link href="/admin/members" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={14} />
        Back to members
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Member</h1>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            {memberMode === "person"
              ? <PersonMemberForm member={member} showPhone={showPhone} showEmail={showEmail} />
              : <MemberForm member={member} showPhone={showPhone} showEmail={showEmail} />}
          </div>
        </div>
        <div className="space-y-4">
          <MemberCategoryCard
            memberId={params.id}
            currentCategoryId={currentCategoryId}
            categories={serializedCategories}
          />
        </div>
      </div>
    </div>
  );
}
