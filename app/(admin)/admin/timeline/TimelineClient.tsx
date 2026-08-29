"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, Pencil, Trash2, Star, X, Loader2 } from "lucide-react";
import PanelCard from "@/components/ui/panel/PanelCard";
import { PanelTable, PanelTableHead, PanelTableRow } from "@/components/ui/panel/PanelTable";
import EmptyState from "@/components/ui/panel/EmptyState";
import ConfirmDialog from "@/components/ui/panel/ConfirmDialog";

interface TimelineRow {
  id: string;
  year: number;
  title: string;
  titleNe: string | null;
  description: string;
  descriptionNe: string | null;
  stat: string | null;
  highlighted: boolean;
  order: number;
}

interface FormData {
  year: string;
  title: string;
  titleNe: string;
  description: string;
  descriptionNe: string;
  stat: string;
  highlighted: boolean;
  order: string;
}

const EMPTY_FORM: FormData = {
  year: "",
  title: "",
  titleNe: "",
  description: "",
  descriptionNe: "",
  stat: "",
  highlighted: false,
  order: "0",
};

function rowToForm(row: TimelineRow): FormData {
  return {
    year: String(row.year),
    title: row.title,
    titleNe: row.titleNe ?? "",
    description: row.description,
    descriptionNe: row.descriptionNe ?? "",
    stat: row.stat ?? "",
    highlighted: row.highlighted,
    order: String(row.order),
  };
}

function sorted(list: TimelineRow[]) {
  return [...list].sort((a, b) => a.order - b.order || a.year - b.year);
}

export default function TimelineClient({ initialEntries }: { initialEntries: TimelineRow[] }) {
  const [entries, setEntries] = useState<TimelineRow[]>(sorted(initialEntries));
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId("new");
    setError(null);
  }

  function openEdit(row: TimelineRow) {
    setForm(rowToForm(row));
    setEditingId(row.id);
    setError(null);
  }

  function closeModal() {
    setEditingId(null);
    setError(null);
  }

  async function handleSave() {
    if (!form.year || !form.title.trim() || !form.description.trim()) {
      setError("Year, title, and description are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const isNew = editingId === "new";
      const url = isNew ? "/api/timeline" : `/api/timeline/${editingId}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: Number(form.year),
          title: form.title.trim(),
          titleNe: form.titleNe.trim() || null,
          description: form.description.trim(),
          descriptionNe: form.descriptionNe.trim() || null,
          stat: form.stat.trim() || null,
          highlighted: form.highlighted,
          order: Number(form.order) || 0,
        }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? "Save failed."); return; }
      const saved = json.data as TimelineRow;
      setEntries((prev) =>
        sorted(isNew ? [...prev, saved] : prev.map((e) => (e.id === saved.id ? saved : e)))
      );
      closeModal();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/timeline/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) { alert(json.error ?? "Delete failed."); return; }
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setConfirmDeleteId(null);
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Clock size={22} className="text-amber-500" /> Timeline
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Association milestones shown on the public homepage.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#0a1040] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0d1655] transition-colors"
        >
          <Plus size={15} /> Add Entry
        </button>
      </div>

      {/* Empty state */}
      {entries.length === 0 ? (
        <PanelCard className="py-16" hover={false}>
          <EmptyState
            icon={Clock}
            title="No timeline entries yet."
            action={
              <button onClick={openNew} className="text-sm text-[#0a1040] font-medium hover:underline">
                Add the first milestone
              </button>
            }
          />
        </PanelCard>
      ) : (
        <PanelTable>
          {/* Desktop table */}
          <table className="hidden sm:table w-full text-sm">
            <PanelTableHead>
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">Year</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Stat</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Highlighted</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Actions</th>
              </tr>
            </PanelTableHead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((e, i) => (
                <PanelTableRow key={e.id} index={i}>
                  <td className="px-4 py-3 text-xs text-gray-400">{e.order}</td>
                  <td className="px-4 py-3 font-bold text-[#0a1040]">{e.year}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{e.title}</p>
                    {e.titleNe && <p className="text-xs text-gray-400 mt-0.5">{e.titleNe}</p>}
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{e.description}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{e.stat ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {e.highlighted && <Star size={14} className="text-amber-500 mx-auto fill-amber-400" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(e)}
                        className="p-1.5 text-gray-400 hover:text-[#0a1040] hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(e.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </PanelTableRow>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-50">
            {entries.map((e) => (
              <div key={e.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#0a1040]">{e.year}</span>
                    {e.highlighted && <Star size={12} className="text-amber-500 fill-amber-400 flex-shrink-0" />}
                    {e.stat && <span className="text-xs text-gray-400 truncate">{e.stat}</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{e.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{e.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(e)}
                    className="p-1.5 text-gray-400 hover:text-[#0a1040] hover:bg-gray-100 rounded-lg"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(e.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </PanelTable>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this timeline entry?"
        message={confirmDeleteId ? `"${entries.find((e) => e.id === confirmDeleteId)?.title ?? "This entry"}" will be removed from the public timeline.` : undefined}
        loading={deleting}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {editingId !== null && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">
                    {editingId === "new" ? "Add Timeline Entry" : "Edit Timeline Entry"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Form fields */}
                <div className="px-6 py-5 space-y-4">
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={form.year}
                        onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                        placeholder="e.g. 2011"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={form.order}
                        onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Title (English) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Association Founded"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Title (Nepali){" "}
                      <span className="text-gray-400 font-normal">optional</span>
                    </label>
                    <input
                      type="text"
                      value={form.titleNe}
                      onChange={(e) => setForm((f) => ({ ...f, titleNe: e.target.value }))}
                      placeholder="नेपाली शीर्षक"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description (English) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Brief milestone description…"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description (Nepali){" "}
                      <span className="text-gray-400 font-normal">optional</span>
                    </label>
                    <textarea
                      rows={3}
                      value={form.descriptionNe}
                      onChange={(e) => setForm((f) => ({ ...f, descriptionNe: e.target.value }))}
                      placeholder="नेपाली विवरण…"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Stat Label{" "}
                      <span className="text-gray-400 font-normal">optional</span>
                    </label>
                    <input
                      type="text"
                      value={form.stat}
                      onChange={(e) => setForm((f) => ({ ...f, stat: e.target.value }))}
                      placeholder="e.g. 20+ Founding Members"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Decorative label shown alongside the milestone on the public site.
                    </p>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.highlighted}
                      onChange={(e) => setForm((f) => ({ ...f, highlighted: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="text-sm text-gray-700 font-medium">Highlighted milestone</span>
                      <p className="text-[11px] text-gray-400">
                        Shown with gold accent and glowing dot on the public timeline.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Modal footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#0a1040] text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-[#0d1655] transition-colors disabled:opacity-50"
                  >
                    {saving && <Loader2 size={13} className="animate-spin" />}
                    {saving ? "Saving…" : editingId === "new" ? "Add Entry" : "Save Changes"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
