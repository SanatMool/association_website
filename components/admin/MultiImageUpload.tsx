"use client";

import { useState } from "react";
import { Upload, X, AlertCircle } from "lucide-react";

interface Props {
  values: string[];
  onChange: (values: string[]) => void;
  max: number;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // keep in sync with app/api/upload/route.ts

export default function MultiImageUpload({ values, onChange, max }: Props) {
  const [uploadingTotal, setUploadingTotal] = useState(0);
  const [uploadingDone, setUploadingDone] = useState(0);
  const [errors, setErrors] = useState<{ name: string; message: string }[]>([]);
  const [urlInput, setUrlInput] = useState("");

  const remaining = max - values.length;
  const uploading = uploadingTotal > 0;

  function remove(i: number) {
    onChange(values.filter((_, idx) => idx !== i));
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.length === 0) return;

    const truncated = selected.length > remaining;
    const files = selected.slice(0, remaining);

    setErrors(truncated ? [{ name: "", message: `Only added the first ${remaining} — gallery is full.` }] : []);
    setUploadingTotal(files.length);
    setUploadingDone(0);

    // Accumulate locally instead of reading the `values` prop each iteration — it stays
    // stale for the whole batch (this component doesn't re-render mid-loop), so building
    // off it directly would make each successive upload overwrite the ones before it.
    const next = [...values];

    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        setErrors((prev) => [...prev, { name: file.name, message: `Too large (${(file.size / 1024 / 1024).toFixed(1)}MB) — max 5MB.` }]);
        setUploadingDone((d) => d + 1);
        continue;
      }
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error(res.status === 413 ? "TOO_LARGE" : "FAILED");
        const { url } = (await res.json()) as { url?: string };
        if (!url) throw new Error("FAILED");
        next.push(url);
        onChange([...next]);
      } catch (err) {
        const msg = err instanceof Error && err.message === "TOO_LARGE" ? "Too large — max 5MB." : "Upload failed.";
        setErrors((prev) => [...prev, { name: file.name, message: msg }]);
      } finally {
        setUploadingDone((d) => d + 1);
      }
    }

    setUploadingTotal(0);
    setUploadingDone(0);
  }

  function addUrl() {
    const url = urlInput.trim();
    if (!url || remaining <= 0) return;
    onChange([...values, url]);
    setUrlInput("");
  }

  return (
    <div className="space-y-3">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {values.map((v, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v}
                alt={`Image ${i + 1}`}
                className="rounded-lg object-cover bg-navy-900 border border-gray-200"
                style={{ width: 96, height: 96 }}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                title="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <div className="flex gap-2 items-center flex-wrap">
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload size={14} />
            {uploading ? `Uploading ${uploadingDone + 1} of ${uploadingTotal}…` : `Add images (up to ${remaining})`}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
          </label>
          <span className="text-xs text-gray-400">or</span>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="Paste image URL, press Enter"
            className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-[11px] text-red-500 flex items-center gap-1">
              <AlertCircle size={10} /> {err.name ? `${err.name} — ${err.message}` : err.message}
            </p>
          ))}
        </div>
      )}

      <p className="text-[10px] text-gray-400">
        {values.length}/{max} added — select multiple files at once, max 5MB each, automatically compressed on upload.
      </p>
    </div>
  );
}
