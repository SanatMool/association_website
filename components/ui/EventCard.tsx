"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Clock } from "lucide-react";
import { EventType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  networking: { label: "Networking",  bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400" },
  training:   { label: "Training",    bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400"   },
  meeting:    { label: "Meeting",     bg: "bg-slate-50",  text: "text-slate-600",  dot: "bg-slate-400"  },
  exhibition: { label: "Exhibition",  bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400"  },
  conference: { label: "Conference",  bg: "bg-emerald-50",text: "text-emerald-700",dot: "bg-emerald-400"},
};

const defaultTypeConfig = { label: "Event", bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" };

interface EventCardProps {
  event: EventType;
  compact?: boolean;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function EventCard({ event, compact = false }: EventCardProps) {
  const config = typeConfig[event.type] ?? defaultTypeConfig;
  const isUpcoming = event.status === "upcoming";

  const timeLabel = event.startTime
    ? event.endTime
      ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
      : formatTime(event.startTime)
    : null;

  const CardInner = (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="card overflow-hidden group h-full flex flex-col"
    >
      {/* Color bar + status */}
      <div className={cn(
        "h-1.5",
        isUpcoming
          ? "bg-gradient-to-r from-gold-500 via-gold-400 to-gold-300"
          : "bg-gradient-to-r from-slate-200 to-slate-100"
      )} />

      {/* Image area */}
      <div className={cn(
        "relative h-36 overflow-hidden",
        isUpcoming ? "bg-navy-900" : "bg-slate-100"
      )}>
        {event.image ? (
          <img src={event.image} alt={event.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-contain" />
        ) : (
          <>
            <div className={cn(
              "absolute inset-0",
              isUpcoming
                ? "bg-gradient-to-br from-navy-800 to-navy-950"
                : "bg-gradient-to-br from-slate-200 to-slate-300"
            )} />
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f59e0b' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </>
        )}
        {/* Overlay to keep badges readable over image */}
        {event.image && <div className="absolute inset-0 bg-navy-950/40" />}

        {/* Event type badge */}
        <div className="absolute top-4 left-4">
          <span className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full",
            config.bg, config.text
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
            {config.label}
          </span>
        </div>

        {/* Status badge */}
        <div className="absolute top-4 right-4">
          <span className={cn(
            "text-xs font-bold px-2.5 py-1 rounded-full",
            isUpcoming
              ? "bg-gold-500 text-navy-900"
              : "bg-white/20 text-white/70 backdrop-blur-sm"
          )}>
            {isUpcoming ? "Upcoming" : "Past"}
          </span>
        </div>

        {/* Date overlay */}
        <div className="absolute bottom-4 left-4">
          <span className={cn(
            "inline-flex text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm",
            isUpcoming ? "bg-navy-950/80 text-gold-300" : "bg-navy-950/70 text-white/80"
          )}>
            {formatDate(event.date)}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-serif font-bold text-navy-900 text-[15px] leading-snug mb-2 group-hover:text-navy-700 transition-colors">
          {event.title}
        </h3>

        {!compact && (
          <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
            {event.description}
          </p>
        )}

        <div className="space-y-2 pt-4 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <MapPin size={12} className="text-gold-500 flex-shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          {timeLabel && (
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Clock size={12} className="text-gold-500 flex-shrink-0" />
              <span>{timeLabel}</span>
            </div>
          )}
        </div>

        {isUpcoming && !compact && (
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-gold-600 group-hover:text-gold-500 transition-colors">
            <span>View details</span>
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <Link href={`/events/${event.slug}`} className="block h-full">
      {CardInner}
    </Link>
  );
}
