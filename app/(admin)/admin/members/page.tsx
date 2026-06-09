import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";
import VisibilityToggle from "@/components/admin/VisibilityToggle";
import { getAdminContext } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  // Fetch all member-association links (both visible and hidden) with member data
  const links = await prisma.memberAssociation.findMany({
    where: { associationId: associationId ?? undefined },
    include: { member: true },
    orderBy: [
      { member: { featured: "desc" } },
      { member: { name: "asc" } },
    ],
  });

  const visibleCount = links.filter((l) => l.visible).length;
  const hiddenCount = links.length - visibleCount;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {links.length} total · {visibleCount} visible · {hiddenCount} hidden
          </p>
        </div>
        <Link
          href="/admin/members/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] transition-colors"
        >
          <Plus size={14} />
          Add member
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Area</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Capacity</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Category</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Visibility</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Featured</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {links.map(({ member: m, visible }) => (
              <tr key={m.id} className={`hover:bg-gray-50/50 ${!visible ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                <td className="px-4 py-3 text-gray-500">{m.area}</td>
                <td className="px-4 py-3 text-gray-500">{m.capacity ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{m.category}</td>
                <td className="px-4 py-3">
                  <VisibilityToggle memberId={m.id} visible={visible} />
                </td>
                <td className="px-4 py-3">
                  {m.featured && (
                    <span className="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                      Featured
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      href={`/admin/members/${m.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <Pencil size={11} />
                      Edit
                    </Link>
                    <DeleteButton id={m.id} entity="members" redirectTo="/admin/members" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
