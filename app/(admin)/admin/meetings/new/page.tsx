"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

const TYPES = [
  { value: "agm",       label: "AGM (Annual General Meeting)" },
  { value: "picnic",    label: "Picnic / Recreation" },
  { value: "program",   label: "Program / Event" },
  { value: "committee", label: "Committee Meeting" },
  { value: "special",   label: "Special Meeting" },
];

export default function NewMeetingPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", type: "agm", scheduledAt: "", venue: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res  = await fetch("/api/meetings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json() as { success: boolean; data?: { id: string }; error?: string };
      if (!json.success) throw new Error(json.error ?? "Failed to create");
      router.push(`/admin/meetings/${json.data!.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Link href="/admin/meetings" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-5 transition-colors">
        <ArrowLeft size={13} /> Back to Meetings
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Schedule Meeting</h1>
      <p className="text-gray-400 text-sm mb-6">Create a new meeting record.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title <span className="text-red-400">*</span></label>
          <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="e.g. AGM 2026, Annual Picnic"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Type <span className="text-red-400">*</span></label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)} required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date &amp; Time <span className="text-red-400">*</span></label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Venue</label>
          <input type="text" value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Location or venue name"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Brief description (optional)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
        </div>

        {error && <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm font-semibold rounded-lg hover:bg-[#0d1550] transition-colors disabled:opacity-50">
            <Plus size={14} />{saving ? "Creating…" : "Create Meeting"}
          </button>
          <Link href="/admin/meetings" className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
