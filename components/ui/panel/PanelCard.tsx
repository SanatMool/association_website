"use client";

import { ReactNode } from "react";
import { ACCENTS, Accent } from "./accent";

interface PanelCardProps {
  children: ReactNode;
  variant?: "light" | "glass";
  accent?: Accent;
  className?: string;
  hover?: boolean;
}

/**
 * Shared card shell for admin/portal/platform panels, replacing the ad-hoc
 * `bg-white rounded-xl border border-gray-100` markup duplicated per page.
 *
 * "light" — same layered hover-glow technique as components/ui/MemberCard.tsx
 * (base shadow + a separate sibling div that fades in a colored glow on hover,
 * smoother than a single `hover:shadow-*` class).
 * "glass" — reuses .card-glass from globals.css (already accent-neutral) with
 * an accent-colored hover border.
 */
export default function PanelCard({
  children,
  variant = "light",
  accent = "gold",
  className = "",
  hover = true,
}: PanelCardProps) {
  const a = ACCENTS[accent];

  if (variant === "glass") {
    return (
      <div className={`group relative card-glass ${hover ? a.hoverBorder : ""} transition-colors duration-300 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`group relative bg-white rounded-2xl border border-slate-100/80 ${className}`}
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
    >
      {hover && (
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none z-10"
          style={{ boxShadow: a.hoverGlowRGBA }}
        />
      )}
      <div className="relative z-0">{children}</div>
    </div>
  );
}
