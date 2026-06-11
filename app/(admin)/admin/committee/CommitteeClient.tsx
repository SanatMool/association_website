"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Archive, X, Info, Loader2, Check, History } from "lucide-react";
import Link from "next/link";

const BS_MONTHS = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik",  "Mangsir", "Poush", "Magh",    "Falgun", "Chaitra",
];
const AD_MONTHS = [
  "January", "February", "March",     "April",   "May",      "June",
  "July",    "August",   "September", "October", "November", "December",
];

interface Props { memberCount: number; }

export default function CommitteeArchiveButton({ memberCount }: Props) {
  const router  = useRouter();
  const [open,  setOpen]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [done,   setDone]  = useState(false);
  const [error,  setError] = useState("");

  const [form, setForm] = useState({
    termYearBS:  "",
    termMonthBS: "",
    termYearAD:  "",
    termMonthAD: "",
  });

  function set(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleArchive() {
    if (!form.termYearBS || !form.termYearAD) {
      setError("Both BS Year and AD Year are required.");
      return;
    }
    setSaving(true); setError("");

    const res = await fetch("/api/committee/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        termYearBS:  Number(form.termYearBS),
        termMonthBS: form.termMonthBS ? Number(form.termMonthBS) : null,
        termYearAD:  Number(form.termYearAD),
        termMonthAD: form.termMonthAD ? Number(form.termMonthAD) : null,
      }),
    });

    const json = await res.json() as { success: boolean; data?: { archived: number }; error?: string };
    setSaving(false);

    if (!json.success) {
      setError(json.error ?? "Archive failed. Please try again.");
      return;
    }

    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
      router.refresh();
    }, 1800);
  }

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition";

  return (
    <>
      <div className="flex items-center gap-2">
        <Link
          href="/admin/committee/history"
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <History size={13} /> Past Committees
        </Link>
        <button
          type="button"
          onClick={() => { setOpen(true); setError(""); setDone(false); }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
        >
          <Archive size={13} /> Archive Committee
        </button>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1,    opacity: 1, y: 0  }}
              exit={{    scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl"><Archive size={18} className="text-amber-600" /></div>
                  <div>
                    <h2 className="font-bold text-gray-900">Archive Committee</h2>
                    <p className="text-xs text-gray-400">{memberCount} member{memberCount !== 1 ? "s" : ""} will be archived</p>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {done ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check size={24} className="text-emerald-600" />
                    </div>
                    <p className="font-semibold text-gray-900">Committee archived!</p>
                    <p className="text-sm text-gray-400 text-center">
                      All members have been moved to the history. You can now add the new committee.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
                      <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        This will mark all <strong>{memberCount} current committee members</strong> as archived and move them
                        to the history page. Enter the year they were <em>elected</em> (not when they are being archived).
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">BS Year *</label>
                        <input
                          type="number"
                          value={form.termYearBS}
                          onChange={(e) => set("termYearBS", e.target.value)}
                          placeholder="e.g. 2082"
                          className={inputCls}
                        />
                        <p className="text-[11px] text-gray-400 mt-1">Bikram Sambat election year</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">BS Month</label>
                        <select value={form.termMonthBS} onChange={(e) => set("termMonthBS", e.target.value)} className={inputCls}>
                          <option value="">— month —</option>
                          {BS_MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">AD Year *</label>
                        <input
                          type="number"
                          value={form.termYearAD}
                          onChange={(e) => set("termYearAD", e.target.value)}
                          placeholder="e.g. 2025"
                          className={inputCls}
                        />
                        <p className="text-[11px] text-gray-400 mt-1">Anno Domini election year</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">AD Month</label>
                        <select value={form.termMonthAD} onChange={(e) => set("termMonthAD", e.target.value)} className={inputCls}>
                          <option value="">— month —</option>
                          {AD_MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                        </select>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                        <Info size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-600">{error}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              {!done && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                  <button type="button" onClick={() => setOpen(false)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleArchive}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
                  >
                    {saving
                      ? <><Loader2 size={14} className="animate-spin" /> Archiving…</>
                      : <><Archive size={14} /> Archive {memberCount} Members</>}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
