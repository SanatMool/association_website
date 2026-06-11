"use client";

import { useState } from "react";
import { Tag, CheckCircle, ChevronDown, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  monthlyFee: string;
  annualRenewalFee: string;
}

interface Props {
  memberId: string;
  currentCategoryId: string | null;
  categories: Category[];
}

export default function MemberCategoryCard({ memberId, currentCategoryId, categories }: Props) {
  const [selected, setSelected] = useState<string>(currentCategoryId ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = categories.find((c) => c.id === selected);
  const isDirty = selected !== (currentCategoryId ?? "");

  async function save() {
    setSaving(true); setError(null); setSaved(false);
    const res  = await fetch(`/api/membership/member-category/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberCategoryId: selected || null }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    setSaving(false);
    if (!json.success) { setError(json.error ?? "Failed to save"); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Tag size={15} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-800">Membership Fee Category</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Assigning a category lets the system auto-fill the standard fee amount when recording dues for this member.
      </p>

      <div className="relative mb-3">
        <select
          value={selected}
          onChange={(e) => { setSelected(e.target.value); setSaved(false); }}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
        >
          <option value="">— No category assigned —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Preview selected category fees */}
      {current && (
        <div className="flex flex-wrap gap-2 mb-3">
          {Number(current.monthlyFee) > 0 && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
              Rs {Number(current.monthlyFee).toLocaleString()} / month
            </span>
          )}
          {Number(current.annualRenewalFee) > 0 && (
            <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">
              Rs {Number(current.annualRenewalFee).toLocaleString()} / year
            </span>
          )}
          {Number(current.monthlyFee) === 0 && Number(current.annualRenewalFee) === 0 && (
            <span className="text-xs text-gray-400">No fees defined for this category.</span>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      <button
        onClick={save}
        disabled={saving || !isDirty}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#0a1040] text-white rounded-lg hover:bg-[#0d1550] disabled:opacity-40 disabled:cursor-default transition-colors"
      >
        {saving ? (
          <><Loader2 size={12} className="animate-spin" /> Saving…</>
        ) : saved ? (
          <><CheckCircle size={12} /> Saved</>
        ) : (
          "Save Category"
        )}
      </button>
    </div>
  );
}
