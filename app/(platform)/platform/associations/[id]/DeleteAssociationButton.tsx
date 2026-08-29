"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface Props {
  associationId: string;
  associationName: string;
  associationSlug: string;
  counts: { members: number; events: number; news: number; committee: number; admins: number };
}

export default function DeleteAssociationButton({ associationId, associationName, associationSlug, counts }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const canDelete = confirmText.trim() === associationSlug;

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError("");
    const res = await fetch(`/api/platform/associations/${associationId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmSlug: confirmText.trim() }),
    });
    if (!res.ok) {
      let msg = "Failed to delete association.";
      try { const e = await res.json() as { error?: string }; msg = e.error ?? msg; } catch { /* empty */ }
      setError(msg);
      setDeleting(false);
      return;
    }
    router.push("/platform/associations");
    router.refresh();
  }

  return (
    <>
      <div className="border border-red-200 rounded-2xl p-5 bg-red-50/50">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800">Danger Zone</h3>
            <p className="text-xs text-red-600/80 mt-0.5 mb-3">
              Permanently deletes this association and all its data — members, events, news, committee,
              meetings, dues, financial records, tickets, admin logins, and settings. This cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 size={12} /> Delete Association
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => !deleting && setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-red-600" />
                </div>
                <button onClick={() => setOpen(false)} disabled={deleting} className="text-gray-400 hover:text-gray-700">
                  <X size={16} />
                </button>
              </div>

              <h3 className="text-sm font-bold text-gray-900 mb-1">Delete &quot;{associationName}&quot;?</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                This permanently deletes:
              </p>
              <ul className="text-xs text-gray-600 mb-4 space-y-1 bg-gray-50 rounded-xl p-3">
                <li>{counts.members} member{counts.members !== 1 ? "s" : ""}</li>
                <li>{counts.events} event{counts.events !== 1 ? "s" : ""}</li>
                <li>{counts.news} news article{counts.news !== 1 ? "s" : ""}</li>
                <li>{counts.committee} committee member{counts.committee !== 1 ? "s" : ""}</li>
                <li>{counts.admins} admin login{counts.admins !== 1 ? "s" : ""}</li>
                <li>All meetings, dues, financial records, tickets, and settings for this association</li>
              </ul>
              <p className="text-xs text-gray-500 mb-2">
                Type <span className="font-mono font-semibold text-gray-800">{associationSlug}</span> to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={associationSlug}
                disabled={deleting}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
              />

              {error && (
                <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  disabled={deleting}
                  className="flex-1 py-2.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!canDelete || deleting}
                  className="flex-1 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting…" : "Permanently Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
