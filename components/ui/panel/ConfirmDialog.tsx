"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable animated confirm modal. Presentational only — pages still own their
 * own `confirmDeleteId`-style state (per project rule: window.confirm() is
 * banned); this just replaces each page's hand-rolled inline confirmation
 * markup with one consistent, animated version.
 */
export default function ConfirmDialog({
  open, title, message, confirmLabel = "Delete", cancelLabel = "Cancel",
  danger = true, loading = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${danger ? "bg-red-50" : "bg-amber-50"}`}>
              <AlertTriangle size={18} className={danger ? "text-red-600" : "text-amber-600"} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{title}</h3>
            {message && <p className="text-xs text-gray-500 mb-5 leading-relaxed">{message}</p>}
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 text-xs font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${
                  danger ? "bg-red-600 hover:bg-red-500" : "bg-navy-900 hover:bg-navy-800"
                }`}
              >
                {loading ? "…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
