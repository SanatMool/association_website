"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "./ImageUpload";
import { CommitteeMember } from "@prisma/client";

interface Props {
  member?: CommitteeMember;
}

export default function CommitteeForm({ member }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: member?.name ?? "",
    role: member?.role ?? "",
    roleKey: member?.roleKey ?? "member",
    organization: member?.organization ?? "",
    venue: member?.venue ?? "",
    bio: member?.bio ?? "",
    order: member?.order ?? 99,
    highlighted: member?.highlighted ?? false,
    image: member?.image ?? "",
  });

  function set(key: string, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = member ? `/api/committee/${member.id}` : "/api/committee";
    const method = member ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, order: Number(form.order) }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Failed to save");
      setSaving(false);
      return;
    }

    router.push("/admin/committee");
    router.refresh();
  }

  const field = (label: string, key: string, type = "text", placeholder = "") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key as keyof typeof form] as string}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {field("Name *", "name")}
        {field("Role *", "role", "text", "President")}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role Key *</label>
          <select
            value={form.roleKey}
            onChange={(e) => set("roleKey", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {["president", "vice_president", "secretary", "treasurer", "member"].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        {field("Order", "order", "number", "1")}
        {field("Venue", "venue")}
        {field("Organization", "organization")}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
        <ImageUpload value={form.image} onChange={(url) => set("image", url)} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="highlighted"
          checked={form.highlighted}
          onChange={(e) => set("highlighted", e.target.checked)}
          className="rounded"
        />
        <label htmlFor="highlighted" className="text-sm text-gray-700">Highlighted (President / VP)</label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] disabled:opacity-50"
        >
          {saving ? "Saving…" : member ? "Update member" : "Create member"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/committee")}
          className="px-5 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
