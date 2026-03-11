import MemberForm from "@/components/admin/MemberForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewMemberPage() {
  return (
    <div>
      <Link href="/admin/members" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={14} />
        Back to members
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Member</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <MemberForm />
      </div>
    </div>
  );
}
