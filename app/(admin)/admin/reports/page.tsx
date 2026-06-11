"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, CreditCard, Receipt, Users, Wallet, BarChart2,
  ArrowUpRight, ArrowDownRight, CalendarDays, KeyRound,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
  year: number | null;
  availableYears: number[];
  summary: Summary;
  duesByMonth: DuesMonth[];
  duesByCategory: DuesCategory[];
  expensesByMeeting: ExpenseMeeting[];
  contributionsByMember: ContribMember[];
  meetingStats: MeetingStat[];
  eventAttendance: EventAttendance[];
  membersByMonth: MemberMonth[];
}

type Tab = "overview" | "finances" | "attendance" | "members";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return `Rs ${Math.round(n).toLocaleString()}`; }

function fmtK(n: number) {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `${Math.round(n / 1000)}K`;
  return String(Math.round(n));
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${MONTHS[Number(m) - 1]} '${y.slice(2)}`;
}

// ─── Chart Components ─────────────────────────────────────────────────────────

// Stacked vertical bar chart — dues paid vs pending per month
function DuesBarChart({ data }: { data: DuesMonth[] }) {
  const recent = data.slice(-12);
  const max = Math.max(...recent.map((d) => d.paid + d.pending), 1);
  if (recent.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-gray-400">No dues recorded yet.</p>;
  }
  return (
    <div className="px-5 py-4">
      <div className="flex items-end gap-1 h-36 bg-gray-50 rounded-xl px-3 pt-3 pb-0">
        {recent.map((d) => {
          const total = d.paid + d.pending;
          const heightPct = (total / max) * 100;
          const pendPct   = total > 0 ? (d.pending / total) * 100 : 0;
          const paidPct   = total > 0 ? (d.paid    / total) * 100 : 0;
          return (
            <div
              key={d.month}
              className="flex-1 flex flex-col min-w-0 rounded-t-sm overflow-hidden"
              style={{ height: `${Math.max(heightPct, total > 0 ? 2 : 0)}%` }}
              title={`${monthLabel(d.month)}: ${fmt(total)}`}
            >
              {pendPct > 0 && (
                <div className="w-full bg-amber-400 flex-shrink-0" style={{ height: `${pendPct}%` }} />
              )}
              {paidPct > 0 && (
                <div className="w-full bg-green-500 flex-shrink-0" style={{ height: `${paidPct}%` }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1.5 px-3">
        {recent.map((d) => (
          <span key={d.month} className="flex-1 text-[8px] text-gray-400 text-center truncate min-w-0">
            {monthLabel(d.month)}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-5 mt-3 px-3">
        <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="inline-block w-3 h-3 bg-green-500 rounded-sm" /> Paid
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="inline-block w-3 h-3 bg-amber-400 rounded-sm" /> Pending
        </span>
        <span className="ml-auto text-[11px] text-gray-400">
          Hover bars for totals
        </span>
      </div>
    </div>
  );
}

// Single vertical bar chart — member growth per month
function MemberGrowthChart({ data }: { data: MemberMonth[] }) {
  const recent = data.slice(-12);
  const max = Math.max(...recent.map((d) => d.count), 1);
  if (recent.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-gray-400">No membership data yet.</p>;
  }
  return (
    <div className="px-5 py-4">
      <div className="flex items-end gap-1.5 h-32 bg-gray-50 rounded-xl px-3 pt-3 pb-0">
        {recent.map((d) => (
          <div
            key={d.month}
            className="flex-1 bg-indigo-500 rounded-t-sm min-w-0"
            style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 3 : 0)}%` }}
            title={`${monthLabel(d.month)}: ${d.count} member${d.count !== 1 ? "s" : ""}`}
          />
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5 px-3">
        {recent.map((d) => (
          <span key={d.month} className="flex-1 text-[8px] text-gray-400 text-center truncate min-w-0">
            {monthLabel(d.month)}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 mt-2 px-3">New members joined per month. Hover bars for exact count.</p>
    </div>
  );
}

// Horizontal bar (improved)
function HBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-3 mt-1.5">
      <div className={`h-3 rounded-full transition-all ${color}`} style={{ width: `${pct}%`, minWidth: value > 0 ? "6px" : "0" }} />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, iconBg, label, value, sub, subColor = "text-gray-400" }: {
  icon: React.ElementType; iconBg: string; label: string; value: string; sub?: string; subColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${iconBg}`}><Icon size={14} /></div>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      {sub && <div className={`text-xs mt-0.5 ${subColor}`}>{sub}</div>}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <h2 className="font-semibold text-sm text-gray-900">{title}</h2>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────

function Empty({ msg }: { msg: string }) {
  return <div className="px-5 py-10 text-center text-sm text-gray-400">{msg}</div>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview",   label: "Overview",   icon: BarChart2 },
  { key: "finances",   label: "Finances",   icon: CreditCard },
  { key: "attendance", label: "Attendance", icon: CalendarDays },
  { key: "members",    label: "Members",    icon: Users },
];

export default function ReportsPage() {
  const [data,    setData]    = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<Tab>("overview");
  const [year,    setYear]    = useState<number | "all">("all");
  const [attendanceSub, setAttendanceSub] = useState<"events" | "meetings">("events");

  useEffect(() => {
    setLoading(true);
    const url = year === "all" ? "/api/admin/reports" : `/api/admin/reports?year=${year}`;
    fetch(url)
      .then((r) => r.json())
      .then((json: { success: boolean; data: ReportData }) => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, [year]);

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
      <TrendingUp size={16} className="animate-pulse" /> Loading reports…
    </div>
  );
  if (!data)   return <div className="text-center py-20 text-red-400 text-sm">Failed to load reports.</div>;

  const {
    summary, duesByMonth, duesByCategory, expensesByMeeting,
    contributionsByMember, meetingStats, eventAttendance, membersByMonth,
  } = data;

  const maxCat  = Math.max(...duesByCategory.map((c) => c.paid + c.pending), 1);
  const maxContrib = contributionsByMember[0]?.total ?? 1;

  const tabVariants = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.15 } },
    exit:    { opacity: 0, y: -6, transition: { duration: 0.1 } },
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <BarChart2 size={22} className="text-indigo-500" /> Reports
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Financial summary, attendance, and member growth.</p>
        </div>
        {/* Year filter */}
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="all">All time</option>
            {(data?.availableYears ?? []).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {year !== "all" && (
            <button onClick={() => setYear("all")} className="text-xs text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="overflow-x-auto -mx-1 px-1 mb-6">
        <div className="flex gap-0.5 border-b border-gray-100 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  tab === t.key
                    ? "border-[#0a1040] text-[#0a1040]"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} variants={tabVariants} initial="initial" animate="animate" exit="exit">

          {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* Primary stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={CreditCard}
                  iconBg="bg-green-50"
                  label="Dues Collected"
                  value={fmt(summary.totalDuesPaid)}
                  sub={`${fmt(summary.totalDuesPending)} pending`}
                  subColor="text-amber-500"
                />
                <StatCard
                  icon={Receipt}
                  iconBg="bg-red-50"
                  label="Total Expenses"
                  value={fmt(summary.totalExpenses)}
                  sub={`${expensesByMeeting.length} meeting${expensesByMeeting.length !== 1 ? "s" : ""} with expenses`}
                />
                <StatCard
                  icon={Wallet}
                  iconBg="bg-indigo-50"
                  label="Contributions"
                  value={fmt(summary.totalContributions)}
                  sub={`${contributionsByMember.length} contributor${contributionsByMember.length !== 1 ? "s" : ""}`}
                />
                <div className={`rounded-xl border p-4 ${summary.netBalance >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg ${summary.netBalance >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                      {summary.netBalance >= 0
                        ? <ArrowUpRight size={14} className="text-green-600" />
                        : <ArrowDownRight size={14} className="text-red-500" />}
                    </div>
                    <span className="text-xs text-gray-500">Net Balance</span>
                  </div>
                  <div className={`text-xl font-bold ${summary.netBalance >= 0 ? "text-green-700" : "text-red-600"}`}>
                    {fmt(Math.abs(summary.netBalance))}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {summary.netBalance >= 0 ? "income exceeds expenses" : "expenses exceed income"}
                  </div>
                </div>
              </div>

              {/* Secondary stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={Users}    iconBg="bg-gray-100" label="Total Members"    value={String(summary.totalMembers)} />
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-violet-50 rounded-lg"><KeyRound size={14} className="text-violet-600" /></div>
                    <span className="text-xs text-gray-400">Portal Accounts</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{summary.activePortalAccounts}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-violet-500 h-1.5 rounded-full"
                        style={{ width: `${summary.totalMembers > 0 ? Math.round((summary.activePortalAccounts / summary.totalMembers) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-violet-600 font-medium">
                      {summary.totalMembers > 0 ? Math.round((summary.activePortalAccounts / summary.totalMembers) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <StatCard
                  icon={BarChart2}
                  iconBg="bg-gray-100"
                  label="Meetings"
                  value={String(meetingStats.length)}
                  sub={`${meetingStats.filter((m) => m.status === "scheduled").length} upcoming`}
                />
              </div>

              {/* Income breakdown */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <SectionHeader title="Income vs Expenses" sub="All-time summary" />
                <div className="px-5 py-4 space-y-3">
                  {([
                    { label: "Dues Paid",      value: summary.totalDuesPaid,      color: "bg-green-500",  total: summary.totalDuesPaid + summary.totalContributions + summary.totalExpenses },
                    { label: "Contributions",  value: summary.totalContributions, color: "bg-indigo-500", total: summary.totalDuesPaid + summary.totalContributions + summary.totalExpenses },
                    { label: "Expenses",       value: summary.totalExpenses,      color: "bg-red-400",    total: summary.totalDuesPaid + summary.totalContributions + summary.totalExpenses },
                  ]).map(({ label, value, color, total }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">{label}</span>
                        <span className="font-semibold text-gray-800">{fmt(value)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${color} transition-all`}
                          style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%", minWidth: value > 0 ? "6px" : "0" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── FINANCES ──────────────────────────────────────────────────── */}
          {tab === "finances" && (
            <div className="space-y-6">
              {/* Dues by month — vertical bar chart */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <SectionHeader title="Dues by Period" sub="Paid vs pending per month (last 12 months)" />
                <DuesBarChart data={duesByMonth} />
                {/* Detail list below chart */}
                {duesByMonth.length > 0 && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50 max-h-56 overflow-y-auto">
                    {duesByMonth.slice().reverse().slice(0, 12).map((d) => (
                      <div key={d.month} className="px-5 py-2.5 flex items-center justify-between text-xs">
                        <span className="text-gray-600 font-medium">{monthLabel(d.month)}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-green-600">{fmt(d.paid)}</span>
                          {d.pending > 0 && <span className="text-amber-500">{fmt(d.pending)} pending</span>}
                          <span className="text-gray-400 font-medium">{fmt(d.paid + d.pending)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Dues by category */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <SectionHeader title="Dues by Member Category" sub="Breakdown per membership type" />
                  {duesByCategory.length === 0 ? (
                    <Empty msg="No dues recorded yet." />
                  ) : (
                    <div className="px-5 py-4 space-y-4">
                      {duesByCategory.map((c) => {
                        const total = c.paid + c.pending;
                        return (
                          <div key={c.name}>
                            <div className="flex items-center justify-between text-xs mb-0.5">
                              <span className="font-medium text-gray-700">{c.name}</span>
                              <span className="text-gray-400">{c.count} record{c.count !== 1 ? "s" : ""}</span>
                            </div>
                            <HBar value={c.paid} max={maxCat} color="bg-green-500" />
                            <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                              <span className="text-green-600 font-medium">{fmt(c.paid)} paid</span>
                              {c.pending > 0 && <span className="text-amber-500">{fmt(c.pending)} pending</span>}
                              <span className="ml-auto">{fmt(total)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Expenses by meeting */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <SectionHeader title="Expenses by Meeting" />
                  {expensesByMeeting.length === 0 ? (
                    <Empty msg="No expenses recorded." />
                  ) : (
                    <>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Meeting</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                            <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {expensesByMeeting.map((e) => (
                            <tr key={e.title + e.scheduledAt} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3 font-medium text-gray-800">{e.title}</td>
                              <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{formatDate(e.scheduledAt)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-red-600">{fmt(e.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t border-gray-100 bg-gray-50">
                          <tr>
                            <td className="px-4 py-2.5 text-xs font-semibold text-gray-500" colSpan={2}>Total</td>
                            <td className="px-4 py-2.5 text-right text-xs font-bold text-red-600">
                              {fmt(expensesByMeeting.reduce((s, e) => s + e.total, 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── ATTENDANCE ────────────────────────────────────────────────── */}
          {tab === "attendance" && (
            <div className="space-y-4">
              {/* Sub-tab bar */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                <button
                  onClick={() => setAttendanceSub("events")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                    attendanceSub === "events"
                      ? "bg-white text-[#0a1040] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <CalendarDays size={12} /> Events
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${attendanceSub === "events" ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-500"}`}>
                    {eventAttendance.length}
                  </span>
                </button>
                <button
                  onClick={() => setAttendanceSub("meetings")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                    attendanceSub === "meetings"
                      ? "bg-white text-[#0a1040] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <BarChart2 size={12} /> Meetings
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${attendanceSub === "meetings" ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-500"}`}>
                    {meetingStats.length}
                  </span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={attendanceSub} variants={tabVariants} initial="initial" animate="animate" exit="exit">

                  {/* Event attendance */}
                  {attendanceSub === "events" && (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <SectionHeader title="Event Attendance (RSVPs)" sub="Portal member RSVPs per event" />
                      {eventAttendance.length === 0 ? (
                        <Empty msg="No events yet." />
                      ) : (
                        <>
                          {/* Mobile cards */}
                          <div className="sm:hidden divide-y divide-gray-50">
                            {eventAttendance.map((e) => (
                              <div key={e.id} className="px-4 py-3 flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{e.title}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(e.date)}</p>
                                </div>
                                <span className={`text-base font-bold flex-shrink-0 ${e.attending > 0 ? "text-green-600" : "text-gray-300"}`}>
                                  {e.attending}
                                </span>
                              </div>
                            ))}
                          </div>
                          {/* Desktop table */}
                          <table className="hidden sm:table w-full text-sm">
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
                                    <span className={`text-sm font-bold ${e.attending > 0 ? "text-green-600" : "text-gray-300"}`}>
                                      {e.attending}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </>
                      )}
                    </div>
                  )}

                  {/* Meeting attendance */}
                  {attendanceSub === "meetings" && (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <SectionHeader title="Meeting Attendance (RSVPs)" sub="Portal member RSVPs per meeting" />
                      {meetingStats.length === 0 ? (
                        <Empty msg="No meetings yet." />
                      ) : (
                        <>
                          {/* Mobile cards */}
                          <div className="sm:hidden divide-y divide-gray-50">
                            {meetingStats.map((m) => (
                              <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{m.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 uppercase">{m.type}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                      m.status === "scheduled" ? "bg-green-50 text-green-700" :
                                      m.status === "completed" ? "bg-gray-100 text-gray-500" : "bg-red-50 text-red-600"
                                    }`}>{m.status}</span>
                                    <span className="text-xs text-gray-400">{formatDate(m.scheduledAt)}</span>
                                  </div>
                                </div>
                                <span className={`text-base font-bold flex-shrink-0 ${m.attending > 0 ? "text-green-600" : "text-gray-300"}`}>
                                  {m.attending}
                                </span>
                              </div>
                            ))}
                          </div>
                          {/* Desktop table */}
                          <table className="hidden sm:table w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                              <tr>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Meeting</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Type</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">RSVPs</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {meetingStats.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50/50">
                                  <td className="px-4 py-3 font-medium text-gray-800">{m.title}</td>
                                  <td className="px-4 py-3 hidden md:table-cell">
                                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 uppercase">{m.type}</span>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(m.scheduledAt)}</td>
                                  <td className="px-4 py-3">
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                      m.status === "scheduled" ? "bg-green-50 text-green-700" :
                                      m.status === "completed" ? "bg-gray-100 text-gray-500" : "bg-red-50 text-red-600"
                                    }`}>{m.status}</span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <span className={`text-sm font-bold ${m.attending > 0 ? "text-green-600" : "text-gray-300"}`}>
                                      {m.attending}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </>
                      )}
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* ── MEMBERS ───────────────────────────────────────────────────── */}
          {tab === "members" && (
            <div className="space-y-6">
              {/* Member growth — vertical bar chart */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <SectionHeader title="Member Growth" sub="New members joined per month (last 12 months)" />
                <MemberGrowthChart data={membersByMonth} />
                {membersByMonth.length > 0 && (
                  <div className="border-t border-gray-50 px-5 py-3 flex items-center justify-between text-xs text-gray-400">
                    <span>Total: <span className="font-semibold text-gray-700">{summary.totalMembers} members</span></span>
                    <span>
                      Portal adoption:{" "}
                      <span className="font-semibold text-violet-600">
                        {summary.totalMembers > 0
                          ? `${Math.round((summary.activePortalAccounts / summary.totalMembers) * 100)}%`
                          : "—"}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Top contributors */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <SectionHeader title="Top Contributors" sub="Member meeting contributions (paid), ranked by total" />
                {contributionsByMember.length === 0 ? (
                  <Empty msg="No contributions recorded." />
                ) : (
                  <div className="divide-y divide-gray-50">
                    {contributionsByMember.map((c, i) => (
                      <div key={c.name} className="px-5 py-3.5 flex items-center gap-4">
                        <span className={`text-xs font-bold w-5 text-right flex-shrink-0 ${
                          i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-gray-300"
                        }`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800 truncate">{c.name}</span>
                            <span className="text-sm font-bold text-indigo-700 flex-shrink-0 ml-2">{fmt(c.total)}</span>
                          </div>
                          <HBar value={c.total} max={maxContrib} color="bg-indigo-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Portal adoption card */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <SectionHeader title="Portal Account Adoption" sub="Members with active portal accounts" />
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-600">{summary.activePortalAccounts} of {summary.totalMembers} members</span>
                    <span className="font-bold text-violet-700">
                      {summary.totalMembers > 0 ? Math.round((summary.activePortalAccounts / summary.totalMembers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-4 bg-violet-500 rounded-full transition-all"
                      style={{
                        width: summary.totalMembers > 0
                          ? `${(summary.activePortalAccounts / summary.totalMembers) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {summary.totalMembers - summary.activePortalAccounts} member{summary.totalMembers - summary.activePortalAccounts !== 1 ? "s" : ""} without portal access.
                    Create portal accounts from <span className="text-[#0a1040] font-medium">Admin → Portal Accounts</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
