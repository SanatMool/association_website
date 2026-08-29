"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Plus, Edit2, Trash2, X, Users, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { PERMISSION_KEYS, PERMISSION_LABELS } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";
import PanelCard from "@/components/ui/panel/PanelCard";
import Badge from "@/components/ui/panel/Badge";
import EmptyState from "@/components/ui/panel/EmptyState";
import ConfirmDialog from "@/components/ui/panel/ConfirmDialog";

interface Designation {
  id: string;
  name: string;
  systemRole: string;
  permissions: string[];
  isDefault: boolean;
  order: number;
  createdAt: string;
  userCount: number;
}

interface FormState {
  name: string;
  systemRole: string;
  permissions: string[];
  isDefault: boolean;
  order: number;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  member: "Member",
};

const PERM_GROUPS: { label: string; keys: Permission[] }[] = [
  {
    label: "Members",
    keys: ["members.view", "members.create", "members.edit", "members.delete"],
  },
  {
    label: "Events",
    keys: ["events.view", "events.manage"],
  },
  {
    label: "Meetings",
    keys: ["meetings.view", "meetings.manage"],
  },
  {
    label: "Finances",
    keys: ["finances.view", "finances.edit"],
  },
  {
    label: "Other",
    keys: ["news.manage", "reports.view", "settings.manage", "communications.send"],
  },
];

const defaultForm = (): FormState => ({
  name: "",
  systemRole: "editor",
  permissions: [],
  isDefault: false,
  order: 99,
});

