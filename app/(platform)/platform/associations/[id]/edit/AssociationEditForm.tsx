"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

interface Association {
  id: string;
  name: string;
  nameNe: string | null;
  slug: string;
  domain: string;
  logo: string | null;
  foundedYear: number | null;
  description: string | null;
  descriptionNe: string | null;
  active: boolean;
  plan: string;
}

export default function AssociationEditForm({ association }: { association: Association }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name:          association.name,
    nameNe:        association.nameNe ?? "",
    slug:          association.slug,
    domain:        association.domain,
    logo:          association.logo ?? "",
    foundedYear:   association.foundedYear?.toString() ?? "",
    description:   association.description ?? "",
    descriptionNe: association.descriptionNe ?? "",
    active:        association.active,
    plan:          association.plan,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/platform/associations/${association.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          foundedYear: form.foundedYear ? parseInt(form.foundedYear) : null,
          nameNe:        form.nameNe || null,
          logo:          form.logo || null,
          description:   form.description || null,
          descriptionNe: form.descriptionNe || null,
        }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (!data.success) throw new Error(data.error ?? "Failed to save");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const textFields: { key: keyof typeof form; label: string; placeholder: string; type?: string }[] = [
    { key: "name",          label: "Association Name (EN)",    placeholder: "Event and Venue Association Nepal" },
    { key: "nameNe",        label: "Association Name (NE)",    placeholder: "इभेन्ट एन्ड भेन्यू एसोसिएसन नेपाल" },
    { key: "slug",          label: "Slug",                     placeholder: "eva-nepal" },
    { key: "domain",        label: "Domain",                   placeholder: "eva.nibjar.com" },
    { key: "logo",          label: "Logo Path (/public/...)",  placeholder: "/eva/evanepal_transparent.png" },
    { key: "foundedYear",   label: "Founded Year (AD)",        placeholder: "2011", type: "number" },
    { key: "description",   label: "Description (EN)",         placeholder: "Short description" },
    { key: "descriptionNe", label: "Description (NE)",         placeholder: "छोटो विवरण" },
  ];

  return (
    <>
      <Link href={`/platform/associations/${association.id}`} className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-5 transition-colors">
        <ArrowLeft size={13} />
        Back to Association
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Association</h1>
      <p className="text-gray-400 text-sm mb-8 font-mono">{association.slug}</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {textFields.map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
            <input
              type={type ?? "text"}
              value={form[key] as string}
              onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        ))}

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Plan</label>
          <select
            value={form.plan}
            onChange={(e) => set("plan", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Active</label>
          <button
            type="button"
            onClick={() => set("active", !form.active)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              form.active ? "bg-indigo-500" : "bg-gray-200"
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              form.active ? "translate-x-4.5" : "translate-x-0.5"
            }`} />
          </button>
          <span className="text-xs text-gray-400">{form.active ? "Association is live" : "Association is disabled"}</span>
        </div>

        {error && (
          <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        {saved && (
          <p className="text-green-600 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2">Changes saved successfully.</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <Link href={`/platform/associations/${association.id}`} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
