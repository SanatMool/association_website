"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users, Calendar, Newspaper, Award, Settings, CheckCircle, AlertCircle,
  UserCog, CheckSquare, Circle, Clock, AlertTriangle, Bell, LayoutDashboard,
  Activity, ArrowRight, TrendingUp, Plus, Tag, CreditCard, CalendarDays,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChecklistItem { label: string; done: boolean; href: string }
interface RecentMember  { id: string; name: string; area: string; createdAt: string }
interface RecentNews    { id: string; title: string; publishedAt: string }
interface RecentEvent   { id: string; title: string; status: string; date: string }
interface PendingTask   { id: string; title: string; status: string; priority: string; dueDate: string | null }
interface OverdueTask   { id: string; title: string; dueDate: string | null; priority: string }
interface UpcomingMtg   { id: string; title: string; scheduledAt: string; type: string }

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
}

const TABS = [
  { key: "overview",  label: "Overview",  icon: LayoutDashboard },
  { key: "tasks",     label: "Tasks",     icon: CheckSquare },
  { key: "reminders", label: "Reminders", icon: Bell },
  { key: "activity",  label: "Activity",  icon: Activity },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function DashboardClient({
  memberCount, eventCount, newsCount, committeeCount,
  recentMembers, recentNews, recentEvents,
  checklist, completedCount,
  pendingTasks, overdueTasks, upcomingMeetings, pendingDuesCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const reminderCount = overdueTasks.length + upcomingMeetings.length + (pendingDuesCount > 0 ? 1 : 0);

  const entityStats = [
    { label: "Members",        count: memberCount,    href: "/admin/members",   icon: Users,     color: "text-blue-600",   bg: "bg-blue-50",   ring: "group-hover:ring-blue-200" },
    { label: "Events",         count: eventCount,     href: "/admin/events",    icon: Calendar,  color: "text-green-600",  bg: "bg-green-50",  ring: "group-hover:ring-green-200" },
    { label: "News Articles",  count: newsCount,      href: "/admin/news",      icon: Newspaper, color: "text-amber-600",  bg: "bg-amber-50",  ring: "group-hover:ring-amber-200" },
    { label: "Committee",      count: committeeCount, href: "/admin/committee", icon: Award,     color: "text-purple-600", bg: "bg-purple-50", ring: "group-hover:ring-purple-200" },
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {entityStats.map(({ label, count, href, icon: Icon, color, bg, ring }) => (
          <Link
            key={label}
            href={href}
            className={`group bg-white rounded-xl border border-gray-100 p-4 sm:p-5 hover:shadow-md hover:ring-2 ring-transparent ${ring} transition-all`}
          >
            <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-0.5 tabular-nums">{count}</div>
            <div className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-700 transition-colors leading-tight">{label}</div>
          </Link>
        ))}
      </div>

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
              <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 p-5">
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
              </div>

              {/* Quick Actions */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
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
              </div>
            </div>
          )}

          {/* ── TASKS ── */}
          {activeTab === "tasks" && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
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
            </div>
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
            <div className="space-y-4">
              {/* Recent members */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                    <Users size={14} className="text-gray-400" />
                    Recent Members
                  </h2>
                  <Link href="/admin/members" className="text-xs text-amber-600 hover:text-amber-700 font-medium">View all →</Link>
                </div>
                {recentMembers.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No members yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {recentMembers.map((m) => (
                      <Link key={m.id} href={`/admin/members/${m.id}`} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 group">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-blue-600">{m.name[0]}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900 group-hover:text-[#0a1040]">{m.name}</span>
                            <span className="text-xs text-gray-400 ml-2">{m.area}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(m.createdAt)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* News + Events */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                      <Newspaper size={13} className="text-gray-400" />
                      Latest News
                    </h2>
                    <Link href="/admin/news" className="text-xs text-amber-600 font-medium">All →</Link>
                  </div>
                  {recentNews.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">No articles yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {recentNews.map((n) => (
                        <Link key={n.id} href={`/admin/news/${n.id}`} className="block group">
                          <p className="text-sm text-gray-700 line-clamp-1 group-hover:text-[#0a1040]">{n.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.publishedAt)}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-400" />
                      Latest Events
                    </h2>
                    <Link href="/admin/events" className="text-xs text-amber-600 font-medium">All →</Link>
                  </div>
                  {recentEvents.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">No events yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {recentEvents.map((e) => (
                        <Link key={e.id} href={`/admin/events/${e.id}`} className="block group">
                          <p className="text-sm text-gray-700 line-clamp-1 group-hover:text-[#0a1040]">{e.title}</p>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block ${
                            e.status === "upcoming" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>{e.status}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