export default function DesignationsClient({
  initialDesignations,
}: {
  initialDesignations: Designation[];
}) {
  const router = useRouter();
  const [designations, setDesignations] = useState(initialDesignations);
  const [editingId, setEditingId] = useState<"new" | string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function openNew() {
    setForm(defaultForm());
    setEditingId("new");
    setError(null);
  }

  function openEdit(d: Designation) {
    setForm({
      name: d.name,
      systemRole: d.systemRole,
      permissions: [...d.permissions],
      isDefault: d.isDefault,
      order: d.order,
    });
    setEditingId(d.id);
    setError(null);
  }

  function togglePermission(key: Permission) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError(null);

    const isNew = editingId === "new";
    const url = isNew ? "/api/designations" : `/api/designations/${editingId}`;
    const method = isNew ? "POST" : "PUT";
    const perms = form.systemRole === "editor" ? form.permissions : [];

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, permissions: perms }),
    });
    const json = await res.json() as { success: boolean; data?: Designation; error?: string };

    if (!json.success) {
      setError(json.error ?? "Save failed");
      setSaving(false);
      return;
    }

    if (isNew) {
      setDesignations((prev) =>
        [...prev, { ...json.data!, userCount: 0 }].sort((a, b) => a.order - b.order)
      );
    } else {
      setDesignations((prev) =>
        prev.map((d) =>
          d.id === editingId ? { ...d, ...json.data!, userCount: d.userCount } : d
        ).sort((a, b) => a.order - b.order)
      );
    }

    setSaving(false);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    const res = await fetch(`/api/designations/${id}`, { method: "DELETE" });
    const json = await res.json() as { success: boolean; error?: string };

    if (!json.success) {
      setError(json.error ?? "Delete failed");
      setDeleting(false);
      setConfirmDeleteId(null);
      return;
    }

    setDesignations((prev) => prev.filter((d) => d.id !== id));
    setConfirmDeleteId(null);
    setDeleting(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield size={22} className="text-[#0a1040]" />
            Designations &amp; Roles
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Define roles and permissions for admin users in your association.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm font-medium rounded-xl hover:bg-[#0d1550] transition-colors min-h-[44px] w-full sm:w-auto justify-center"
        >
          <Plus size={15} />
          Add Designation
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-xs text-blue-700">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <p>
          <strong>Admin</strong> = full access. &nbsp;
          <strong>Editor</strong> = limited access based on permissions below. &nbsp;
          <strong>Member</strong> = portal only (no admin panel access).
        </p>
      </div>

      {/* Designations list */}
      <div className="space-y-3">
        {designations.map((d) => (
          <PanelCard key={d.id} className="overflow-hidden">
            {/* Row */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{d.name}</span>
                  <Badge tone={d.systemRole === "admin" ? "warning" : d.systemRole === "editor" ? "info" : "neutral"}>
                    {ROLE_LABELS[d.systemRole] ?? d.systemRole}
                  </Badge>
                  {d.isDefault && <Badge tone="success">Default</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Users size={11} />
                    {d.userCount} {d.userCount === 1 ? "user" : "users"}
                  </span>
                  {d.systemRole === "editor" && d.permissions.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {d.permissions.length} permission{d.permissions.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {d.systemRole === "admin" && (
                    <span className="text-xs text-gray-400">Full access</span>
                  )}
                  {d.systemRole === "member" && (
                    <span className="text-xs text-gray-400">Portal only</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {d.systemRole === "editor" && d.permissions.length > 0 && (
                  <button
                    onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    title="View permissions"
                  >
                    {expandedId === d.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}
                <button
                  onClick={() => openEdit(d)}
                  className="p-2 text-gray-400 hover:text-[#0a1040] hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(d.id)}
                  disabled={d.userCount > 0}
                  title={d.userCount > 0 ? "Cannot delete — has users assigned" : "Delete"}
                  className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Expanded permissions */}
            <AnimatePresence>
              {expandedId === d.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-gray-50 px-5 py-3 bg-gray-50/50">
                    <div className="flex flex-wrap gap-1.5">
                      {d.permissions.map((p) => (
                        <Badge key={p} tone="info">
                          {PERMISSION_LABELS[p as Permission] ?? p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </PanelCard>
        ))}

        {designations.length === 0 && (
          <PanelCard className="text-center py-16" hover={false}>
            <EmptyState
              icon={Shield}
              title="No designations yet."
              action={
                <button onClick={openNew} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                  Add the first designation →
                </button>
              }
            />
          </PanelCard>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this designation?"
        message={confirmDeleteId ? `Users assigned to "${designations.find((d) => d.id === confirmDeleteId)?.name ?? "this designation"}" will lose their designation. This cannot be undone.` : undefined}
        loading={deleting}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Modal */}
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
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">
                  {editingId === "new" ? "New Designation" : "Edit Designation"}
                </h2>
                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    {error}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Designation Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Secretary, Treasurer, Committee Member"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* System Role */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    System Role <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {(["admin", "editor", "member"] as const).map((role) => (
                      <label
                        key={role}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          form.systemRole === role
                            ? "border-[#0a1040] bg-[#0a1040]/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="systemRole"
                          value={role}
                          checked={form.systemRole === role}
                          onChange={() => setForm((p) => ({ ...p, systemRole: role }))}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{ROLE_LABELS[role]}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {role === "admin" && "Full access to all admin features"}
                            {role === "editor" && "Limited access — set specific permissions below"}
                            {role === "member" && "Portal only — cannot access admin panel"}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Permissions — only for editor */}
                {form.systemRole === "editor" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="space-y-3">
                      {PERM_GROUPS.map((group) => (
                        <div key={group.label}>
                          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                            {group.label}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {group.keys.map((key) => (
                              <label
                                key={key}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                                  form.permissions.includes(key)
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={form.permissions.includes(key)}
                                  onChange={() => togglePermission(key)}
                                  className="hidden"
                                />
                                {PERMISSION_LABELS[key]}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options row */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.order}
                      onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div className="flex items-end pb-2.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isDefault}
                        onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
                        className="w-4 h-4 rounded accent-amber-500"
                      />
                      <span className="text-sm text-gray-700">Default designation</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 bg-[#0a1040] text-white text-sm font-medium rounded-xl hover:bg-[#0d1550] disabled:opacity-60 transition-colors"
                >
                  {saving ? "Saving…" : editingId === "new" ? "Create" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
