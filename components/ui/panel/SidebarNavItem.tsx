"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ACCENTS, Accent } from "./accent";

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  accent?: Accent;
  collapsed?: boolean;
  badge?: number;
  layoutId: string; // shared across a nav list so Framer Motion can animate the active indicator between items
}

/**
 * Shared sidebar nav link for admin/portal/platform, with a Framer Motion
 * `layoutId` active-indicator that slides smoothly between items instead of
 * an instant class swap.
 */
export default function SidebarNavItem({ href, label, icon: Icon, active, accent = "gold", collapsed = false, badge, layoutId }: SidebarNavItemProps) {
  const a = ACCENTS[accent];

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? "text-white" : "text-white/55 hover:text-white/90 hover:bg-white/5"
      }`}
    >
      {active && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-0 rounded-lg"
          style={{ background: a.iconBg, border: a.iconBorder }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <Icon size={16} className={`relative z-10 flex-shrink-0 ${active ? a.solidText : ""}`} />
      {!collapsed && <span className="relative z-10 truncate">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className={`relative z-10 ml-auto text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${a.solidText} bg-white/10`}>
          {badge}
        </span>
      )}
    </Link>
  );
}
