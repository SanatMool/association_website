"use client";

import { LucideIcon } from "lucide-react";
import { useCountUp } from "./useCountUp";
import { ACCENTS, Accent } from "./accent";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon?: LucideIcon;
  accent?: Accent;
  sublabel?: string;
  href?: string;
  animate?: boolean;
  raw?: string; // bypasses the count-up entirely for composite values like "24 / 25"
}

function formatValue(count: number, target: number) {
  if (target >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
}

/**
 * Dashboard stat tile shared across admin/portal/platform, built on the same
 * recipe as components/sections/StatsSection.tsx / Hero.tsx: translucent glass
 * tile, growing accent line on hover, count-up numeral.
 */
export default function StatCard({ label, value, suffix = "", icon: Icon, accent = "gold", sublabel, animate = true, raw }: StatCardProps) {
  const a = ACCENTS[accent];
  const { count, ref } = useCountUp(value);
  const display = raw ?? (animate ? formatValue(count, value) : formatValue(value, value));

  return (
    <div
      className={`group relative bg-white/[0.04] backdrop-blur-sm border border-white/10 ${a.hoverBorder} rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300`}
    >
      {/* Growing accent line on hover */}
      <div
        className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-16 transition-all duration-500"
        style={{ background: a.buttonGradient }}
      />
      {Icon && (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{ background: a.iconBg, border: a.iconBorder }}
        >
          <Icon size={17} className={a.solidText} />
        </div>
      )}
      <span ref={ref} className="block font-serif font-bold text-3xl sm:text-4xl text-white leading-none">
        {display}
        {suffix}
      </span>
      <div className="text-white/40 text-[11px] uppercase tracking-wider mt-2">{label}</div>
      {sublabel && <div className="text-white/25 text-[11px] mt-1">{sublabel}</div>}
    </div>
  );
}
