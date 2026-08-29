"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

interface FormState {
  name: string;
  slug: string;
  domain: string;
  foundedYear: string;
  description: string;
  plan: string;
  memberMode: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export default function NewAssociationPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    slug: "",
    domain: "",
    foundedYear: "",
    description: "",
    plan: "basic",
    memberMode: "venue",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof FormState, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    if (key === "name" && !form.slug) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      setForm((p) => ({ ...p, name: value, slug }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/platform/associations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          foundedYear: form.foundedYear ? parseInt(form.foundedYear) : undefined,
        }),
      });
      const data = await res.json() as { success: boolean; error?: string; data?: { id: string } };
      if (!data.success) throw new Error(data.error ?? "Failed to create");
      router.push(`/platform/associations/${data.data!.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Link href="/platform/associations" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-5 transition-colors">
        <ArrowLeft size={13} />
        Back to Associations
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">New Association</h1>
      <p className="text-gray-400 text-sm mb-8">Register a new association on the platform.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {[
          { key: "name",        label: "Association Name",        placeholder: "Event and Venue Association Nepal", required: true },
          { key: "slug",        label: "Slug (URL identifier)",   placeholder: "eva-nepal", required: true },
          { key: "domain",      label: "Domain",                  placeholder: "eva.nibjar.com", required: true },
          { key: "foundedYear", label: "Founded Year (AD)",       placeholder: "2011", required: false },
          { key: "description", label: "Description",             placeholder: "Short description of the association", required: false },
        ].map(({ key, label, placeholder, required }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {label} {required && <span className="text-red-400">*</span>}
            </label>
            <input
              type={key === "foundedYear" ? "number" : "text"}
              value={form[key as keyof FormState]}
              onChange={(e) => set(key as keyof FormState, e.target.value)}
              placeholder={placeholder}
              required={required}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        ))}

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-3">Initial Admin Login</p>
          <div className="space-y-4">
            {[
              { key: "adminName",     label: "Admin Name",     placeholder: "Namoudyam Admin",          type: "text" },
              { key: "adminEmail",    label: "Admin Email",    placeholder: "admin@namoudyam.org",       type: "email" },
              { key: "adminPassword", label: "Admin Password", placeholder: "At least 8 characters",     type: "password" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {label} <span className="text-red-400">*</span>
                </label>
                <input
                  type={type}
                  value={form[key as keyof FormState]}
                  onChange={(e) => set(key as keyof FormState, e.target.value)}
                  placeholder={placeholder}
                  required
                  minLength={key === "adminPassword" ? 8 : undefined}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Member Mode</label>
          <select
            value={form.memberMode}
            onChange={(e) => set("memberMode", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="venue">Venue — members are physical venues/businesses</option>
            <option value="person">Person — members are individuals</option>
          </select>
          <p className="text-[11px] text-gray-400 mt-1.5">Controls member form fields, card display, and stats labels. Can be changed later in Admin Settings.</p>
        </div>

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

        {error && (
          <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus size={14} />
            {saving ? "Creating…" : "Create Association"}
          </button>
          <Link href="/platform/associations" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
