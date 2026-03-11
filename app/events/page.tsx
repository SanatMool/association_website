"use client";

import { useState } from "react";
import { events } from "@/data/events";
import EventCard from "@/components/ui/EventCard";
import { useLocale } from "@/context/LocaleContext";
import { motion } from "framer-motion";

export default function EventsPage() {
  const { t } = useLocale();
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const types = ["all", "networking", "training", "meeting", "exhibition", "conference"];

  const filtered = events.filter((e) => {
    const matchStatus = filter === "all" || e.status === filter;
    const matchType = typeFilter === "all" || e.type === typeFilter;
    return matchStatus && matchType;
  });

  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      <div className="bg-navy-900 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 text-gold-400 text-sm font-medium mb-4">
              <span className="w-6 h-px bg-gold-500" />
              {t.events.label}
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-3">
              {t.events.title}
            </h1>
            <p className="text-white/60 text-lg">{t.events.subtitle}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          {["all", "upcoming", "past"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`text-sm font-medium px-4 py-2 rounded-full capitalize transition-all ${
                filter === f
                  ? "bg-navy-900 text-gold-400"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {f === "all" ? "All Events" : f}
            </button>
          ))}
          <span className="w-px bg-slate-200 self-stretch" />
          {types.slice(1).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
              className={`text-sm font-medium px-4 py-2 rounded-full capitalize transition-all ${
                typeFilter === type
                  ? "bg-gold-500 text-navy-900"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {type}
            </button>
          ))}
        </motion.div>

        <p className="text-slate-500 text-sm mb-6">
          Showing{" "}
          <span className="font-semibold text-navy-900">{filtered.length}</span>{" "}
          events
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">No events found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
