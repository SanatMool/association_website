"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";

interface Category {
  id: string;
  name: string;
  monthlyFee: string;
  annualRenewalFee: string;
  _count: { memberLinks: number };
}

const empty = { name: "", monthlyFee: "", annualRenewalFee: "" };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState(empty);
  const [editing, setEditing]       = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/membership/categories");
    const json = await res.json() as { success: boolean; data: Category[] };
    if (json.success) setCategories(json.data);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function startEdit(cat: Category) {
    setEditing(cat.id);
    setForm({ name: cat.name, monthlyFee: cat.monthlyFee, annualRenewalFee: cat.annualRenewalFee });
    setError(null);
  }

  function cancelEdit() { setEditing(null); setForm(empty); setError(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const body = { name: form.name, monthlyFee: parseFloat(form.monthlyFee) || 0, annualRenewalFee: parseFloat(form.annualRenewalFee) || 0 };
      const url  = editing ? `/api/membership/categories/${editing}` : "/api/membership/categories";
      const res  = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Failed to save");
      setForm(empty); setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/membership/categories/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fee Categories</h1>
        <p className="text-sm text-gray-500 mt-0.5">Set monthly and annual renewal fees per member type.</p>
      </div>

      {/* Add / Edit form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">{editing ? "Edit Category" : "Add New Category"}</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="col-span-3 sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Category Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Venue, Catering"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Fee (Rs)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monthlyFee}
              onChange={(e) => setForm((p) => ({ ...p, monthlyFee: e.target.value }))}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Annual Renewal (Rs)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.annualRenewalFee}
              onChange={(e) => setForm((p) => ({ ...p, annualRenewalFee: e.target.value }))}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
        {error && <p className="text-red-600 text-xs mb-3 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] transition-colors disabled:opacity-50">
            <Plus size={13} />{saving ? "Saving…" : editing ? "Update" : "Add Category"}
          </button>
          {editing && (
            <button type="button" onClick={cancelEdit} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Category list */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <Tag size={24} className="mx-auto mb-2 opacity-30" />
            No categories yet. Add one above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Monthly</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Annual Renewal</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Members</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.id} className={`hover:bg-gray-50/50 ${editing === cat.id ? "bg-indigo-50/40" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">Rs {Number(cat.monthlyFee).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-700">Rs {Number(cat.annualRenewalFee).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{cat._count.memberLinks}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(cat)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(cat.id, cat.name)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
