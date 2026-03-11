"use client";

import Link from "next/link";
import { MapPin, Phone, Globe, ArrowRight, Building2, Star, Users } from "lucide-react";
import { motion } from "framer-motion";
import { MemberType } from "@/lib/types";
import { useLocale } from "@/context/LocaleContext";

interface MemberCardProps {
  member: MemberType;
  index?: number;
}

// Capacity tier configuration
function getTierConfig(capacity: number) {
  if (capacity >= 1000) return {
    label: "Grand",
    badge: "bg-gold-500 text-navy-900",
    gradient: "linear-gradient(135deg, #0a1040 0%, #1a237e 40%, #0d1654 100%)",
    accentColor: "#f59e0b",
    barColor: "bg-gold-500",
    textColor: "text-gold-300",
  };
  if (capacity >= 700) return {
    label: "Large",
    badge: "bg-blue-600 text-white",
    gradient: "linear-gradient(135deg, #1e3a5f 0%, #1a365d 40%, #0f2744 100%)",
    accentColor: "#60a5fa",
    barColor: "bg-blue-500",
    textColor: "text-blue-300",
  };
  if (capacity >= 400) return {
    label: "Medium",
    badge: "bg-emerald-600 text-white",
    gradient: "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #034d3a 100%)",
    accentColor: "#34d399",
    barColor: "bg-emerald-500",
    textColor: "text-emerald-300",
  };
  return {
    label: "Intimate",
    badge: "bg-purple-600 text-white",
    gradient: "linear-gradient(135deg, #3b0764 0%, #4a1272 40%, #2d0550 100%)",
    accentColor: "#a78bfa",
    barColor: "bg-purple-500",
    textColor: "text-purple-300",
  };
}

// SVG pattern per category
const PATTERNS: Record<string, string> = {
  default:
    "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")",
  dots:
    "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='2' fill='%23ffffff' fill-opacity='0.07'/%3E%3C/svg%3E\")",
  grid:
    "url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h32v1H0zM0 0v32h1V0z' fill='%23ffffff' fill-opacity='0.05'/%3E%3C/svg%3E\")",
};

const categoryPattern = (category: string) => {
  if (category.includes("Wedding")) return PATTERNS.dots;
  if (category.includes("Convention") || category.includes("Conference")) return PATTERNS.grid;
  return PATTERNS.default;
};

export default function MemberCard({ member, index = 0 }: MemberCardProps) {
  const { t } = useLocale();
  const tier = getTierConfig(member.capacity);
  const fillPct = Math.min(100, Math.round((member.capacity / 1200) * 100));
  const pattern = categoryPattern(member.category ?? "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.5) }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="relative bg-white rounded-2xl overflow-hidden group cursor-pointer border border-slate-100/80"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
    >
      {/* Gold glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none z-10"
        style={{ boxShadow: "0 12px 48px rgba(10,16,64,0.18), 0 0 0 1.5px rgba(245,158,11,0.3)" }}
      />

      {/* ── Image / visual area ── */}
      <div
        className="relative h-44 overflow-hidden"
        style={{ background: tier.gradient }}
      >
        {/* Pattern overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundImage: pattern }}
        />

        {/* Ambient glow in center */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 120%, ${tier.accentColor}18 0%, transparent 65%)`,
          }}
        />

        {/* Shine sweep on hover */}
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          whileHover={{ x: "200%", opacity: 1 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.08) 50%, transparent 65%)",
          }}
        />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.04, 1], opacity: [0.15, 0.22, 0.15] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Building2 size={80} className="text-white" strokeWidth={0.7} />
          </motion.div>
        </div>

        {/* Top badges row */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
          {/* Tier badge */}
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${tier.badge}`}>
            {tier.label}
          </span>
          {/* Featured badge */}
          {member.featured && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/15 text-white border border-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Star size={9} className="fill-gold-400 text-gold-400" />
              Featured
            </span>
          )}
        </div>

        {/* Capacity overlay — bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8 z-10" style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)"
        }}>
          <div className="flex items-end justify-between">
            <div>
              <div className={`font-serif font-bold text-2xl leading-none ${tier.textColor}`}>
                {member.capacity.toLocaleString()}
              </div>
              <div className="text-white/50 text-[10px] font-medium tracking-wide uppercase mt-0.5">
                Guest Capacity
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/60 text-[10px] uppercase tracking-wider">{member.category}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom content ── */}
      <div className="p-5">
        {/* Name */}
        <h3 className="font-serif font-bold text-navy-900 text-[15px] leading-tight mb-1 group-hover:text-navy-700 transition-colors line-clamp-1">
          {member.name}
        </h3>

        {/* Location + phone */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <MapPin size={11} className="text-gold-500 flex-shrink-0" />
            <span className="truncate">{member.location}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Phone size={11} className="text-gold-500 flex-shrink-0" />
            <a
              href={`tel:${member.phone}`}
              className="hover:text-navy-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {member.phone}
            </a>
          </div>
          {member.website && (
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Globe size={11} className="text-gold-500 flex-shrink-0" />
              <a
                href={`https://${member.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-navy-700 transition-colors truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {member.website}
              </a>
            </div>
          )}
        </div>

        {/* Capacity bar */}
        <div className="mb-4">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.9, delay: Math.min(index * 0.04, 0.5) + 0.3, ease: "easeOut" }}
              className={`h-full rounded-full ${tier.barColor}`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Users size={10} />
            <span>Since <span className="font-medium text-slate-500">{member.memberSince}</span></span>
          </div>
          <Link
            href={`/members/${member.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-navy-700 hover:text-gold-600 transition-colors group/link"
            onClick={(e) => e.stopPropagation()}
          >
            {t.members.view_profile}
            <ArrowRight size={11} className="group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
