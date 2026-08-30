"use client";

import { useState } from "react";
import { Upload, X, AlertCircle } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // keep in sync with app/api/upload/route.ts

export default function ImageUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check client-side first — instant feedback instead of waiting on a round-trip only to
    // get the same answer back from the server (or a raw, unhelpful 413 from nginx).
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB) — max 5MB.`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        if (res.status === 413) throw new Error("TOO_LARGE");
        throw new Error();
      }
      const { url } = await res.json() as { url?: string };
      if (!url) throw new Error();
      onChange(url);
    } catch (err) {
      setError(
        err instanceof Error && err.message === "TOO_LARGE"
          ? "Image is too large — max 5MB."
          : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className="rounded-lg object-contain bg-navy-900 border border-gray-200"
            style={{ width: 200, height: 120 }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <div className="flex gap-2 items-center">
        <label className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Upload size={14} />
          {uploading ? "Uploading…" : "Upload image"}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        <span className="text-xs text-gray-400">or</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste image URL"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>
      {error && (
        <p className="text-[11px] text-red-500 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
      <p className="text-[10px] text-gray-400">Max 5MB — automatically compressed on upload.</p>
    </div>
  );
}
