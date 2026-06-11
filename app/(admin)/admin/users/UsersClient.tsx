"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, UserCog, Shield, Trash2, X, Mail, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersClient({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    setDeleting(false);
    router.refresh();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog size={22} className="text-[#0a1040]" />
            Admin Users
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Users who can access the CMS dashboard.</p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm font-medium rounded-xl hover:bg-[#0d1550] transition-colors min-h-[44px] w-full sm:w-auto justify-center"
        >
          <Plus size={15} />
          Add User
        </Link>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0a1040]/10 rounded-lg flex items-center justify-center">
            <UserCog size={15} className="text-[#0a1040]" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{users.length}</div>
            <div className="text-xs text-gray-500">Total users</div>
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className={`bg-white rounded-xl border border-gray-100 p-5 transition-all ${
              confirmDeleteId === u.id ? "ring-2 ring-red-200" : "hover:shadow-sm"
            }`}
          >
            {/* Avatar + name */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0a1040] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{u.name}</div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 mt-0.5">
                    <Shield size={9} />
                    {u.role}
                  </span>
                </div>
              </div>

              {/* Delete action */}
              {users.length > 1 && (
                confirmDeleteId === u.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={deleting}
                      className="text-xs font-semibold text-white bg-red-500 px-2 py-1 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {deleting ? "…" : "Delete"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(u.id)}
                    className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )
              )}
            </div>

            {/* Delete confirmation panel */}
            {confirmDeleteId === u.id && (
              <div className="mb-3 p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-700">
                Delete <strong>{u.name}</strong>? They will lose all CMS access. This cannot be undone.
              </div>
            )}

            {/* Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Mail size={11} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{u.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Calendar size={11} className="flex-shrink-0" />
                <span>Added {formatDate(u.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <UserCog size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No admin users found.</p>
          <Link href="/admin/users/new" className="mt-3 text-sm text-amber-600 hover:text-amber-700 font-medium inline-block">
            Add the first user →
          </Link>
        </div>
      )}
    </div>
  );
}
