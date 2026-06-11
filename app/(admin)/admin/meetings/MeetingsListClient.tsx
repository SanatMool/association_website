"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Calendar, CheckCircle, Clock, XCircle, Search, ArrowUpDown, MapPin, ListChecks, Receipt, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface MeetingRow {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  venue: string | null;
  status: string;
  agendaCount: number;
  expenseCount: number;
}

const TYPE_LABELS: Record<string, string> = {
  agm: "AGM", picnic: "Picnic", program: "Program", committee: "Committee", special: "Special",
};
const TYPE_COLORS: Record<string, string> = {
  agm: "bg-purple-50 text-purple-700", picnic: "bg-green-50 text-green-700",
  program: "bg-blue-50 text-blue-700", committee: "bg-amber-50 text-amber-700", special: "bg-rose-50 text-rose-700",
};
const STATUSES = ["all", "scheduled", "completed", "cancelled"] as const;
const TYPES    = ["all", "agm", "picnic", "program", "committee", "special"] as const;

type SortKey = "date" | "title" | "type" | "status";

export default function MeetingsListClient({ meetings }: { meetings: MeetingRow[] }) {
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState<typeof STATUSES[number]>("all");
  const [typeF,    setTypeF]    = useState<typeof TYPES[number]>("all");
  const [sortKey,  setSortKey]  = useState<SortKey>("date");
  const [sortAsc,  setSortAsc]  = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const filtered = meetings
    .filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch = q === "" || m.title.toLowerCase().includes(q) || (m.venue ?? "").toLowerCase().includes(q);
      const matchesStatus = status === "all" || m.status === status;
      const matchesType   = typeF === "all"   || m.type === typeF;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date")   cmp = a.scheduledAt.localeCompare(b.scheduledAt);
      if (sortKey === "title")  cmp = a.title.localeCompare(b.title);
      if (sortKey === "type")   cmp = a.type.localeCompare(b.type);
      if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      return sortAsc ? cmp : -cmp;
    });

  const upcoming = filtered.filter((m) => m.status === "scheduled");
  const past     = filtered.filter((m) => m.status !== "scheduled");

  function SortBtn({ col, label }: { col: SortKey; label: string }) {
    return (
      <button onClick={() => toggleSort(col)} className="flex items-center gap-1 group hover:text-gray-700 transition-colors">
        {label}
        <ArrowUpDown size={11} className={`transition-colors ${sortKey === col ? "text-[#0a1040]" : "text-gray-300 group-hover:text-gray-400"}`} />
      </button>
    );
  }

  const anyFilter = search || status !== "all" || typeF !== "all";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Calendar size={22} className="text-indigo-500" /> Meetings
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meetings.length} total · <span className="text-blue-600">{upcoming.length} upcoming</span> · {past.length} past
          </p>
        </div>
        <Link
          href="/admin/meetings/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0a1040] text-white text-sm rounded-xl hover:bg-[#0d1550] transition-colors w-full sm:w-auto"
        >
          <Plus size={14} /> Schedule Meeting
        </Link>
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 space-y-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or venue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1 text-xs font-medium rounded-full border capitalize transition-colors ${
                status === s ? "bg-[#0a1040] text-white border-[#0a1040]" : "border-gray-200 text-gray-500 hover:border-gray-400"
              }`}>
              {s === "all" ? "All Status" : s}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-200 self-center hidden sm:block" />
          {TYPES.map((t) => (
            <button key={t} onClick={() => setTypeF(t)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                typeF === t ? "bg-amber-500 text-white border-amber-500" : "border-gray-200 text-gray-500 hover:border-gray-400"
              }`}>
              {t === "all" ? "All Types" : TYPE_LABELS[t] ?? t}
            </button>
          ))}
          {anyFilter && (
            <button onClick={() => { setSearch(""); setStatus("all"); setTypeF("all"); }}
              className="ml-auto text-xs text-red-500 hover:text-red-700 underline">
              Clear
            </button>
          )}
        </div>
      </div>

      {meetings.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 text-center py-16 text-gray-400">
          <Calendar size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No meetings scheduled yet.</p>
        </div>
      )}

      {filtered.length === 0 && meetings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 text-center py-10 text-gray-400 text-sm">
          No meetings match your search or filters.
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</h2>
          <MeetingTable meetings={upcoming} SortBtn={SortBtn} />
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Past</h2>
          <MeetingTable meetings={past} SortBtn={SortBtn} />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "scheduled")  return <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full"><Clock size={10} />Scheduled</span>;
  if (status === "completed")  return <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full"><CheckCircle size={10} />Completed</span>;
  if (status === "cancelled")  return <span className="inline-flex items-center gap-1 text-xs text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full"><XCircle size={10} />Cancelled</span>;
  return null;
}

function MeetingTable({
  meetings,
  SortBtn,
}: {
  meetings: MeetingRow[];
  SortBtn: (props: { col: "date" | "title" | "type" | "status"; label: string }) => React.ReactElement;
}) {
  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {meetings.map((m) => (
          <div key={m.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-snug">{m.title}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[m.type] ?? "bg-gray-100 text-gray-600"}`}>
                    {TYPE_LABELS[m.type] ?? m.type}
                  </span>
                  <StatusBadge status={m.status} />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(m.scheduledAt)}</span>
                  {m.venue && <span className="flex items-center gap-1"><MapPin size={10} />{m.venue}</span>}
                  {m.agendaCount > 0 && <span className="flex items-center gap-1"><ListChecks size={10} />{m.agendaCount} agenda</span>}
                  {m.expenseCount > 0 && <span className="flex items-center gap-1"><Receipt size={10} />{m.expenseCount} expenses</span>}
                </div>
              </div>
              <Link href={`/admin/meetings/${m.id}`}
                className="flex-shrink-0 px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors min-h-[36px] flex items-center">
                Manage →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <SortBtn col="title" label="Meeting" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <SortBtn col="date" label="Date" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <MapPin size={11} className="inline mr-1" />Venue
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <ListChecks size={11} className="inline mr-1" />Agenda
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Receipt size={11} className="inline mr-1" />Expenses
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <SortBtn col="status" label="Status" />
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {meetings.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{m.title}</div>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[m.type] ?? "bg-gray-100 text-gray-600"}`}>
                    {TYPE_LABELS[m.type] ?? m.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(m.scheduledAt)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{m.venue ?? "—"}</td>
                <td className="px-4 py-3 text-center text-gray-500 text-xs">{m.agendaCount}</td>
                <td className="px-4 py-3 text-center text-gray-500 text-xs">{m.expenseCount}</td>
                <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                <td className="px-4 py-3">
                  <Link href={`/admin/meetings/${m.id}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap">
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
