"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, ChevronDown, ChevronUp, MapPin, Calendar, ListChecks, Search,
  CheckCircle, Languages,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AgendaItem {
  title: string;
  description: string | null;
  outcome: string | null;
  resolved: boolean;
}

interface MeetingMinutes {
  content: string;
  contentNe: string | null;
  publishedAt: string;
}

interface Meeting {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  venue: string | null;
  status: string;
  agendaItems: AgendaItem[];
  minutes: MeetingMinutes | null;
}

const TYPE_LABELS: Record<string, string> = {
  agm: "AGM",
  picnic: "Picnic",
  program: "Program",
  committee: "Committee",
  special: "Special",
};

const TYPE_COLORS: Record<string, string> = {
  agm:       "bg-purple-100 text-purple-700 border border-purple-200",
  picnic:    "bg-green-100 text-green-700 border border-green-200",
  program:   "bg-blue-100 text-blue-700 border border-blue-200",
  committee: "bg-amber-100 text-amber-700 border border-amber-200",
  special:   "bg-rose-100 text-rose-700 border border-rose-200",
};

const TYPE_ACCENT: Record<string, string> = {
  agm:       "border-l-purple-400",
  picnic:    "border-l-green-400",
  program:   "border-l-blue-400",
  committee: "border-l-amber-400",
  special:   "border-l-rose-400",
};

export default function MeetingsPublicClient({ meetings }: { meetings: Meeting[] }) {
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [minutesLang, setMinutesLang] = useState<Record<string, "en" | "ne">>({});
  const [activeType,  setActiveType]  = useState<string>("all");
  const [activeYear,  setActiveYear]  = useState<string>("all");
  const [search,      setSearch]      = useState("");

  const types = Array.from(new Set(meetings.map((m) => m.type)));
  const years = Array.from(
    new Set(meetings.map((m) => new Date(m.scheduledAt).getFullYear().toString()))
  ).sort((a, b) => Number(b) - Number(a));

  const filtered = meetings.filter((m) => {
    const matchType = activeType === "all" || m.type === activeType;
    const matchYear = activeYear === "all" || new Date(m.scheduledAt).getFullYear().toString() === activeYear;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      (m.venue ?? "").toLowerCase().includes(q);
    return matchType && matchYear && matchSearch;
  });

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function getLang(id: string): "en" | "ne" {
    return minutesLang[id] ?? "en";
  }

  function setLang(id: string, lang: "en" | "ne") {
    setMinutesLang((prev) => ({ ...prev, [id]: lang }));
  }

  if (meetings.length === 0) {
    return (
      <div className="py-24 text-center">
        <FileText size={40} className="text-gray-200 mx-auto mb-4" />
        <p className="text-gray-400 text-lg font-medium">No published minutes yet.</p>
        <p className="text-gray-300 text-sm mt-2">
          Minutes will appear here once they are published by the admin.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Type filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveType("all")}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
              activeType === "all"
                ? "bg-navy-800 text-white border-navy-800"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            All Types
          </button>
          {types.map((type) => {
            const count = meetings.filter((m) => m.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  activeType === type
                    ? "bg-navy-800 text-white border-navy-800"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {TYPE_LABELS[type] ?? type} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Year filter */}
      {years.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveYear("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeYear === "all"
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
            }`}
          >
            All Years
          </button>
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setActiveYear(year)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activeYear === year
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {(search || activeType !== "all" || activeYear !== "all") ? (
        <p className="text-sm text-gray-400 mb-4">
          Showing {filtered.length} of {meetings.length} records
        </p>
      ) : null}

      {/* Empty filtered state */}
      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-gray-400 text-sm">No meetings match your filter.</p>
          <button
            onClick={() => { setActiveType("all"); setActiveYear("all"); setSearch(""); }}
            className="mt-2 text-sm text-navy-800 font-medium hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Meeting cards */}
      <div className="space-y-4">
        {filtered.map((m) => {
          const isOpen  = expandedId === m.id;
          const accent  = TYPE_ACCENT[m.type] ?? "border-l-gray-300";
          const lang    = getLang(m.id);
          const resolvedItems = m.agendaItems.filter((a) => a.resolved && a.outcome);

          return (
            <motion.div
              key={m.id}
              layout
              className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${accent} shadow-sm overflow-hidden`}
            >
              {/* Card header — always visible */}
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Type + date row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[m.type] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                        {TYPE_LABELS[m.type] ?? m.type}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar size={11} /> {formatDate(m.scheduledAt)}
                      </span>
                      {m.venue && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={11} /> {m.venue}
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg font-semibold text-gray-900">{m.title}</h2>

                    {/* Agenda summary — collapsed */}
                    {!isOpen && m.agendaItems.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <ListChecks size={11} />
                          {m.agendaItems.length} agenda item{m.agendaItems.length !== 1 ? "s" : ""}
                        </span>
                        {resolvedItems.length > 0 && (
                          <span className="flex items-center gap-1 text-green-500">
                            <CheckCircle size={11} />
                            {resolvedItems.length} resolved
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Expand button */}
                  {m.minutes && (
                    <button
                      onClick={() => toggle(m.id)}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 bg-navy-800 text-white rounded-xl hover:bg-navy-700 transition-colors"
                    >
                      <FileText size={12} />
                      {isOpen ? "Close" : "View Minutes"}
                      {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>

                {/* Agenda items — shown when expanded */}
                <AnimatePresence>
                  {isOpen && m.agendaItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 pt-4 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <ListChecks size={12} /> Agenda
                        </p>
                        <ol className="space-y-2">
                          {m.agendaItems.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <span className={`text-xs font-mono mt-0.5 flex-shrink-0 w-5 text-right ${item.resolved ? "text-green-400" : "text-gray-300"}`}>
                                {i + 1}.
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  {item.resolved && (
                                    <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                                  )}
                                  <span className={`font-medium ${item.resolved ? "text-gray-500" : "text-gray-700"}`}>
                                    {item.title}
                                  </span>
                                </div>
                                {item.description && (
                                  <span className="text-gray-400 text-xs ml-0">— {item.description}</span>
                                )}
                                {item.outcome && (
                                  <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full" />
                                    Outcome: {item.outcome}
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Minutes panel */}
              <AnimatePresence>
                {isOpen && m.minutes && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-100 bg-gray-50/60 px-5 sm:px-6 py-5">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText size={14} className="text-navy-800" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Meeting Minutes
                        </span>
                        <span className="ml-auto text-xs text-gray-400">
                          Published {formatDate(m.minutes.publishedAt)}
                        </span>
                        {/* Language toggle — show only if Nepali exists */}
                        {m.minutes.contentNe && (
                          <div className="flex items-center gap-1 ml-3 bg-white border border-gray-200 rounded-lg p-0.5">
                            <button
                              onClick={() => setLang(m.id, "en")}
                              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${lang === "en" ? "bg-navy-800 text-white" : "text-gray-400 hover:text-gray-600"}`}
                            >
                              EN
                            </button>
                            <button
                              onClick={() => setLang(m.id, "ne")}
                              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${lang === "ne" ? "bg-navy-800 text-white" : "text-gray-400 hover:text-gray-600"}`}
                            >
                              <Languages size={10} /> NE
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-transparent p-0 border-0">
                          {lang === "ne" && m.minutes.contentNe ? m.minutes.contentNe : m.minutes.content}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
