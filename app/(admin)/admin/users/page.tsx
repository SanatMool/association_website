import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Trash2, Shield } from "lucide-react";
import DeleteUserButton from "./DeleteUserButton";

export default async function UsersPage() {
  const users = await prisma.adminUser.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Users</h1>
          <p className="text-gray-500 text-sm">Users who can access the CMS dashboard.</p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm font-medium rounded-lg hover:bg-[#0d1550] transition-colors"
        >
          <Plus size={15} />
          Add User
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0a1040] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{u.email}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <Shield size={10} />
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-6 py-4 text-right">
                  {users.length > 1 && <DeleteUserButton id={u.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
