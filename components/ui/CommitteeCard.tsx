"use client";

import { motion } from "framer-motion";
import { CommitteeMember } from "@/data/committee";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";

interface CommitteeCardProps {
  member: CommitteeMember;
  highlighted?: boolean;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Deterministic color from name
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

export default function CommitteeCard({ member, highlighted = false }: CommitteeCardProps) {
  const { t } = useLocale();

  const roleLabel =
    t.committee[member.roleKey as keyof typeof t.committee] || member.role;
  const avatarGrad = highlighted ? "from-gold-400 to-gold-600" : getAvatarColor(member.name);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={cn(
        "rounded-2xl p-6 text-center transition-all duration-300 group relative overflow-hidden",
        highlighted
          ? "bg-navy-900 border border-gold-500/30 shadow-navy"
          : "card card-hover"
      )}
    >
      {/* Subtle top border gradient for highlighted */}
      {highlighted && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
      )}

      {/* Avatar */}
      <div className="relative mx-auto mb-4 w-[72px] h-[72px]">
        <div className={cn(
          "w-[72px] h-[72px] rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-md",
          avatarGrad
        )}>
          <span className={cn(
            "font-serif font-bold text-xl",
            highlighted ? "text-navy-900" : "text-white"
          )}>
            {getInitials(member.name)}
          </span>
        </div>

        {highlighted && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center shadow-gold"
          >
            <span className="text-navy-900 text-[10px] font-bold">★</span>
          </motion.div>
        )}
      </div>

      {/* Name */}
      <h3 className={cn(
        "font-serif font-bold text-[15px] leading-snug mb-1.5",
        highlighted ? "text-white" : "text-navy-900"
      )}>
        {member.name}
      </h3>

      {/* Role badge */}
      <span className={cn(
        "inline-block text-[11px] font-semibold px-3 py-1 rounded-full mb-2",
        highlighted
          ? "bg-gold-500/20 text-gold-400 border border-gold-500/30"
          : "bg-navy-50 text-navy-700 border border-navy-100"
      )}>
        {roleLabel}
      </span>

      {/* Venue */}
      {member.venue && (
        <p className={cn(
          "text-xs mt-1 leading-relaxed",
          highlighted ? "text-white/45" : "text-slate-400"
        )}>
          {member.venue}
        </p>
      )}
    </motion.div>
  );
}
