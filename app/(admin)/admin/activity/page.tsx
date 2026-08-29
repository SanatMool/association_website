"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Activity, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import PanelCard from "@/components/ui/panel/PanelCard";
import { PanelTable, PanelTableRow } from "@/components/ui/panel/PanelTable";

interface LogRow {
  id: string;
  action: string;
  entityType: string;
  entityName: string | null;
  adminName: string | null;
  adminId: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  "member.create": "Added member", "member.update": "Updated member", "member.delete": "Deleted member",
  "event.create": "Created event", "event.update": "Updated event", "event.delete": "Deleted event",
  "news.create": "Published news", "news.update": "Updated news", "news.delete": "Deleted news",
  "committee.create": "Added committee member", "committee.update": "Updated committee member",
  "committee.delete": "Removed committee member", "committee.archive": "Archived committee",
  "meeting.create": "Created meeting", "meeting.delete": "Deleted meeting",
  "task.create": "Created task", "task.complete": "Completed task", "task.delete": "Deleted task",
  "application.accept": "Accepted application", "application.reviewed": "Marked reviewed",
  "application.rejected": "Rejected application", "application.pending": "Reset to pending",
  "application.delete": "Deleted application",
  "dues.record_paid": "Recorded payment", "dues.record_pending": "Added pending due",
};

const ACTION_COLORS: Record<string, string> = {
  "member.create": "bg-blue-100 text-blue-700",   "member.delete": "bg-red-100 text-red-700",
  "event.create": "bg-green-100 text-green-700",  "event.delete": "bg-red-100 text-red-700",
  "news.create": "bg-amber-100 text-amber-700",   "news.delete": "bg-red-100 text-red-700",
  "committee.archive": "bg-slate-100 text-slate-600",
  "application.accept": "bg-emerald-100 text-emerald-700",
  "application.rejected": "bg-red-100 text-red-700",
  "dues.record_paid": "bg-teal-100 text-teal-700",
  "task.complete": "bg-indigo-100 text-indigo-700",
};

const ENTITY_TYPES = ["", "member", "event", "news", "committee", "meeting", "task", "application", "dues"];

function actionLabel(a: string) { return ACTION_LABELS[a] ?? a; }
function actionColor(a: string) { return ACTION_COLORS[a] ?? "bg-gray-100 text-gray-600"; }

function formatDT(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ActivityPage() {
  const [logs, setLogs]         = useState<LogRow[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);

  // Filters
  const [entityType, setEntityType] = useState("");
  const [from, setFrom]             = useState("");
  const [to, setTo]                 = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (entityType) params.set("entityType", entityType);
    if (from) params.set("from", from);
    if (to)   params.set("to",   to + "T23:59:59");
    const res = await fetch(`/api/admin/activity?${params}`);
    const json = await res.json() as { success: boolean; data: LogRow[]; total: number; pages: number };
    if (json.success) {
      setLogs(json.data);
      setTotal(json.total);
      setPages(json.pages);
    }
    setLoading(false);
  }, [page, entityType, from, to]);

  useEffect(() => { void load(); }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [entityType, from, to]);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 text-sm font-medium">Activity Log</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity size={22} className="text-[#0a1040]" />
          Activity Log
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">All admin actions across the system — {total} entries</p>
      </div>

      {/* Filter bar */}
      <PanelCard className="p-4 mb-4 flex flex-wrap items-center gap-3" hover={false}>
        <Filter size={14} className="text-gray-400 flex-shrink-0" />
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20 bg-white"
        >
          <option value="">All types</option>
          {ENTITY_TYPES.filter(Boolean).map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0a1040]/20"
          />
        </div>
        {(entityType || from || to) && (
          <button
            onClick={() => { setEntityType(""); setFrom(""); setTo(""); }}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </PanelCard>

      {/* Log table */}
      <PanelTable>
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-[#0a1040] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-400 mt-3">Loading activity…</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Activity size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No activity found.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Entity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Admin</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log, i) => (
                    <PanelTableRow key={log.id} index={i}>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${actionColor(log.action)}`}>
                          {actionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          {log.entityName && (
                            <p className="font-medium text-gray-800 truncate max-w-[260px]">{log.entityName}</p>
                          )}
                          <p className="text-xs text-gray-400 capitalize">{log.entityType}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{log.adminName ?? <span className="text-gray-300 italic">system</span>}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDT(log.createdAt)}</td>
                    </PanelTableRow>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-50">
              {logs.map((log) => (
                <div key={log.id} className="px-4 py-3 flex items-start gap-3">
                  <span className={`mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${actionColor(log.action)}`}>
                    {actionLabel(log.action)}
                  </span>
                  <div className="flex-1 min-w-0">
                    {log.entityName && <p className="text-sm font-medium text-gray-800 truncate">{log.entityName}</p>}
                    <p className="text-xs text-gray-400">{log.adminName ?? "system"} · {formatDT(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Page {page} of {pages} · {total} entries
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-gray-500 px-2">{page}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </PanelTable>
    </div>
  );
}
