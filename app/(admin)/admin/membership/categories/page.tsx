"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Tag, Info, Check, X, Loader2, Users, ChevronRight, ChevronDown, Search, ArrowUpDown } from "lucide-react";
import Link from "next/link";

interface CategoryMember { id: string; name: string; area: string; category: string | null }

interface Category {
  id: string;
  name: string;
  monthlyFee: string;
  annualRenewalFee: string;
  _count: { memberLinks: number };
}

const empty = { name: "", monthlyFee: "", annualRenewalFee: "" };

function validateForm(form: typeof empty): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!form.name.trim()) errs.name = "Category name is required.";
  if (form.monthlyFee !== "" && (isNaN(Number(form.monthlyFee)) || Number(form.monthlyFee) < 0))
    errs.monthlyFee = "Enter a valid amount (0 or more).";
  if (form.annualRenewalFee !== "" && (isNaN(Number(form.annualRenewalFee)) || Number(form.annualRenewalFee) < 0))
    errs.annualRenewalFee = "Enter a valid amount (0 or more).";
  return errs;
}

type SortKey = "name" | "monthly" | "annual" | "members";

export default function CategoriesPage() {
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [form,        setForm]        = useState(empty);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editing,     setEditing]     = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  const [search,      setSearch]      = useState("");
  const [sortKey,     setSortKey]     = useState<SortKey>("name");
  const [sortAsc,     setSortAsc]     = useState(true);

  // Member list expansion per category
  const [expandedCatId,   setExpandedCatId]   = useState<string | null>(null);
  const [catMembers,      setCatMembers]      = useState<CategoryMember[]>([]);
  const [catMembersLoading, setCatMembersLoading] = useState(false);

  const load = useCallback(async () => {
    const res  = await fetch("/api/membership/categories");
    const json = await res.json() as { success: boolean; data: Category[] };
    if (json.success) setCategories(json.data);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleCatMembers(catId: string) {
    if (expandedCatId === catId) { setExpandedCatId(null); return; }
    setExpandedCatId(catId); setCatMembers([]); setCatMembersLoading(true);
    const res  = await fetch(`/api/membership/categories/${catId}`);
    const json = await res.json() as { success: boolean; data: CategoryMember[] };
    if (json.success) setCatMembers(json.data);
    setCatMembersLoading(false);
  }

  function openAdd() {
    setEditing(null); setForm(empty); setFieldErrors({}); setSaveError(null); setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat.id);
    setForm({ name: cat.name, monthlyFee: cat.monthlyFee, annualRenewalFee: cat.annualRenewalFee });
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
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setSaving(true); setSaveError(null);
    try {
      const body = {
        name:             form.name.trim(),
        monthlyFee:       parseFloat(form.monthlyFee)       || 0,
        annualRenewalFee: parseFloat(form.annualRenewalFee) || 0,
      };
      const url  = editing ? `/api/membership/categories/${editing}` : "/api/membership/categories";
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
    await fetch(`/api/membership/categories/${id}`, { method: "DELETE" });
    setDeleteId(null); setDeleting(false);
    await load();
  }

  const monthly  = parseFloat(form.monthlyFee)       || 0;
  const annual   = parseFloat(form.annualRenewalFee) || 0;
  const hasPreview = (form.monthlyFee !== "" || form.annualRenewalFee !== "") && (monthly > 0 || annual > 0);

  const displayed = useMemo(() => {
    let list = categories.filter((c) =>
      search === "" || c.name.toLowerCase().includes(search.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      let diff = 0;
      if (sortKey === "name")    diff = a.name.localeCompare(b.name);
      if (sortKey === "monthly") diff = Number(a.monthlyFee) - Number(b.monthlyFee);
      if (sortKey === "annual")  diff = Number(a.annualRenewalFee) - Number(b.annualRenewalFee);
      if (sortKey === "members") diff = a._count.memberLinks - b._count.memberLinks;
      return sortAsc ? diff : -diff;
    });
    return list;
  }, [categories, search, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  const inputCls = (err?: string) =>
    `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition
     ${err ? "border-red-300 bg-red-50 focus:ring-red-400" : "border-gray-200 focus:ring-amber-400"}`;

  return (
    <div className="max-w-2xl">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Tag size={20} className="text-amber-500" /> Fee Categories
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Define member tiers and their fee schedules.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm font-medium rounded-xl hover:bg-[#0d1550] shadow-sm transition-colors w-full sm:w-auto min-h-[44px]">
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* ── Add / Edit form panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="form-panel"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,   scale: 1 }}
            exit={{   opacity: 0, y: -12,  scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">

            {/* Form header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl">
                <Tag size={16} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900 text-sm">{editing ? "Edit Category" : "Add New Category"}</h2>
                <p className="text-xs text-gray-400">Set a name and fee amounts for this membership tier.</p>
              </div>
              <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Info banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
                <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Categories are assigned to members and used to auto-fill fee amounts when recording dues payments. Each category can have a different monthly and annual fee.
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g. Banquet Hall, Hotel, Catering Venue"
                  className={inputCls(fieldErrors.name)}
                />
                {fieldErrors.name
                  ? <p className="text-[11px] text-red-500 mt-1">{fieldErrors.name}</p>
                  : <p className="text-[11px] text-gray-400 mt-1">Shown on member records, dues history, and reports.</p>
                }
              </div>

              {/* Fees */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Monthly Fee</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Rs</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.monthlyFee}
                      onChange={(e) => setField("monthlyFee", e.target.value)}
                      placeholder="0"
                      className={`${inputCls(fieldErrors.monthlyFee)} pl-9`}
                    />
                  </div>
                  {fieldErrors.monthlyFee
                    ? <p className="text-[11px] text-red-500 mt-1">{fieldErrors.monthlyFee}</p>
                    : <p className="text-[11px] text-gray-400 mt-1">Enter 0 if not billed monthly.</p>
                  }
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Annual Renewal Fee</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Rs</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.annualRenewalFee}
                      onChange={(e) => setField("annualRenewalFee", e.target.value)}
                      placeholder="0"
                      className={`${inputCls(fieldErrors.annualRenewalFee)} pl-9`}
                    />
                  </div>
                  {fieldErrors.annualRenewalFee
                    ? <p className="text-[11px] text-red-500 mt-1">{fieldErrors.annualRenewalFee}</p>
                    : <p className="text-[11px] text-gray-400 mt-1">Charged once per year at renewal.</p>
                  }
                </div>
              </div>

              {/* Fee preview */}
              <AnimatePresence>
                {hasPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{   opacity: 0, height: 0 }}
                    className="overflow-hidden">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-2">Fee Preview</p>
                      <div className="flex gap-6 text-sm">
                        {monthly > 0 && (
                          <div>
                            <span className="text-emerald-800 font-bold">Rs {monthly.toLocaleString()}</span>
                            <span className="text-emerald-600 text-xs ml-1">/ month</span>
                          </div>
                        )}
                        {annual > 0 && (
                          <div>
                            <span className="text-emerald-800 font-bold">Rs {annual.toLocaleString()}</span>
                            <span className="text-emerald-600 text-xs ml-1">/ year</span>
                          </div>
                        )}
                        {monthly > 0 && annual > 0 && (
                          <div className="text-emerald-500 text-xs self-end pb-0.5">
                            Total if billed both: Rs {(monthly * 12 + annual).toLocaleString()} / yr
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Save error */}
              {saveError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex gap-2">
                  <Info size={14} className="flex-shrink-0 mt-0.5" /> {saveError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <button type="button" onClick={closeForm}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors">
                {saving
                  ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                  : <><Check size={14} /> {editing ? "Update Category" : "Save Category"}</>
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search + sort bar ────────────────────────────────────────────── */}
      {!loading && categories.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            <ArrowUpDown size={11} />
            {(["name", "monthly", "annual", "members"] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => toggleSort(key)}
                className={`px-2 py-1 rounded capitalize transition-colors ${sortKey === key ? "bg-[#0a1040] text-white" : "hover:bg-gray-100 text-gray-500"}`}
              >
                {key === "monthly" ? "Mo. fee" : key === "annual" ? "Ann. fee" : key}
                {sortKey === key && (sortAsc ? " ↑" : " ↓")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Category list ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
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
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Tag size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No categories yet</p>
            <p className="text-xs text-gray-300 mt-1">Add a category above to define membership tiers.</p>
            <button onClick={openAdd}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium">
              <Plus size={12} /> Add first category <ChevronRight size={12} />
            </button>
          </div>
        ) : displayed.length === 0 && search !== "" ? (
          <div className="bg-white rounded-xl border border-gray-100 py-10 text-center">
            <p className="text-sm text-gray-400">No categories match &ldquo;{search}&rdquo;</p>
          </div>
        ) : (
          displayed.map((cat) => (
            <motion.div key={cat.id} layout
              className={`bg-white rounded-xl border transition-colors overflow-hidden
                ${editing === cat.id && showForm ? "border-amber-300 shadow-sm" : "border-gray-100 hover:border-gray-200"}`}>

              {/* Category row */}
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Icon */}
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Tag size={15} className="text-amber-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {Number(cat.monthlyFee) > 0 && (
                      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                        Rs {Number(cat.monthlyFee).toLocaleString()} / mo
                      </span>
                    )}
                    {Number(cat.annualRenewalFee) > 0 && (
                      <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">
                        Rs {Number(cat.annualRenewalFee).toLocaleString()} / yr
                      </span>
                    )}
                    {Number(cat.monthlyFee) === 0 && Number(cat.annualRenewalFee) === 0 && (
                      <span className="text-xs text-gray-400">No fees set</span>
                    )}
                  </div>
                </div>

                {/* Member count — clickable to expand */}
                <button
                  onClick={() => { if (cat._count.memberLinks > 0) void toggleCatMembers(cat.id); }}
                  disabled={cat._count.memberLinks === 0}
                  className={`flex items-center gap-1.5 text-xs flex-shrink-0 px-2.5 py-1.5 rounded-lg transition-colors ${
                    cat._count.memberLinks > 0
                      ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 cursor-pointer"
                      : "text-gray-400 cursor-default"
                  }`}
                >
                  <Users size={12} />
                  <span>{cat._count.memberLinks} member{cat._count.memberLinks !== 1 ? "s" : ""}</span>
                  {cat._count.memberLinks > 0 && (
                    expandedCatId === cat.id
                      ? <ChevronDown size={11} className="transition-transform rotate-0" />
                      : <ChevronRight size={11} />
                  )}
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { openEdit(cat); }}
                    className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Edit">
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteId(deleteId === cat.id ? null : cat.id)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Member list expansion */}
              <AnimatePresence>
                {expandedCatId === cat.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden">
                    <div className="border-t border-indigo-50 bg-indigo-50/30 px-5 py-3">
                      {catMembersLoading ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                          <Loader2 size={12} className="animate-spin" /> Loading members…
                        </div>
                      ) : catMembers.length === 0 ? (
                        <p className="text-xs text-gray-400 py-1">No members in this category.</p>
                      ) : (
                        <div className="space-y-1">
                          {catMembers.map((m) => (
                            <Link key={m.id} href={`/admin/members/${m.id}`}
                              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white transition-colors group">
                              <span className="text-sm font-medium text-gray-800 group-hover:text-[#0a1040]">{m.name}</span>
                              <span className="text-xs text-gray-400">{m.area}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inline delete confirmation */}
              <AnimatePresence>
                {deleteId === cat.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden">
                    {cat._count.memberLinks > 0 ? (
                      <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold text-amber-700">Cannot delete &quot;{cat.name}&quot;</p>
                          <p className="text-[11px] text-amber-600 mt-0.5">
                            {cat._count.memberLinks} member{cat._count.memberLinks !== 1 ? "s are" : " is"} enrolled in this category. Reassign them first before deleting.
                          </p>
                        </div>
                        <button onClick={() => setDeleteId(null)}
                          className="flex-shrink-0 px-3 py-1.5 text-xs text-amber-700 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 transition-colors min-h-[36px]">
                          Got it
                        </button>
                      </div>
                    ) : (
                      <div className="px-5 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold text-red-700">Delete &quot;{cat.name}&quot;?</p>
                          <p className="text-[11px] text-red-500 mt-0.5">This cannot be undone.</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => setDeleteId(null)}
                            className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-h-[36px]">
                            Cancel
                          </button>
                          <button onClick={() => handleDelete(cat.id)} disabled={deleting}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors min-h-[36px]">
                            {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                            {deleting ? "Deleting…" : "Yes, delete"}
                          </button>
                        </div>
                      </div>
                    )}
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
