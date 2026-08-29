"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, UserCog, Shield, Trash2, X, Mail, Calendar, Edit2, Key,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import PanelCard from "@/components/ui/panel/PanelCard";
import Badge from "@/components/ui/panel/Badge";
import EmptyState from "@/components/ui/panel/EmptyState";
import ConfirmDialog from "@/components/ui/panel/ConfirmDialog";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  systemRole: string;
  createdAt: string;
  designationName: string | null;
  designationId: string | null;
}

interface Designation {
  id: string;
  name: string;
  systemRole: string;
}

interface Props {
  users: AdminUser[];
  designations: Designation[];
  currentAdminId: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  member: "Member",
};

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  systemRole: string;
  designationId: string;
}

interface EditForm {
  systemRole: string;
  designationId: string;
  newPassword: string;
}

export default function UsersClient({ users: initial, designations, currentAdminId }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newForm, setNewForm] = useState<NewUserForm>({
    name: "", email: "", password: "", systemRole: "admin", designationId: "",
  });

  const [editForm, setEditForm] = useState<EditForm>({
    systemRole: "admin", designationId: "", newPassword: "",
  });

  function openEdit(u: AdminUser) {
    setEditForm({
      systemRole: u.systemRole,
      designationId: u.designationId ?? "",
      newPassword: "",
    });
    setEditingId(u.id);
    setError(null);
  }

  async function handleCreate() {
    if (!newForm.name || !newForm.email || !newForm.password) {
      setError("Name, email and password are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newForm.name,
        email: newForm.email,
        password: newForm.password,
        systemRole: newForm.systemRole,
        designationId: newForm.designationId || undefined,
      }),
    });
    const json = await res.json() as { error?: string; id?: string; name?: string; email?: string; systemRole?: string; createdAt?: string };
    if (!res.ok) { setError(json.error ?? "Failed to create user"); setSaving(false); return; }
    setUsers((prev) => [...prev, {
      id: json.id!,
      name: json.name!,
      email: json.email!,
      role: json.systemRole!,
      systemRole: json.systemRole!,
      createdAt: json.createdAt ?? new Date().toISOString(),
      designationName: designations.find((d) => d.id === newForm.designationId)?.name ?? null,
      designationId: newForm.designationId || null,
    }]);
    setShowNew(false);
    setNewForm({ name: "", email: "", password: "", systemRole: "admin", designationId: "" });
    setSaving(false);
    router.refresh();
  }

  async function handleEditSave() {
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = {
      systemRole: editForm.systemRole,
      designationId: editForm.designationId || null,
    };
    if (editForm.newPassword) body.password = editForm.newPassword;

    const res = await fetch(`/api/users/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json() as { success?: boolean; error?: string; data?: { systemRole?: string } };
    if (!json.success) { setError(json.error ?? "Failed to save"); setSaving(false); return; }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingId
          ? {
              ...u,
              systemRole: editForm.systemRole,
              role: editForm.systemRole,
              designationId: editForm.designationId || null,
              designationName: designations.find((d) => d.id === editForm.designationId)?.name ?? null,
            }
          : u
      )
    );
    setEditingId(null);
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const json = await res.json() as { success?: boolean; error?: string };
    if (!json.success) {
      setError(json.error ?? "Delete failed");
      setDeleting(false);
      setConfirmDeleteId(null);
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setConfirmDeleteId(null);
    setDeleting(false);
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
        <button
          onClick={() => { setShowNew(true); setError(null); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm font-medium rounded-xl hover:bg-[#0d1550] transition-colors min-h-[44px] w-full sm:w-auto justify-center"
        >
          <Plus size={15} />
          Add User
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mb-6">
        <PanelCard className="px-4 py-3 flex items-center gap-3" hover={false}>
          <div className="w-8 h-8 bg-[#0a1040]/10 rounded-lg flex items-center justify-center">
            <UserCog size={15} className="text-[#0a1040]" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{users.length}</div>
            <div className="text-xs text-gray-500">Total users</div>
          </div>
        </PanelCard>
      </div>

      {/* Global error */}
      {error && !showNew && !editingId && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <PanelCard key={u.id} className="p-5">
            {/* Avatar + name */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0a1040] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{u.name}</div>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <Badge tone={u.systemRole === "admin" ? "warning" : u.systemRole === "editor" ? "info" : "neutral"} icon={<Shield size={9} />}>
                      {ROLE_LABELS[u.systemRole] ?? u.systemRole}
                    </Badge>
                    {u.designationName && (
                      <span className="text-[11px] text-gray-500">· {u.designationName}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(u)}
                  className="p-1.5 text-gray-300 hover:text-[#0a1040] hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit role"
                >
                  <Edit2 size={13} />
                </button>
                {users.length > 1 && u.id !== currentAdminId && (
                  <button
                    onClick={() => setConfirmDeleteId(u.id)}
                    className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

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
          </PanelCard>
        ))}
      </div>

      {users.length === 0 && (
        <PanelCard className="text-center py-16" hover={false}>
          <EmptyState
            icon={UserCog}
            title="No admin users found."
            action={
              <button onClick={() => setShowNew(true)} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                Add the first user →
              </button>
            }
          />
        </PanelCard>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Deactivate this user?"
        message={confirmDeleteId ? `${users.find((u) => u.id === confirmDeleteId)?.name ?? "This user"} will lose all CMS access.` : undefined}
        confirmLabel="Deactivate"
        loading={deleting}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* New User Modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowNew(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Add Admin User</h2>
                <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg">
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-4 space-y-3">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">{error}</div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newForm.name}
                    onChange={(e) => setNewForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. Ram Bahadur"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newForm.email}
                    onChange={(e) => setNewForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={newForm.password}
                    onChange={(e) => setNewForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">System Role</label>
                  <select
                    value={newForm.systemRole}
                    onChange={(e) => setNewForm((p) => ({ ...p, systemRole: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="admin">Admin — Full access</option>
                    <option value="editor">Editor — Limited (set permissions via Designation)</option>
                    <option value="member">Member — Portal only</option>
                  </select>
                </div>
                {designations.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Designation (optional)</label>
                    <select
                      value={newForm.designationId}
                      onChange={(e) => setNewForm((p) => ({ ...p, designationId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">No designation</option>
                      {designations.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.systemRole})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-3 border-t border-gray-100">
                <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-5 py-2 bg-[#0a1040] text-white text-sm font-medium rounded-xl hover:bg-[#0d1550] disabled:opacity-60 transition-colors"
                >
                  {saving ? "Creating…" : "Create User"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {editingId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setEditingId(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Edit User</h2>
                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg">
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-4 space-y-3">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">{error}</div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">System Role</label>
                  <select
                    value={editForm.systemRole}
                    onChange={(e) => setEditForm((p) => ({ ...p, systemRole: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="admin">Admin — Full access</option>
                    <option value="editor">Editor — Limited access</option>
                    <option value="member">Member — Portal only</option>
                  </select>
                </div>
                {designations.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Designation</label>
                    <select
                      value={editForm.designationId}
                      onChange={(e) => setEditForm((p) => ({ ...p, designationId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">No designation</option>
                      {designations.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.systemRole})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Key size={11} />
                    New Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm((p) => ({ ...p, newPassword: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="New password"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-3 border-t border-gray-100">
                <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                <button
                  onClick={handleEditSave}
                  disabled={saving}
                  className="px-5 py-2 bg-[#0a1040] text-white text-sm font-medium rounded-xl hover:bg-[#0d1550] disabled:opacity-60 transition-colors"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
