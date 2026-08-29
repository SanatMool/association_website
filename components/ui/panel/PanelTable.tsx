"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Shared table shell/chrome for admin list pages — replaces the repeated
 * `bg-white rounded-xl border border-gray-100` / `bg-gray-50 border-b` outer
 * markup duplicated per list-client component. Each page keeps its own
 * columns/sorting/filtering logic; this only wraps the frame and adds a
 * consistent row-hover + mount stagger.
 */
export function PanelTable({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100/80 overflow-hidden ${className}`} style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
      {children}
    </div>
  );
}

export function PanelTableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50/80 border-b border-slate-100">{children}</thead>;
}

export function PanelTableRow({ children, index = 0, className = "", onClick }: { children: ReactNode; index?: number; className?: string; onClick?: () => void }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 12) * 0.02 }}
      onClick={onClick}
      className={`hover:bg-slate-50/70 transition-colors ${className}`}
    >
      {children}
    </motion.tr>
  );
}
