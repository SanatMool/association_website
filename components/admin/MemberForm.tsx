"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "./ImageUpload";
import { Member } from "@prisma/client";

interface Props {
  member?: Member;
}

export default function MemberForm({ member }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: member?.name ?? "",
    slug: member?.slug ?? "",
    location: member?.location ?? "",
    area: member?.area ?? "",
    capacity: member?.capacity ?? 500,
    type: member?.type ?? "",
    category: member?.category ?? "",
    phone: member?.phone ?? "",
    email: member?.email ?? "",
    website: member?.website ?? "",
    description: member?.description ?? "",
    amenities: member?.amenities?.join(", ") ?? "",
    memberSince: member?.memberSince ?? "",
    featured: member?.featured ?? false,
    image: member?.image ?? "",
  });

  function set(key: string, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      ...form,
      capacity: Number(form.capacity),
      amenities: form.amenities.split(",").map((s) => s.trim()).filter(Boolean),
    };

    const url = member ? `/api/members/${member.id}` : "/api/members";
    const method = member ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Failed to save");
      setSaving(false);
      return;
    }

    router.push("/admin/members");
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
        {field("Name *", "name", "text", "Venue name")}
        {field("Slug *", "slug", "text", "venue-name-slug")}
        {field("Area *", "area", "text", "Teku")}
        {field("Location", "location", "text", "Teku, Kathmandu")}
        {field("Capacity *", "capacity", "number", "500")}
        {field("Category", "category", "text", "Banquet Hall")}
        {field("Type", "type", "text", "Banquet Hall")}
        {field("Phone *", "phone", "text", "9851...")}
        {field("Email", "email", "email")}
        {field("Website", "website", "text", "example.com")}
        {field("Member Since", "memberSince", "text", "2011")}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {field("Amenities (comma-separated)", "amenities", "text", "AC Hall, Parking, Catering")}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
        <ImageUpload value={form.image} onChange={(url) => set("image", url)} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="featured"
          checked={form.featured}
          onChange={(e) => set("featured", e.target.checked)}
          className="rounded"
        />
        <label htmlFor="featured" className="text-sm text-gray-700">Featured member</label>
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
          onClick={() => router.push("/admin/members")}
          className="px-5 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
