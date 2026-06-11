"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Pencil, Search, ChevronUp, ChevronDown, ChevronsUpDown, SlidersHorizontal } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";
import { formatDate } from "@/lib/utils";

interface EventRow {
  id: string;
  title: string;
  date: string; // ISO string
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

const STATUS_FILTERS = ["all", "upcoming", "past"] as const;
const TYPE_FILTERS   = ["all", "networking", "training", "meeting", "exhibition", "conference"] as const;

function SortIcon({ col, sortKey, sortAsc }: { col: SortKey; sortKey: SortKey; sortAsc: boolean }) {
  if (sortKey !== col) return <ChevronsUpDown size={12} className="text-gray-300" />;
  return sortAsc ? <ChevronUp size={12} className="text-amber-500" /> : <ChevronDown size={12} className="text-amber-500" />;
}

export default function EventsClient({ events }: { events: EventRow[] }) {
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState<typeof STATUS_FILTERS[number]>("all");
  const [typeF,    setTypeF]    = useState<typeof TYPE_FILTERS[number]>("all");
  const [sortKey,  setSortKey]  = useState<SortKey>("date");
  const [sortAsc,  setSortAsc]  = useState(false);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">{events.length} total</p>
        </div>
        <Link
          href="/admin/events/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] transition-colors"
        >
          <Plus size={14} /> Add event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or location…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
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
          <div className="w-px h-4 bg-gray-200" />
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
        </div>
      </div>

      {/* Results count */}
      {(search || status !== "all" || typeF !== "all") && (
        <p className="text-xs text-gray-400 mb-3">
          Showing <strong className="text-gray-700">{displayed.length}</strong> of {events.length} events
        </p>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 w-8" />
              <th className="text-left px-4 py-3 text-gray-500 font-medium">
                <button onClick={() => toggleSort("title")} className="flex items-center gap-1 hover:text-gray-800">
                  Title <SortIcon col="title" sortKey={sortKey} sortAsc={sortAsc} />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">
                <button onClick={() => toggleSort("date")} className="flex items-center gap-1 hover:text-gray-800">
                  Date <SortIcon col="date" sortKey={sortKey} sortAsc={sortAsc} />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">
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
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayed.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {e.image ? (
                      <img src={e.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">
                        {e.title.charAt(0)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 truncate max-w-[220px]">{e.title}</p>
                  <p className="text-xs text-gray-400 truncate max-w-[220px] mt-0.5">{e.location}</p>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  <p>{formatDate(e.date)}</p>
                  {e.startTime && (
                    <p className="text-xs text-gray-400 mt-0.5">{e.startTime}{e.attendees ? ` · ${e.attendees} pax` : ""}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 capitalize hidden md:table-cell">{TYPE_LABELS[e.type] ?? e.type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full border capitalize ${
                    e.status === "upcoming"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}>
                    {e.status}
                  </span>
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
              </tr>
            ))}
          </tbody>
        </table>

        {displayed.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">
              {events.length === 0 ? "No events yet. Click \"Add event\" to create one." : "No events match your search or filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
