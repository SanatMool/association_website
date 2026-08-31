"use client";

import { useState } from "react";
import { Copy, Search, Merge, AlertCircle, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

interface DuplicateGroup {
  hash: string;
  files: string[];
  canonical: string;
  merged: string[];
  referencesRewritten: number;
  associationNames: string[];
}

interface SkippedGroup {
  hash: string;
  files: string[];
  associationNames: string[];
}

interface DedupResult {
  merged: DuplicateGroup[];
  skippedCrossTenant: SkippedGroup[];
  skippedTooRecent: number;
  freedBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DuplicateUploadsPanel() {
  const [scanning, setScanning] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<DedupResult | null>(null);
  const [mergedResult, setMergedResult] = useState<DedupResult | null>(null);

  async function runScan() {
    setScanning(true);
    setError("");
    setMergedResult(null);
    try {
      const res = await fetch("/api/platform/uploads-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true, mode: "duplicates" }),
      });
      const json = await res.json() as { success: boolean; data?: DedupResult; error?: string };
      if (!json.success || !json.data) throw new Error(json.error ?? "Scan failed");
      setPreview(json.data);
    } catch {
      setError("Couldn't scan for duplicates. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  async function runMerge() {
    if (!preview || preview.merged.length === 0) return;
    setMerging(true);
    setError("");
    try {
      const res = await fetch("/api/platform/uploads-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false, mode: "duplicates" }),
      });
      const json = await res.json() as { success: boolean; data?: DedupResult; error?: string };
      if (!json.success || !json.data) throw new Error(json.error ?? "Merge failed");
      setMergedResult(json.data);
      setPreview(null);
    } catch {
      setError("Couldn't merge duplicates. Please try again.");
    } finally {
      setMerging(false);
    }
  }

  const duplicateFileCount = (r: DedupResult) => r.merged.reduce((sum, g) => sum + g.merged.length, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
          <Copy size={18} className="text-purple-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Duplicate Images</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Finds byte-identical files uploaded more than once (e.g. the same photo used for a logo and a member image), keeps one copy, and repoints every record that referenced a duplicate to it before deleting the extra copies. Only merges when every reference belongs to the same association — files shared identically across different associations are left alone and listed separately.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {mergedResult && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          <CheckCircle size={14} />
          Merged {duplicateFileCount(mergedResult)} duplicate file{duplicateFileCount(mergedResult) !== 1 ? "s" : ""} into {mergedResult.merged.length} canonical file{mergedResult.merged.length !== 1 ? "s" : ""}, freed {formatBytes(mergedResult.freedBytes)}.
        </div>
      )}

      {!preview ? (
        <button
          onClick={runScan}
          disabled={scanning}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
        >
          {scanning ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          {scanning ? "Scanning…" : "Scan for duplicate images"}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-gray-900">{preview.merged.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Duplicate groups</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-amber-700">{duplicateFileCount(preview)}</div>
              <div className="text-xs text-amber-600 mt-0.5">Files to remove</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-gray-900">{formatBytes(preview.freedBytes)}</div>
              <div className="text-xs text-gray-400 mt-0.5">Would free</div>
            </div>
          </div>

          {preview.skippedTooRecent > 0 && (
            <p className="text-xs text-gray-400">
              {preview.skippedTooRecent} file{preview.skippedTooRecent !== 1 ? "s" : ""} skipped — uploaded in the last 24 hours.
            </p>
          )}

          {preview.skippedCrossTenant.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <div>
                {preview.skippedCrossTenant.length} duplicate group{preview.skippedCrossTenant.length !== 1 ? "s" : ""} skipped — same file referenced by different associations ({preview.skippedCrossTenant.map((g) => g.associationNames.join(", ")).join("; ")}). Not merged automatically.
              </div>
            </div>
          )}

          {preview.merged.length === 0 ? (
            <p className="text-sm text-gray-500">No mergeable duplicates found right now.</p>
          ) : (
            <>
              <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                {preview.merged.map((g) => (
                  <div key={g.hash} className="px-3 py-2 text-xs">
                    <div className="text-gray-600">
                      Keep <span className="font-mono text-gray-800">{g.canonical}</span>
                      {g.associationNames.length > 0 && <span className="text-gray-400"> — {g.associationNames.join(", ")}</span>}
                    </div>
                    {g.merged.map((f) => (
                      <div key={f} className="text-gray-400 font-mono truncate pl-3">→ delete {f}</div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={runMerge}
                  disabled={merging}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {merging ? <Loader2 size={15} className="animate-spin" /> : <Merge size={15} />}
                  {merging ? "Merging…" : `Merge ${duplicateFileCount(preview)} file${duplicateFileCount(preview) !== 1 ? "s" : ""}`}
                </button>
                <button
                  onClick={() => setPreview(null)}
                  disabled={merging}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
