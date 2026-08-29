"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus, Pencil, Search, ChevronUp, ChevronDown, ChevronsUpDown,
  SlidersHorizontal, CalendarDays, MapPin, Users, Clock, X,
  CalendarCheck, CalendarX,
} from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";
import { formatDate } from "@/lib/utils";
import PanelCard from "@/components/ui/panel/PanelCard";
import { PanelTable, PanelTableHead, PanelTableRow } from "@/components/ui/panel/PanelTable";
import Badge from "@/components/ui/panel/Badge";
import EmptyState from "@/components/ui/panel/EmptyState";

interface EventRow {
  id: string;
  title: string;
  date: string;
  type: string;
  status: string;
  location: string;
  attendees: number | null;
  startTime: string | null;
  image: string | null;
}

type SortKey = "title" | "date" | "type" | "status";

const TYPE_LABELS: Record<string, string> = {
  networking: "Networking",
  training:   "Training",
  meeting:    "Meeting",
  exhibition: "Exhibition",
  conference: "Conference",
};

const TYPE_COLORS: Record<string, string> = {
  networking:  "bg-blue-50 text-blue-700 border-blue-200",
  training:    "bg-purple-50 text-purple-700 border-purple-200",
  meeting:     "bg-amber-50 text-amber-700 border-amber-200",
  exhibition:  "bg-teal-50 text-teal-700 border-teal-200",
  conference:  "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const STATUS_FILTERS = ["all", "upcoming", "past"] as const;
const TYPE_FILTERS   = ["all", "networking", "training", "meeting", "exhibition", "conference"] as const;

function SortIcon({ col, sortKey, sortAsc }: { col: SortKey; sortKey: SortKey; sortAsc: boolean }) {
  if (sortKey !== col) return <ChevronsUpDown size={12} className="text-gray-300" />;
  return sortAsc ? <ChevronUp size={12} className="text-amber-500" /> : <ChevronDown size={12} className="text-amber-500" />;
}

export default function EventsClient({ events }: { events: EventRow[] }) {
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState<typeof STATUS_FILTERS[number]>("all");
  const [typeF,   setTypeF]   = useState<typeof TYPE_FILTERS[number]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(col: SortKey) {
    if (sortKey === col) setSortAsc((v) => !v);
    else { setSortKey(col); setSortAsc(true); }
  }

  const displayed = useMemo(() => {
    let rows = events.filter((e) => {
      const q = search.toLowerCase();
      if (q && !e.title.toLowerCase().includes(q) && !e.location.toLowerCase().includes(q)) return false;
      if (status !== "all" && e.status !== status) return false;
      if (typeF !== "all" && e.type !== typeF) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title")  cmp = a.title.localeCompare(b.title);
      if (sortKey === "date")   cmp = a.date.localeCompare(b.date);
      if (sortKey === "type")   cmp = a.type.localeCompare(b.type);
      if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [events, search, status, typeF, sortKey, sortAsc]);

  const upcomingCount = events.filter((e) => e.status === "upcoming").length;
  const pastCount     = events.length - upcomingCount;
  const anyFilter     = search || status !== "all" || typeF !== "all";

  return (
    <div>
      {/* ── Header ─── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <CalendarDays size={22} className="text-indigo-500" />
            Events
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-3">
            <span>{events.length} total</span>
            <span className="flex items-center gap-1 text-green-600"><CalendarCheck size={11} /> {upcomingCount} upcoming</span>
            <span className="flex items-center gap-1 text-gray-400"><CalendarX size={11} /> {pastCount} past</span>
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] transition-colors"
        >
          <Plus size={14} /> Add Event
        </Link>
      </div>

      {/* ── Filters ─── */}
      <PanelCard className="p-4 mb-4 space-y-3" hover={false}>
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or location…"
            className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 items-center">
          <SlidersHorizontal size={13} className="text-gray-400 flex-shrink-0" />
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                  status === s ? "bg-[#0a1040] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}>
                {s === "all" ? "All Status" : s}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-gray-200 hidden sm:block" />
          <div className="flex gap-1 flex-wrap">
            {TYPE_FILTERS.map((t) => (
              <button key={t} onClick={() => setTypeF(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                  typeF === t ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}>
                {t === "all" ? "All Types" : TYPE_LABELS[t] ?? t}
              </button>
            ))}
          </div>
          {anyFilter && (
            <button
              onClick={() => { setSearch(""); setStatus("all"); setTypeF("all"); }}
              className="ml-auto text-xs text-red-500 hover:text-red-700 underline"
            >
              Clear
            </button>
          )}
        </div>
      </PanelCard>

      {/* Results count */}
      {anyFilter && (
        <p className="text-xs text-gray-400 mb-3">
          Showing <strong className="text-gray-700">{displayed.length}</strong> of {events.length} events
        </p>
      )}

      {/* ── Mobile cards (hidden md+) ─────────────────────────────────── */}
      <PanelTable className="md:hidden">
        {displayed.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={events.length === 0 ? "No events yet." : "No events match your filters."}
            description={events.length === 0 ? "Tap \"Add Event\" to create one." : undefined}
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {displayed.map((e) => {
              const typeCls = TYPE_COLORS[e.type] ?? "bg-gray-50 text-gray-600 border-gray-200";
              return (
                <div key={e.id} className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {e.image ? (
                        <img src={e.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg font-bold">
                          {e.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm leading-snug">{e.title}</p>
                        <Badge tone={e.status === "upcoming" ? "success" : "neutral"} className="flex-shrink-0 capitalize">
                          {e.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={10} /> {formatDate(e.date)}
                          {e.startTime && ` · ${e.startTime}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          <span className="truncate max-w-[160px]">{e.location}</span>
                        </span>
                        {e.attendees && (
                          <span className="flex items-center gap-1">
                            <Users size={10} /> {e.attendees} pax
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2.5">
                        {/* Per-type color varies (5 palettes) — plain span keeps Badge's shape without tone-class conflicts */}
                        <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${typeCls}`}>
                          {TYPE_LABELS[e.type] ?? e.type}
                        </span>
                        <div className="ml-auto flex items-center gap-1.5">
                          <Link
                            href={`/admin/events/${e.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <Pencil size={11} /> Edit
                          </Link>
                          <DeleteButton id={e.id} entity="events" redirectTo="/admin/events" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PanelTable>

      {/* ── Desktop table (hidden below md) ──────────────────────────── */}
      <PanelTable className="hidden md:block">
        <table className="w-full text-sm">
          <PanelTableHead>
            <tr>
              <th className="px-4 py-3 w-8" />
              <th className="text-left px-4 py-3 text-gray-500 font-medium">
                <button onClick={() => toggleSort("title")} className="flex items-center gap-1 hover:text-gray-800">
                  <CalendarDays size={12} /> Title <SortIcon col="title" sortKey={sortKey} sortAsc={sortAsc} />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">
                <button onClick={() => toggleSort("date")} className="flex items-center gap-1 hover:text-gray-800">
                  <Clock size={12} /> Date <SortIcon col="date" sortKey={sortKey} sortAsc={sortAsc} />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">
                <button onClick={() => toggleSort("type")} className="flex items-center gap-1 hover:text-gray-800">
                  Type <SortIcon col="type" sortKey={sortKey} sortAsc={sortAsc} />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">
                <button onClick={() => toggleSort("status")} className="flex items-center gap-1 hover:text-gray-800">
                  Status <SortIcon col="status" sortKey={sortKey} sortAsc={sortAsc} />
                </button>
              </th>
              <th className="px-4 py-3" />
            </tr>
          </PanelTableHead>
          <tbody className="divide-y divide-gray-50">
            {displayed.map((e, i) => (
              <PanelTableRow key={e.id} index={i}>
                <td className="px-4 py-3">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {e.image ? (
                      <img src={e.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm font-bold">
                        {e.title.charAt(0)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 truncate max-w-[220px]">{e.title}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    <span className="truncate max-w-[200px]">{e.location}</span>
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  <p className="flex items-center gap-1"><CalendarDays size={11} className="text-gray-300" /> {formatDate(e.date)}</p>
                  {e.startTime && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {e.startTime}{e.attendees ? ` · ${e.attendees} pax` : ""}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${TYPE_COLORS[e.type] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {TYPE_LABELS[e.type] ?? e.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={e.status === "upcoming" ? "success" : "neutral"} className="capitalize">
                    {e.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      href={`/admin/events/${e.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <Pencil size={11} /> Edit
                    </Link>
                    <DeleteButton id={e.id} entity="events" redirectTo="/admin/events" />
                  </div>
                </td>
              </PanelTableRow>
            ))}
          </tbody>
        </table>

        {displayed.length === 0 && (
          <EmptyState
            icon={CalendarDays}
            title={events.length === 0 ? "No events yet." : "No events match your search or filters."}
            description={events.length === 0 ? "Click \"Add Event\" to create one." : undefined}
          />
        )}
      </PanelTable>
    </div>
  );
}
