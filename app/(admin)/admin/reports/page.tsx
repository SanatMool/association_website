"use client";

import { useEffect, useState } from "react";
import { TrendingUp, CreditCard, Receipt, Users, Wallet, BarChart2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Summary {
  totalDuesPaid: number; totalDuesPending: number;
  totalExpenses: number; totalContributions: number;
  netBalance: number; totalMembers: number; activePortalAccounts: number;
}
interface DuesMonth       { month: string; paid: number; pending: number }
interface DuesCategory    { name: string; paid: number; pending: number; count: number }
interface ExpenseMeeting  { title: string; scheduledAt: string; total: number }
interface ContribMember   { name: string; total: number }
interface MeetingStat     { id: string; title: string; scheduledAt: string; type: string; status: string; attending: number }
interface EventAttendance { id: string; title: string; date: string; attending: number }
interface MemberMonth     { month: string; count: number }

interface ReportData {
  summary: Summary;
  duesByMonth: DuesMonth[];
  duesByCategory: DuesCategory[];
  expensesByMeeting: ExpenseMeeting[];
  contributionsByMember: ContribMember[];
  meetingStats: MeetingStat[];
  eventAttendance: EventAttendance[];
  membersByMonth: MemberMonth[];
}

function fmt(n: number) {
  return `Rs ${n.toLocaleString()}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ReportsPage() {
  const [data,    setData]    = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports").then((r) => r.json()).then((json: { success: boolean; data: ReportData }) => {
      if (json.success) setData(json.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>;
  if (!data)   return <div className="text-center py-20 text-red-400 text-sm">Failed to load reports.</div>;

  const { summary, duesByMonth, duesByCategory, expensesByMeeting, contributionsByMember, meetingStats, eventAttendance, membersByMonth } = data;

  const maxDuesMonth = Math.max(...duesByMonth.map((d) => d.paid + d.pending), 1);
  const maxMemMonth  = Math.max(...membersByMonth.map((d) => d.count), 1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-400 mt-0.5">Financial summary, attendance, and member growth.</p>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-green-50 rounded-lg"><CreditCard size={14} className="text-green-600" /></div>
            <span className="text-xs text-gray-400">Dues Collected</span>
          </div>
          <div className="text-xl font-bold text-gray-900">{fmt(summary.totalDuesPaid)}</div>
          <div className="text-xs text-amber-500 mt-0.5">{fmt(summary.totalDuesPending)} pending</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-red-50 rounded-lg"><Receipt size={14} className="text-red-500" /></div>
            <span className="text-xs text-gray-400">Total Expenses</span>
          </div>
          <div className="text-xl font-bold text-gray-900">{fmt(summary.totalExpenses)}</div>
          <div className="text-xs text-gray-400 mt-0.5">{expensesByMeeting.length} meetings with expenses</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-indigo-50 rounded-lg"><Wallet size={14} className="text-indigo-600" /></div>
            <span className="text-xs text-gray-400">Contributions</span>
          </div>
          <div className="text-xl font-bold text-gray-900">{fmt(summary.totalContributions)}</div>
          <div className="text-xs text-gray-400 mt-0.5">{contributionsByMember.length} contributors</div>
        </div>

        <div className={`rounded-xl border p-4 ${summary.netBalance >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg ${summary.netBalance >= 0 ? "bg-green-100" : "bg-red-100"}`}>
              {summary.netBalance >= 0
                ? <ArrowUpRight size={14} className="text-green-600" />
                : <ArrowDownRight size={14} className="text-red-500" />}
            </div>
            <span className="text-xs text-gray-500">Net Balance</span>
          </div>
          <div className={`text-xl font-bold ${summary.netBalance >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(summary.netBalance)}</div>
          <div className="text-xs text-gray-400 mt-0.5">income − expenses</div>
        </div>
      </div>

      {/* ── Second row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1"><Users size={13} className="text-gray-400" /><span className="text-xs text-gray-400">Members</span></div>
          <div className="text-2xl font-bold text-gray-900">{summary.totalMembers}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={13} className="text-gray-400" /><span className="text-xs text-gray-400">Portal Accounts</span></div>
          <div className="text-2xl font-bold text-gray-900">{summary.activePortalAccounts}</div>
          <div className="text-xs text-gray-400">{summary.totalMembers > 0 ? Math.round((summary.activePortalAccounts / summary.totalMembers) * 100) : 0}% of members</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1"><BarChart2 size={13} className="text-gray-400" /><span className="text-xs text-gray-400">Meetings</span></div>
          <div className="text-2xl font-bold text-gray-900">{meetingStats.length}</div>
          <div className="text-xs text-gray-400">{meetingStats.filter((m) => m.status === "scheduled").length} upcoming</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* ── Dues by month ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-sm text-gray-900">Dues by Period</h2>
            <p className="text-xs text-gray-400 mt-0.5">Paid vs pending per month</p>
          </div>
          {duesByMonth.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">No dues recorded yet.</div>
          ) : (
            <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
              {duesByMonth.slice().reverse().map((d) => (
                <div key={d.month}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">{monthLabel(d.month)}</span>
                    <span className="text-gray-400">{fmt(d.paid + d.pending)}</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    <div className="bg-gray-100 rounded-full h-1.5 flex-1 overflow-hidden flex">
                      <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${maxDuesMonth > 0 ? ((d.paid / maxDuesMonth) * 100) : 0}%` }} />
                      <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${maxDuesMonth > 0 ? ((d.pending / maxDuesMonth) * 100) : 0}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-0.5 text-[10px] text-gray-400">
                    <span><span className="text-green-600 font-medium">Paid</span> {fmt(d.paid)}</span>
                    {d.pending > 0 && <span><span className="text-amber-500 font-medium">Pending</span> {fmt(d.pending)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Dues by category ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-sm text-gray-900">Dues by Member Category</h2>
            <p className="text-xs text-gray-400 mt-0.5">Breakdown per membership type</p>
          </div>
          {duesByCategory.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">No dues recorded yet.</div>
          ) : (
            <div className="px-5 py-4 space-y-4 max-h-80 overflow-y-auto">
              {duesByCategory.map((c) => {
                const total = c.paid + c.pending;
                const maxCat = Math.max(...duesByCategory.map((x) => x.paid + x.pending), 1);
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{c.name}</span>
                      <span className="text-gray-400">{c.count} record{c.count !== 1 ? "s" : ""} · {fmt(total)}</span>
                    </div>
                    <Bar value={c.paid} max={maxCat} color="bg-green-500" />
                    <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                      <span className="text-green-600">{fmt(c.paid)} paid</span>
                      {c.pending > 0 && <span className="text-amber-500">{fmt(c.pending)} pending</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* ── Member growth ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-sm text-gray-900">Member Growth</h2>
            <p className="text-xs text-gray-400 mt-0.5">New members joined per month</p>
          </div>
          {membersByMonth.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">No data yet.</div>
          ) : (
            <div className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
              {membersByMonth.slice().reverse().slice(0, 12).map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16 flex-shrink-0">{monthLabel(m.month)}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(m.count / maxMemMonth) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-6 text-right">{m.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Top contributors ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-sm text-gray-900">Top Contributors</h2>
            <p className="text-xs text-gray-400 mt-0.5">Member contributions (paid)</p>
          </div>
          {contributionsByMember.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">No contributions recorded.</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {contributionsByMember.map((c, i) => {
                const maxC = contributionsByMember[0].total;
                return (
                  <div key={c.name} className="px-5 py-3 flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-4 text-right flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{c.name}</div>
                      <Bar value={c.total} max={maxC} color="bg-indigo-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 flex-shrink-0">{fmt(c.total)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* ── Expenses by meeting ────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-sm text-gray-900">Expenses by Meeting</h2>
          </div>
          {expensesByMeeting.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">No expenses recorded.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Meeting</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expensesByMeeting.map((e) => (
                  <tr key={e.title + e.scheduledAt} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{e.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(e.scheduledAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">{fmt(e.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-100 bg-gray-50">
                <tr>
                  <td className="px-4 py-2.5 text-xs font-semibold text-gray-500" colSpan={2}>Total</td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold text-red-600">{fmt(expensesByMeeting.reduce((s, e) => s + e.total, 0))}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* ── Event attendance ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-sm text-gray-900">Event Attendance (RSVPs)</h2>
            <p className="text-xs text-gray-400 mt-0.5">Portal member RSVPs per event</p>
          </div>
          {eventAttendance.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">No events yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Event</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Attending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {eventAttendance.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{e.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-semibold ${e.attending > 0 ? "text-green-600" : "text-gray-400"}`}>{e.attending}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Meeting attendance ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-sm text-gray-900">Meeting Attendance (RSVPs)</h2>
          <p className="text-xs text-gray-400 mt-0.5">Portal member RSVPs per meeting</p>
        </div>
        {meetingStats.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No meetings yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Meeting</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">RSVPs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {meetingStats.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.title}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 uppercase">{m.type}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(m.scheduledAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${m.status === "scheduled" ? "bg-green-50 text-green-700" : m.status === "completed" ? "bg-gray-100 text-gray-500" : "bg-red-50 text-red-600"}`}>{m.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold ${m.attending > 0 ? "text-green-600" : "text-gray-400"}`}>{m.attending}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
