"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Building2, Calendar } from "lucide-react";
import { CommitteeType } from "@/lib/types";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";

interface Props {
  member: CommitteeType | null;
  onClose: () => void;
}

const avatarColors = [
  "from-blue-600 to-blue-800",
  "from-emerald-600 to-emerald-800",
  "from-purple-600 to-purple-800",
  "from-rose-600 to-rose-800",
  "from-cyan-600 to-cyan-800",
  "from-amber-500 to-amber-700",
];
function getAvatarColor(name: string) {
  let sum = 0;
  for (const c of name) sum += c.charCodeAt(0);
  return avatarColors[sum % avatarColors.length];
}
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const BS_MONTHS = ["", "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];
const AD_MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CommitteeMemberModal({ member, onClose }: Props) {
  const { t, locale } = useLocale();

  // Close on Escape
  useEffect(() => {
    if (!member) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [member, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (member) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [member]);

  const roleLabel = member
    ? (t.committee[member.roleKey as keyof typeof t.committee] || member.role)
    : "";
  const displayName  = member ? (locale === "ne" && member.nameNe  ? member.nameNe  : member.name)  : "";
  const displayVenue = member ? (locale === "ne" && member.venueNe ? member.venueNe : member.venue) : "";
  const isHighlighted = member?.highlighted || (member?.order ?? 99) <= 2;

  // Term label — prefer BS if available, fall back to AD
  let termLabel = "";
  if (member) {
    if (member.termYearBS) {
      const mo = member.termMonthBS ? BS_MONTHS[member.termMonthBS] : null;
      termLabel = mo ? `${mo} ${member.termYearBS} BS` : `${member.termYearBS} BS`;
      if (member.termYearAD) termLabel += ` (${member.termYearAD} AD)`;
    } else if (member.termYearAD) {
      const mo = member.termMonthAD ? AD_MONTHS[member.termMonthAD] : null;
      termLabel = mo ? `${mo} ${member.termYearAD}` : `${member.termYearAD}`;
    }
  }

  return (
    <AnimatePresence>
      {member && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-navy-900/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header strip */}
              <div className={cn(
                "relative px-6 pt-8 pb-6 text-center",
                isHighlighted ? "bg-navy-900" : "bg-gradient-to-b from-slate-50 to-white"
              )}>
                {/* Close button */}
                <button
                  onClick={onClose}
                  className={cn(
                    "absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                    isHighlighted
                      ? "text-white/50 hover:text-white hover:bg-white/10"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <X size={16} />
                </button>

                {/* Gold top bar for highlighted members */}
                {isHighlighted && (
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
                )}

                {/* Avatar */}
                <div className="relative mx-auto mb-4 w-24 h-24">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-2xl object-cover shadow-lg ring-4 ring-white"
                    />
                  ) : (
                    <div className={cn(
                      "w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg ring-4",
                      "bg-gradient-to-br",
                      isHighlighted ? "from-gold-400 to-gold-600 ring-white/20" : `${getAvatarColor(member.name)} ring-white`
                    )}>
                      <span className={cn(
                        "font-serif font-bold text-3xl",
                        isHighlighted ? "text-navy-900" : "text-white"
                      )}>
                        {getInitials(member.name)}
                      </span>
                    </div>
                  )}
                  {isHighlighted && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-gold-500 rounded-full flex items-center justify-center shadow-gold">
                      <span className="text-navy-900 text-xs font-bold">★</span>
                    </div>
                  )}
                </div>

                {/* Name */}
                <h2 className={cn(
                  "font-serif font-bold text-xl leading-snug mb-1",
                  isHighlighted ? "text-white" : "text-navy-900"
                )}>
                  {displayName}
                </h2>
                {member.nameNe && locale !== "ne" && (
                  <p className={cn("text-sm mb-2", isHighlighted ? "text-white/50" : "text-slate-400")}>
                    {member.nameNe}
                  </p>
                )}

                {/* Role badge */}
                <span className={cn(
                  "inline-block text-xs font-semibold px-3 py-1.5 rounded-full",
                  isHighlighted
                    ? "bg-gold-500/20 text-gold-400 border border-gold-500/30"
                    : "bg-navy-50 text-navy-700 border border-navy-100"
                )}>
                  {roleLabel}
                </span>

                {/* Role title if different from roleKey label */}
                {member.role && member.role !== roleLabel && (
                  <p className={cn("text-xs mt-1.5", isHighlighted ? "text-white/40" : "text-slate-400")}>
                    {member.role}
                  </p>
                )}
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">

                {/* Venue + Organization */}
                {(displayVenue || member.organization) && (
                  <div className="space-y-2">
                    {displayVenue && (
                      <div className="flex items-start gap-2.5">
                        <MapPin size={14} className="text-gold-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{displayVenue}</span>
                      </div>
                    )}
                    {member.organization && (
                      <div className="flex items-start gap-2.5">
                        <Building2 size={14} className="text-gold-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{member.organization}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Term */}
                {termLabel && (
                  <div className="flex items-center gap-2.5">
                    <Calendar size={14} className="text-gold-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Elected {termLabel}</span>
                  </div>
                )}

                {/* Divider */}
                {(displayVenue || member.organization || termLabel) && member.bio && (
                  <div className="h-px bg-slate-100" />
                )}

                {/* Bio */}
                {member.bio ? (
                  <p className="text-sm text-slate-600 leading-relaxed">{member.bio}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No biography available.</p>
                )}

                {/* History link */}
                <div className="pt-1">
                  <a
                    href="/committee/history"
                    className="inline-flex items-center gap-1.5 text-xs text-gold-600 hover:text-gold-700 font-medium transition-colors group"
                  >
                    View committee history
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
