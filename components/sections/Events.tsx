"use client";

import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Clock, Tag, Zap } from "lucide-react";
import { events, Event } from "@/data/events";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLocale } from "@/context/LocaleContext";
import { motion } from "framer-motion";
import { formatDate, formatDay, formatMonthShort, formatMonthYear } from "@/lib/utils";

const typeConfig: Record<Event["type"], { color: string; bg: string; icon: string }> = {
  networking: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: "🤝" },
  training: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: "📚" },
  meeting: { color: "text-slate-700", bg: "bg-slate-50 border-slate-200", icon: "🏛️" },
  exhibition: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "🎪" },
  conference: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: "🎤" },
};

function UpcomingEventCard({ event, index }: { event: Event; index: number }) {
  const cfg = typeConfig[event.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: "0 8px 40px rgba(245,158,11,0.12), 0 0 0 1.5px rgba(245,158,11,0.2)" }}
      />

      {/* Gold top line */}
      <div className="h-1 bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500" />

      <div className="p-6">
        {/* Date badge + status */}
        <div className="flex items-start justify-between gap-3 mb-5">
          {/* Calendar block */}
          <div className="flex-shrink-0 w-14 h-14 bg-navy-900 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-gold-400 text-xs font-bold uppercase tracking-wide leading-none">
              {formatMonthShort(event.date)}
            </span>
            <span className="text-white font-serif font-bold text-xl leading-tight">
              {formatDay(event.date)}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gold-50 text-gold-700 border border-gold-200 px-2.5 py-1 rounded-full">
              <Zap size={9} className="fill-gold-500 text-gold-500" />
              Upcoming
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${cfg.bg} ${cfg.color}`}>
              <span>{cfg.icon}</span>
              {event.type}
            </span>
          </div>
        </div>

        <h3 className="font-serif font-bold text-navy-900 text-base leading-snug mb-3 group-hover:text-navy-700 transition-colors">
          {event.title}
        </h3>

        <p className="text-slate-500 text-sm leading-relaxed mb-5 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Calendar size={12} className="text-gold-500" />
            <span>
              {formatDate(event.date)}
              {event.endDate && ` – ${formatDate(event.endDate)}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <MapPin size={12} className="text-gold-500" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PastEventRow({ event, index }: { event: Event; index: number }) {
  const cfg = typeConfig[event.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group"
    >
      {/* Month/Day block */}
      <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-center group-hover:bg-white transition-colors">
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wide leading-none">
          {formatMonthShort(event.date)}
        </span>
        <span className="text-slate-700 font-serif font-bold text-lg leading-tight">
          {formatDay(event.date)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-navy-800 text-sm leading-snug line-clamp-1">
            {event.title}
          </h4>
          <span className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${cfg.bg} ${cfg.color}`}>
            <span>{cfg.icon}</span>
            {event.type}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <MapPin size={10} />
            <span className="truncate">{event.location.split(",")[0]}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Clock size={10} />
            <span>{event.date.split("-")[0]}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Events() {
  const { t } = useLocale();

  const upcoming = events.filter((e) => e.status === "upcoming").slice(0, 3);
  const past = events.filter((e) => e.status === "past").slice(0, 5);

  // Group upcoming by month for pseudo-calendar display
  const monthGroups = upcoming.reduce<Record<string, Event[]>>((acc, ev) => {
    const month = formatMonthYear(ev.date);
    if (!acc[month]) acc[month] = [];
    acc[month].push(ev);
    return acc;
  }, {});

  return (
    <section id="events" className="section-padding bg-slate-50">
      <div className="container-max">
        {/* Header */}
        <div className="text-center mb-16">
          <AnimatedSection>
            <span className="section-label justify-center">
              <span className="w-8 h-px bg-gold-500" />
              {t.events.label}
              <span className="w-8 h-px bg-gold-500" />
            </span>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="heading-lg text-navy-900 mt-4">{t.events.title}</h2>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <p className="text-body mt-3 max-w-xl mx-auto">{t.events.subtitle}</p>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="gold-divider mx-auto mt-5" />
          </AnimatedSection>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Upcoming (2/3) */}
          <div className="lg:col-span-2">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-pulse" />
                <h3 className="font-serif font-bold text-navy-900 text-xl">{t.events.upcoming}</h3>
                <span className="bg-gold-100 text-gold-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-gold-200">
                  {upcoming.length} events
                </span>
              </div>
            </AnimatedSection>

            {/* Month groupings */}
            {Object.entries(monthGroups).map(([month, evs]) => (
              <div key={month} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5">
                    <Calendar size={12} className="text-gold-500" />
                    <span className="text-xs font-semibold text-slate-600">{month}</span>
                  </div>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {evs.map((event, i) => (
                    <UpcomingEventCard key={event.id} event={event} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Past events sidebar (1/3) */}
          <div>
            <AnimatedSection delay={0.15}>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <h3 className="font-serif font-bold text-navy-900 text-xl">{t.events.past}</h3>
              </div>
            </AnimatedSection>

            <div className="space-y-3 mb-6">
              {past.map((event, i) => (
                <PastEventRow key={event.id} event={event} index={i} />
              ))}
            </div>

            {/* Activity types legend */}
            <AnimatedSection delay={0.3}>
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <h4 className="font-semibold text-navy-900 text-sm mb-4 flex items-center gap-2">
                  <Tag size={13} className="text-gold-500" />
                  Event Types
                </h4>
                <div className="space-y-2">
                  {Object.entries(typeConfig).map(([type, cfg]) => (
                    <div key={type} className="flex items-center gap-2.5">
                      <span className="text-base leading-none">{cfg.icon}</span>
                      <span className="text-sm text-slate-600 capitalize">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* CTA */}
        <AnimatedSection delay={0.2}>
          <div className="text-center mt-10">
            <Link href="/events" className="inline-flex items-center gap-2 btn-secondary">
              {t.events.view_all}
              <ArrowRight size={15} />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
