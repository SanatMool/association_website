"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users, Calendar, Newspaper, Award, Settings, CheckCircle, AlertCircle,
  UserCog, CheckSquare, Circle, Clock, AlertTriangle, Bell, LayoutDashboard,
  Activity, ArrowRight, TrendingUp, Plus, Tag, CreditCard, CalendarDays, Landmark, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import StatCard from "@/components/ui/panel/StatCard";
import PanelCard from "@/components/ui/panel/PanelCard";

interface ChecklistItem { label: string; done: boolean; href: string }
interface RecentMember  { id: string; name: string; area: string; createdAt: string }
interface RecentNews    { id: string; title: string; publishedAt: string }
interface RecentEvent   { id: string; title: string; status: string; date: string }
interface PendingTask   { id: string; title: string; status: string; priority: string; dueDate: string | null }
interface OverdueTask   { id: string; title: string; dueDate: string | null; priority: string }
interface UpcomingMtg   { id: string; title: string; scheduledAt: string; type: string }
interface ActivityLogRow {
  id: string; action: string; entityType: string; entityName: string | null;
  adminName: string | null; createdAt: string; meta: Record<string, unknown> | null;
}

interface Props {
  memberCount:      number;
  eventCount:       number;
  newsCount:        number;
  committeeCount:   number;
  recentMembers:    RecentMember[];
  recentNews:       RecentNews[];
  recentEvents:     RecentEvent[];
  checklist:        ChecklistItem[];
  completedCount:   number;
  pendingTasks:     PendingTask[];
  overdueTasks:     OverdueTask[];
  upcomingMeetings: UpcomingMtg[];
  pendingDuesCount: number;
  activityLogs:     ActivityLogRow[];
  ledgerSummary:    { label: string; totalIncome: number; totalExpense: number; netBalance: number } | null;
}

const TABS = [
  { key: "overview",  label: "Overview",  icon: LayoutDashboard },
  { key: "tasks",     label: "Tasks",     icon: CheckSquare },
  { key: "reminders", label: "Reminders", icon: Bell },
  { key: "activity",  label: "Activity",  icon: Activity },
] as const;

type TabKey = typeof TABS[number]["key"];

// ── Activity log helpers ────────────────────────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
  "member.create":          "Added member",
  "member.update":          "Updated member",
  "member.delete":          "Deleted member",
  "event.create":           "Created event",
  "event.update":           "Updated event",
  "event.delete":           "Deleted event",
  "news.create":            "Published news",
  "news.update":            "Updated news",
  "news.delete":            "Deleted news",
  "committee.create":       "Added committee member",
  "committee.update":       "Updated committee member",
  "committee.delete":       "Removed committee member",
  "committee.archive":      "Archived committee",
  "meeting.create":         "Created meeting",
  "meeting.delete":         "Deleted meeting",
  "task.create":            "Created task",
  "task.complete":          "Completed task",
  "task.delete":            "Deleted task",
  "application.accept":     "Accepted application",
  "application.reviewed":   "Marked reviewed",
  "application.rejected":   "Rejected application",
  "application.pending":    "Reset to pending",
  "application.delete":     "Deleted application",
  "dues.record_paid":       "Recorded payment",
  "dues.record_pending":    "Added pending due",
};

const ACTION_COLORS: Record<string, string> = {
  "member.create": "bg-blue-100 text-blue-700",
  "member.delete": "bg-red-100 text-red-700",
  "event.create":  "bg-green-100 text-green-700",
  "event.delete":  "bg-red-100 text-red-700",
  "news.create":   "bg-amber-100 text-amber-700",
  "news.delete":   "bg-red-100 text-red-700",
  "committee.archive": "bg-slate-100 text-slate-600",
  "application.accept": "bg-emerald-100 text-emerald-700",
  "application.rejected": "bg-red-100 text-red-700",
  "dues.record_paid": "bg-teal-100 text-teal-700",
  "task.complete": "bg-indigo-100 text-indigo-700",
};

