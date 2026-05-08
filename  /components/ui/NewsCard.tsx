"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { NewsType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const categoryConfig: Record<string, { label: string; bg: string; text: string; bar: string }> = {
  announcement: { label: "Announcement", bg: "bg-blue-50",   text: "text-blue-700",   bar: "from-blue-500 to-blue-400"    },
  training:     { label: "Training",     bg: "bg-emerald-50",text: "text-emerald-700", bar: "from-emerald-500 to-emerald-400"},
  event:        { label: "Event",        bg: "bg-amber-50",  text: "text-amber-700",   bar: "from-gold-500 to-gold-400"    },
  industry:     { label: "Industry",     bg: "bg-purple-50", text: "text-purple-700",  bar: "from-purple-500 to-purple-400"},
  member:       { label: "Member",       bg: "bg-rose-50",   text: "text-rose-700",    bar: "from-rose-500 to-rose-400"    },
};

const defaultCategoryConfig = { label: "News", bg: "bg-gray-50", text: "text-gray-700", bar: "from-gray-400 to-gray-300" };

interface NewsCardProps {
  item: NewsType;
  compact?: boolean;
}

export default function NewsCard({ item, compact = false }: NewsCardProps) {
  const config = categoryConfig[item.category] ?? defaultCategoryConfig;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="card overflow-hidden group h-full flex flex-col"
    >
      {/* Color bar */}
      <div className={cn("h-1 bg-gradient-to-r", config.bar)} />

      <div className="p-6 flex flex-col flex-1">
        {/* Meta row */}
        <div className="flex items-center gap-2.5 mb-4">
          <span className={cn(
            "inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize",
            config.bg, config.text
          )}>
            {config.label}
          </span>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Calendar size={11} />
            {formatDate(item.date)}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-serif font-bold text-navy-900 text-[15px] leading-snug mb-3 group-hover:text-navy-700 transition-colors flex-1">
          {item.title}
        </h3>

        {!compact && (
          <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-3">
            {item.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <span className="text-xs text-slate-400 font-medium">{item.author}</span>
          <Link
            href={`/news/${item.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-700 hover:text-gold-600 transition-colors group/link"
          >
            Read more
            <ArrowRight
              size={12}
              className="group-hover/link:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
