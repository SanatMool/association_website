"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Eraser, X, Check } from "lucide-react";

interface Props {
  associationId: string;
  associationSlug: string;
}

const MODULES: { key: string; label: string; hint: string }[] = [
  { key: "members",        label: "Members",           hint: "Unlinks members from this association; deletes any member left with no other references" },
  { key: "applications",   label: "Applications",      hint: "Membership applications" },
  { key: "events",         label: "Events",            hint: "Events, RSVPs, ticket registrations" },
  { key: "news",           label: "News",              hint: "News articles" },
  { key: "committee",      label: "Committee",         hint: "Committee members" },
  { key: "timeline",       label: "Timeline",          hint: "Timeline / history entries" },
  { key: "meetings",       label: "Meetings",          hint: "Meetings, agenda, minutes, RSVPs, attendance" },
  { key: "tasks",          label: "Tasks",             hint: "Admin tasks" },
  { key: "dues",           label: "Dues & Payments",   hint: "Member dues payment records" },
  { key: "financial",      label: "Financial Ledger",  hint: "Journal entries, expenses, financial years/accounts, contributions" },
  { key: "activity",       label: "Activity Log",      hint: "Admin activity log + API request log" },
  { key: "portalAccounts", label: "Portal Accounts",   hint: "Member portal login accounts" },
];

export default function ResetDataButton({ associationId, associationSlug }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Record<string, number> | null>(null);

  const canReset = selected.size > 0 && confirmText.trim() === associationSlug;

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function closeAndReset() {
    setOpen(false);
    setSelected(new Set());
    setConfirmText("");
    setError("");
    setResult(null);
  }

  async function handleReset() {
    if (!canReset) return;
    setResetting(true);
    setError("");
    const res = await fetch(`/api/platform/associations/${associationId}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modules: Array.from(selected), confirmSlug: confirmText.trim() }),
    });
    if (!res.ok) {
      let msg = "Failed to reset data.";
      try { const e = await res.json() as { error?: string }; msg = e.error ?? msg; } catch { /* empty */ }
      setError(msg);
      setResetting(false);
      return;
    }
    const json = await res.json() as { data: Record<string, number> };
    setResult(json.data);
    setResetting(false);
    router.refresh();
  }

  return (
    <>
      <div className="border border-amber-200 rounded-2xl p-5 bg-amber-50/50">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Eraser size={16} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-800">Reset Data</h3>
            <p className="text-xs text-amber-600/80 mt-0.5 mb-3">
              Clear specific content for this association — pick exactly what to wipe. The
              association itself, its domain/branding/settings, and admin logins are never touched.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Eraser size={12} /> Reset Data…
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => !resetting && closeAndReset()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
              style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-amber-600" />
                </div>
                <button onClick={closeAndReset} disabled={resetting} className="text-gray-400 hover:text-gray-700">
                  <X size={16} />
                </button>
              </div>

              {result ? (
                <>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Done — data cleared</h3>
                  <ul className="text-xs text-gray-600 mb-5 space-y-1 bg-gray-50 rounded-xl p-3">
                    {Object.entries(result).map(([key, count]) => (
                      <li key={key} className="flex justify-between">
                        <span>{MODULES.find((m) => m.key === key)?.label ?? key}</span>
                        <span className="font-semibold text-gray-800">{count} deleted</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={closeAndReset}
                    className="w-full py-2.5 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Select what to clear</h3>
                  <p className="text-xs text-gray-500 mb-4">This permanently deletes the selected data. It cannot be undone.</p>

                  <div className="space-y-1.5 mb-4">
                    {MODULES.map(({ key, label, hint }) => {
                      const checked = selected.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggle(key)}
                          className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all
                            ${checked ? "bg-amber-50 border-amber-400" : "bg-white border-gray-200 hover:border-amber-300"}`}
                        >
                          <span className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                            ${checked ? "bg-amber-500 border-amber-500" : "border-gray-300"}`}>
                            {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                          </span>
                          <div>
                            <div className={`text-sm font-semibold ${checked ? "text-amber-800" : "text-gray-700"}`}>{label}</div>
                            <div className="text-[11px] text-gray-400">{hint}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-gray-500 mb-2">
                    Type <span className="font-mono font-semibold text-gray-800">{associationSlug}</span> to confirm:
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={associationSlug}
                    disabled={resetting}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4"
                  />

                  {error && (
                    <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={closeAndReset}
                      disabled={resetting}
                      className="flex-1 py-2.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={!canReset || resetting}
                      className="flex-1 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {resetting ? "Clearing…" : `Clear ${selected.size || ""} Selected`}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