function actionLabel(action: string)  { return ACTION_LABELS[action]  ?? action; }
function actionColor(action: string)  { return ACTION_COLORS[action]  ?? "bg-gray-100 text-gray-600"; }

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function DashboardClient({
  memberCount, eventCount, newsCount, committeeCount,
  recentMembers, recentNews, recentEvents,
  checklist, completedCount,
  pendingTasks, overdueTasks, upcomingMeetings, pendingDuesCount, activityLogs, ledgerSummary,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const reminderCount = overdueTasks.length + upcomingMeetings.length + (pendingDuesCount > 0 ? 1 : 0);

  const entityStats = [
    { label: "Members",        count: memberCount,    href: "/admin/members",   icon: Users },
    { label: "Events",         count: eventCount,     href: "/admin/events",    icon: Calendar },
    { label: "News Articles",  count: newsCount,      href: "/admin/news",      icon: Newspaper },
    { label: "Committee",      count: committeeCount, href: "/admin/committee", icon: Award },
  ];

  const quickActions = [
    { href: "/admin/members/new",             label: "Add Member",     icon: Users,       color: "bg-blue-600" },
    { href: "/admin/events/new",              label: "Add Event",      icon: Calendar,    color: "bg-green-600" },
    { href: "/admin/news/new",                label: "Add News",       icon: Newspaper,   color: "bg-amber-600" },
    { href: "/admin/committee/new",           label: "Add Committee",  icon: Award,       color: "bg-purple-600" },
    { href: "/admin/meetings/new",            label: "Add Meeting",    icon: CalendarDays,color: "bg-teal-600" },
    { href: "/admin/membership/dues",         label: "Dues",           icon: CreditCard,  color: "bg-rose-600" },
    { href: "/admin/tasks",                   label: "Tasks",          icon: CheckSquare, color: "bg-indigo-600" },
    { href: "/admin/settings",               label: "Settings",       icon: Settings,    color: "bg-slate-600" },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard size={22} className="text-[#0a1040]" />
          Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Content management overview</p>
      </div>

      {/* Stats banner */}
      <div className="relative bg-mesh-navy rounded-3xl p-5 sm:p-6 mb-6 overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
          {entityStats.map(({ label, count, href, icon: Icon }) => (
            <Link key={label} href={href}>
              <StatCard label={label} value={count} icon={Icon} accent="gold" />
            </Link>
          ))}
        </div>
      </div>

      {/* Financial year summary (Phase D) */}
      {ledgerSummary && (
        <div className="mb-6">
          <Link href="/admin/finances"
            className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-2 hover:text-gray-600 transition-colors">
            <Landmark size={12} /> {ledgerSummary.label} — Financial Ledger
            <ArrowRight size={11} className="ml-auto" />
          </Link>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-100 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-green-600 mb-1.5">
                <ArrowUpRight size={11} /> Income
              </div>
              <div className="text-lg font-bold text-green-700">
                Rs {Math.round(ledgerSummary.totalIncome).toLocaleString()}
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-red-500 mb-1.5">
                <ArrowDownRight size={11} /> Expenses
              </div>
              <div className="text-lg font-bold text-red-600">
                Rs {Math.round(ledgerSummary.totalExpense).toLocaleString()}
              </div>
            </div>
            <div className={`${ledgerSummary.netBalance >= 0 ? "bg-indigo-50 border-indigo-100" : "bg-amber-50 border-amber-100"} border rounded-xl p-3.5`}>
              <div className={`flex items-center gap-1.5 text-[11px] mb-1.5 ${ledgerSummary.netBalance >= 0 ? "text-indigo-600" : "text-amber-600"}`}>
                <Landmark size={11} /> Net Balance
              </div>
              <div className={`text-lg font-bold ${ledgerSummary.netBalance >= 0 ? "text-indigo-700" : "text-amber-700"}`}>
                Rs {Math.round(Math.abs(ledgerSummary.netBalance)).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar — scrollable on mobile */}
      <div className="overflow-x-auto -mx-1 px-1 mb-6">
        <div className="flex items-center gap-1 border-b border-gray-100 min-w-max">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
                activeTab === key
                  ? "text-[#0a1040] border-b-2 border-[#0a1040] -mb-px bg-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={14} />
              {label}
              {key === "reminders" && reminderCount > 0 && (
                <span className="ml-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {reminderCount}
                </span>
              )}
              {key === "tasks" && pendingTasks.length > 0 && (
                <span className="ml-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {pendingTasks.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Setup Checklist */}
              <PanelCard className="lg:col-span-1 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 text-sm">Setup Checklist</h2>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    {completedCount}/{checklist.length}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${(completedCount / checklist.length) * 100}%` }}
                  />
                </div>
                <ul className="space-y-1.5">
                  {checklist.map(({ label, done, href }) => (
                    <li key={label}>
                      <Link href={href} className="flex items-center gap-2.5 text-sm py-1 rounded-lg group">
                        {done ? (
                          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
                        )}
                        <span className={`flex-1 text-xs ${done ? "text-gray-300 line-through" : "text-gray-700 group-hover:text-[#0a1040]"} transition-colors`}>
                          {label}
                        </span>
                        {!done && <ArrowRight size={11} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </PanelCard>

              {/* Quick Actions */}
              <PanelCard className="lg:col-span-2 p-5">
                <h2 className="font-semibold text-gray-900 text-sm mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {quickActions.map(({ href, label, icon: Icon, color }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                    >
                      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                        <Icon size={15} className="text-white" />
                      </div>
                      <span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-900 text-center leading-tight">{label}</span>
                    </Link>
                  ))}
                </div>

                {/* Pending dues quick banner */}
                {pendingDuesCount > 0 && (
                  <Link
                    href="/admin/membership/dues"
                    className="mt-4 flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Tag size={14} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-800">
                        {pendingDuesCount} pending payment{pendingDuesCount !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-amber-600">Dues awaiting collection</p>
                    </div>
                    <ArrowRight size={14} className="text-amber-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </Link>
                )}
              </PanelCard>
            </div>
          )}

          {/* ── TASKS ── */}
          {activeTab === "tasks" && (
            <PanelCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900 text-sm">Pending Tasks</h2>
                  {pendingTasks.length > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {pendingTasks.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/admin/tasks/new" className="text-xs text-[#0a1040] hover:text-[#0d1550] font-medium flex items-center gap-1">
                    <Plus size={11} /> New
                  </Link>
                  <Link href="/admin/tasks" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                    All tasks →
                  </Link>
                </div>
              </div>
              {pendingTasks.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">All caught up! No pending tasks.</p>
                  <Link href="/admin/tasks" className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-2 inline-block">
                    Add a task →
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {pendingTasks.map((task) => {
                    const overdue = task.dueDate && new Date(task.dueDate) < new Date();
                    return (
                      <Link
                        key={task.id}
                        href="/admin/tasks"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                          overdue ? "bg-red-50 hover:bg-red-100/60" : "hover:bg-gray-50"
                        }`}
                      >
                        {task.status === "in_progress" ? (
                          <Clock size={14} className="text-blue-500 flex-shrink-0" />
                        ) : (
                          <Circle size={14} className="text-gray-300 flex-shrink-0" />
                        )}
                        <span className="flex-1 text-sm text-gray-700 group-hover:text-gray-900 truncate">{task.title}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {overdue && <AlertTriangle size={12} className="text-red-500" />}
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            task.priority === "high" ? "bg-red-50 text-red-700"
                              : task.priority === "medium" ? "bg-amber-50 text-amber-700"
                              : "bg-green-50 text-green-700"
                          }`}>
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-gray-400"}`}>
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </PanelCard>
          )}

          {/* ── REMINDERS ── */}
          {activeTab === "reminders" && (
            <div className="space-y-4">
              {reminderCount === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                  <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No reminders right now. Everything is on track.</p>
                </div>
              ) : (
                <>
                  {overdueTasks.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={15} className="text-red-600" />
                        <h2 className="font-semibold text-red-900 text-sm">Overdue Tasks ({overdueTasks.length})</h2>
                      </div>
                      <ul className="space-y-2">
                        {overdueTasks.map((t) => (
                          <li key={t.id}>
                            <Link href="/admin/tasks" className="flex items-start gap-2 text-sm group">
                              <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                              <span className="text-red-700 group-hover:underline">
                                <strong>{t.title}</strong>
                                {t.dueDate && <span className="text-red-500 font-normal ml-1">— was due {formatDate(t.dueDate)}</span>}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {upcomingMeetings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar size={15} className="text-amber-600" />
                        <h2 className="font-semibold text-amber-900 text-sm">Upcoming Meetings This Week ({upcomingMeetings.length})</h2>
                      </div>
                      <ul className="space-y-2">
                        {upcomingMeetings.map((m) => (
                          <li key={m.id}>
                            <Link href={`/admin/meetings/${m.id}`} className="flex items-start gap-2 text-sm group">
                              <Calendar size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                              <span className="text-amber-800 group-hover:underline">
                                <strong>{m.title}</strong>
                                <span className="text-amber-600 font-normal ml-1">— {formatDate(m.scheduledAt)}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {pendingDuesCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={15} className="text-amber-600" />
                        <h2 className="font-semibold text-amber-900 text-sm">Pending Dues</h2>
                      </div>
                      <Link href="/admin/membership/dues" className="flex items-start gap-2 text-sm group">
                        <Clock size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <span className="text-amber-800 group-hover:underline">
                          <strong>{pendingDuesCount}</strong> pending dues payment{pendingDuesCount !== 1 ? "s" : ""} awaiting collection.
                        </span>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── ACTIVITY ── */}
          {activeTab === "activity" && (
            <PanelCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                  <Activity size={14} className="text-gray-400" />
                  Recent Activity
                </h2>
                <Link href="/admin/activity" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                  Full log →
                </Link>
              </div>
              {activityLogs.length === 0 ? (
                <div className="text-center py-10">
                  <Activity size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No activity recorded yet.</p>
                  <p className="text-xs text-gray-300 mt-1">Actions you take will appear here.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className={`mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${actionColor(log.action)}`}>
                        {actionLabel(log.action)}
                      </span>
                      <div className="flex-1 min-w-0">
                        {log.entityName && (
                          <p className="text-sm text-gray-800 truncate">{log.entityName}</p>
                        )}
                        {log.adminName && (
                          <p className="text-xs text-gray-400">{log.adminName}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 pt-0.5">{relativeTime(log.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </PanelCard>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
