"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Info, Check, X, Loader2, DollarSign } from "lucide-react";

interface Fee {
  id: string;
  name: string;
  amount: string;
  description: string | null;
}

const empty = { name: "", amount: "", description: "" };

export default function AdditionalFeesPage() {
  const [fees,        setFees]        = useState<Fee[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [form,        setForm]        = useState(empty);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editing,     setEditing]     = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  const load = useCallback(async () => {
    const res  = await fetch("/api/membership/fees");
    const json = await res.json() as { success: boolean; data: Fee[] };
    if (json.success) setFees(json.data);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function validate(f: typeof empty) {
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = "Fee name is required.";
    if (!f.amount.trim() || isNaN(Number(f.amount)) || Number(f.amount) < 0)
      errs.amount = "Enter a valid amount (0 or more).";
    return errs;
  }

  function openAdd() {
    setEditing(null); setForm(empty); setFieldErrors({}); setSaveError(null); setShowForm(true);
  }

  function openEdit(fee: Fee) {
    setEditing(fee.id);
    setForm({ name: fee.name, amount: fee.amount, description: fee.description ?? "" });
    setFieldErrors({}); setSaveError(null); setShowForm(true);
  }

  function closeForm() {
    setShowForm(false); setEditing(null); setForm(empty); setFieldErrors({}); setSaveError(null);
  }

  function setField(k: keyof typeof empty, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
    setFieldErrors((p) => { const n = { ...p }; delete n[k]; return n; });
  }

  async function handleSave() {
    const errs = validate(form);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setSaving(true); setSaveError(null);
    try {
      const body = { name: form.name.trim(), amount: parseFloat(form.amount), description: form.description.trim() || null };
      const url  = editing ? `/api/membership/fees/${editing}` : "/api/membership/fees";
      const res  = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Failed to save");
      closeForm();
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    await fetch(`/api/membership/fees/${id}`, { method: "DELETE" });
    setDeleteId(null); setDeleting(false);
    await load();
  }

  const inputCls = (err?: string) =>
    `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition
     ${err ? "border-red-300 bg-red-50 focus:ring-red-400" : "border-gray-200 focus:ring-amber-400"}`;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <DollarSign size={20} className="text-amber-500" /> Additional Fees
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Custom fee line items for this association (e.g. ID Card, Insurance, etc.)</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm font-medium rounded-xl hover:bg-[#0d1550] shadow-sm transition-colors w-full sm:w-auto min-h-[44px]">
          <Plus size={14} /> Add Fee
        </button>
      </div>

      {/* Add / Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="fee-form"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,   scale: 1 }}
            exit={{   opacity: 0, y: -12,  scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">

            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl">
                <DollarSign size={16} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900 text-sm">{editing ? "Edit Fee" : "Add New Fee"}</h2>
                <p className="text-xs text-gray-400">Name the fee and set an amount.</p>
              </div>
              <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  These are association-level fees shown alongside membership categories — e.g. ID card fees, insurance, uniform costs, or any custom charge your association collects.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fee Name *</label>
                <input type="text" value={form.name} onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g. ID Card Fee, Insurance, Uniform Cost"
                  className={inputCls(fieldErrors.name)} />
                {fieldErrors.name && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (Rs) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Rs</span>
                  <input type="number" min="0" step="1" value={form.amount}
                    onChange={(e) => setField("amount", e.target.value)} placeholder="0"
                    className={`${inputCls(fieldErrors.amount)} pl-9`} />
                </div>
                {fieldErrors.amount && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.amount}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </label>
                <input type="text" value={form.description} onChange={(e) => setField("description", e.target.value)}
                  placeholder="e.g. One-time fee for association membership card"
                  className={inputCls()} />
              </div>

              {Number(form.amount) > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <p className="text-xs text-emerald-700">
                    <span className="font-bold">Rs {Number(form.amount).toLocaleString()}</span>
                    {" "}— {form.name || "this fee"}
                  </p>
                </div>
              )}

              {saveError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex gap-2">
                  <Info size={14} className="flex-shrink-0 mt-0.5" /> {saveError}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <button type="button" onClick={closeForm}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors">
                {saving
                  ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                  : <><Check size={14} /> {editing ? "Update Fee" : "Save Fee"}</>
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fee list */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 px-5 py-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-100 rounded w-32" />
                    <div className="h-2.5 bg-gray-100 rounded w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : fees.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <DollarSign size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No additional fees yet</p>
            <p className="text-xs text-gray-300 mt-1">Add custom fee line items like ID card costs, insurance, etc.</p>
            <button onClick={openAdd}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium">
              <Plus size={12} /> Add first fee
            </button>
          </div>
        ) : (
          fees.map((fee) => (
            <motion.div key={fee.id} layout
              className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign size={15} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{fee.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                      Rs {Number(fee.amount).toLocaleString()}
                    </span>
                    {fee.description && (
                      <span className="text-xs text-gray-400 truncate">{fee.description}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(fee)}
                    className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeleteId(deleteId === fee.id ? null : fee.id)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {deleteId === fee.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden">
                    <div className="px-5 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-red-700">Delete &quot;{fee.name}&quot;?</p>
                        <p className="text-[11px] text-red-500 mt-0.5">This cannot be undone.</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setDeleteId(null)}
                          className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-h-[36px]">
                          Cancel
                        </button>
                        <button onClick={() => handleDelete(fee.id)} disabled={deleting}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors min-h-[36px]">
                          {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                          {deleting ? "Deleting…" : "Yes, delete"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
