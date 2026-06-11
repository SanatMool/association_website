"use client";

import { useState } from "react";
import { Zap, RotateCcw, Save, AlertTriangle, CheckCircle } from "lucide-react";

interface Props {
  associationId: string;
  initial: { used: number; limit: number; remaining: number; date: string; enabled: boolean };
}

export default function AiQuotaManager({ associationId, initial }: Props) {
  const [quota, setQuota]       = useState(initial);
  const [enabled, setEnabled]   = useState(initial.enabled);
  const [newLimit, setNewLimit] = useState(String(initial.limit));
  const [working, setWorking]   = useState(false);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function toggleEnabled() {
    setWorking(true);
    const next = !enabled;
    const res  = await fetch(`/api/platform/associations/${associationId}/ai-quota`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_enabled", enabled: next }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    setWorking(false);
    if (!json.success) { showToast(json.error ?? "Failed", false); return; }
    setEnabled(next);
    showToast(next ? "AI generation enabled" : "AI generation disabled", next);
  }

  async function setLimit() {
    const limit = parseInt(newLimit, 10);
    if (!Number.isInteger(limit) || limit < 0) { showToast("Enter a valid number (0 or more)", false); return; }
    setWorking(true);
    const res  = await fetch(`/api/platform/associations/${associationId}/ai-quota`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_limit", limit }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    setWorking(false);
    if (!json.success) { showToast(json.error ?? "Failed", false); return; }
    setQuota((q) => ({ ...q, limit, remaining: Math.max(0, limit - q.used) }));
    showToast(`Daily limit updated to ${limit}`, true);
  }

  async function resetToday() {
    setWorking(true);
    const res  = await fetch(`/api/platform/associations/${associationId}/ai-quota`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_today" }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    setWorking(false);
    if (!json.success) { showToast(json.error ?? "Failed", false); return; }
    setQuota((q) => ({ ...q, used: 0, remaining: q.limit }));
    showToast("Today's usage reset to 0", true);
  }

  const pct = quota.limit > 0 ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0;
  const barColor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Zap size={15} className="text-amber-500" />
        <h2 className="font-semibold text-gray-900">AI Generation</h2>
        <span className="ml-auto text-xs text-gray-400">{quota.date}</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Toast */}
        {toast && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${toast.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {toast.ok ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
            {toast.msg}
          </div>
        )}

        {/* Enable / Disable toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/60">
          <div>
            <p className="text-sm font-medium text-gray-800">AI Generation Access</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {enabled ? "Enabled — this association can use AI features" : "Disabled — all AI requests are blocked"}
            </p>
          </div>
          <button
            onClick={toggleEnabled}
            disabled={working}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${enabled ? "bg-emerald-500" : "bg-gray-300"}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Usage bar — only shown when enabled */}
        <div className={!enabled ? "opacity-40 pointer-events-none" : ""}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500 font-medium">Today&apos;s usage</span>
            <span className="font-bold text-gray-900">{quota.used} / {quota.limit}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs mt-1.5">
            <span className="text-gray-400">{pct}% used</span>
            <span className={quota.remaining === 0 ? "text-red-500 font-semibold" : "text-gray-400"}>
              {quota.remaining} remaining
            </span>
          </div>
        </div>

        {/* Set limit */}
        <div className={!enabled ? "opacity-40 pointer-events-none" : ""}>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Daily limit (generations/day)</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="50"
            />
            <button
              onClick={setLimit}
              disabled={working}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save size={12} /> Save
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Set to 0 to disable AI generation for this association.</p>
        </div>

        {/* Reset */}
        <div className={`pt-1 border-t border-gray-100 ${!enabled ? "opacity-40 pointer-events-none" : ""}`}>
          <button
            onClick={resetToday}
            disabled={working || quota.used === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw size={12} /> Reset today&apos;s count
          </button>
          <p className="text-xs text-gray-400 mt-1">Resets today&apos;s usage back to 0. Use if the association hit their limit due to testing.</p>
        </div>
      </div>
    </div>
  );
}
