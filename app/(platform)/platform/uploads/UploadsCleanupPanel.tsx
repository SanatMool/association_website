"use client";

import { useState } from "react";
import { HardDrive, Search, Trash2, AlertCircle, Loader2, CheckCircle } from "lucide-react";

interface ScanResult {
  deleted: string[];
  freedBytes: number;
  totalFiles: number;
  skippedTooRecent: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function UploadsCleanupPanel() {
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ScanResult | null>(null);
  const [deletedResult, setDeletedResult] = useState<ScanResult | null>(null);

  async function runScan() {
    setScanning(true);
    setError("");
    setDeletedResult(null);
    try {
      const res = await fetch("/api/platform/uploads-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true }),
      });
      const json = await res.json() as { success: boolean; data?: ScanResult; error?: string };
      if (!json.success || !json.data) throw new Error(json.error ?? "Scan failed");
      setPreview(json.data);
    } catch {
      setError("Couldn't scan uploads. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  async function runDelete() {
    if (!preview || preview.deleted.length === 0) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/platform/uploads-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false }),
      });
      const json = await res.json() as { success: boolean; data?: ScanResult; error?: string };
      if (!json.success || !json.data) throw new Error(json.error ?? "Cleanup failed");
      setDeletedResult(json.data);
      setPreview(null);
    } catch {
      setError("Couldn't delete files. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <HardDrive size={18} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Unused Uploads Cleanup</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Scans every association&apos;s member, event, news, committee, and branding images, then finds files in <code className="text-xs bg-gray-100 px-1 rounded">public/uploads</code> that
            nothing references anymore — left behind after an image was removed or replaced. Files uploaded in the last 24 hours are always skipped, in case they&apos;re part of an unsaved form.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {deletedResult && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          <CheckCircle size={14} />
          Deleted {deletedResult.deleted.length} file{deletedResult.deleted.length !== 1 ? "s" : ""}, freed {formatBytes(deletedResult.freedBytes)}.
        </div>
      )}

      {!preview ? (
        <button
          onClick={runScan}
          disabled={scanning}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
        >
          {scanning ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          {scanning ? "Scanning…" : "Scan for unused images"}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-gray-900">{preview.totalFiles}</div>
              <div className="text-xs text-gray-400 mt-0.5">Total files</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-amber-700">{preview.deleted.length}</div>
              <div className="text-xs text-amber-600 mt-0.5">Unused</div>
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

          {preview.deleted.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing to clean up right now.</p>
          ) : (
            <>
              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                {preview.deleted.map((f) => (
                  <div key={f} className="px-3 py-1.5 text-xs text-gray-500 font-mono truncate">{f}</div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={runDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  {deleting ? "Deleting…" : `Delete ${preview.deleted.length} file${preview.deleted.length !== 1 ? "s" : ""}`}
                </button>
                <button
                  onClick={() => setPreview(null)}
                  disabled={deleting}
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
