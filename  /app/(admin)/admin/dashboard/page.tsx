import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Calendar, Newspaper, Award, Plus, Settings, CheckCircle, AlertCircle, UserCog, CheckSquare, Circle, Clock, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const [memberCount, eventCount, newsCount, committeeCount, recentMembers, recentNews, recentEvents, settings, pendingTasks] =
    await Promise.all([
      prisma.member.count(),
      prisma.event.count(),
      prisma.news.count(),
      prisma.committeeMember.count(),
      prisma.member.findMany({ take: 4, orderBy: { createdAt: "desc" }, select: { id: true, name: true, area: true, createdAt: true } }),
      prisma.news.findMany({ take: 3, orderBy: { publishedAt: "desc" }, select: { id: true, title: true, publishedAt: true } }),
      prisma.event.findMany({ take: 3, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true, date: true } }),
      prisma.siteSettings.findMany({ select: { key: true, value: true } }),
      prisma.adminTask.findMany({
        where: { status: { not: "done" } },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "asc" }],
        take: 6,
      }),
    ]);

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const checklist = [
    { label: "Set real phone number", done: !settingsMap["contact_phone"]?.includes("XXXXXXX"), href: "/admin/settings" },
    { label: "Set Facebook URL", done: settingsMap["social_facebook"] !== "https://facebook.com/evanepal", href: "/admin/settings" },
    { label: "Set Instagram URL", done: settingsMap["social_instagram"] !== "https://instagram.com/evanepal", href: "/admin/settings" },
    { label: "Add member venues", done: memberCount > 10, href: "/admin/members" },
    { label: "Add upcoming events", done: eventCount > 0, href: "/admin/events" },
    { label: "Publish news articles", done: newsCount > 0, href: "/admin/news" },
    { label: "Add committee members", done: committeeCount > 0, href: "/admin/committee" },
    { label: "Change default admin password", done: false, href: "/admin/users" },
  ];

  const completedCount = checklist.filter((c) => c.done).length;

  const entityStats = [
    { label: "Members", count: memberCount, href: "/admin/members", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Events", count: eventCount, href: "/admin/events", icon: Calendar, color: "text-green-600", bg: "bg-green-50" },
    { label: "News Articles", count: newsCount, href: "/admin/news", icon: Newspaper, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Committee", count: committeeCount, href: "/admin/committee", icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const quickActions = [
    { href: "/admin/members/new",   label: "Add Member",    icon: Users,     color: "bg-blue-600" },
    { href: "/admin/events/new",    label: "Add Event",     icon: Calendar,  color: "bg-green-600" },
    { href: "/admin/news/new",      label: "Add News",      icon: Newspaper, color: "bg-amber-600" },
    { href: "/admin/committee/new", label: "Add Committee", icon: Award,     color: "bg-purple-600" },
    { href: "/admin/tasks",         label: "Tasks",         icon: CheckSquare, color: "bg-indigo-600" },
    { href: "/admin/settings",      label: "Settings",      icon: Settings,  color: "bg-slate-600" },
    { href: "/admin/users/new",     label: "Add User",      icon: UserCog,   color: "bg-[#0a1040]" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">EVA Nepal content management overview</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {entityStats.map(({ label, count, href, icon: Icon, color, bg }) => (
          <Link key={label} href={href} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow group">
            <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-0.5">{count}</div>
            <div className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Completion checklist */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Setup Checklist</h2>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700">
              {completedCount}/{checklist.length}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${(completedCount / checklist.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-2">
            {checklist.map(({ label, done, href }) => (
              <li key={label}>
                <Link href={href} className="flex items-center gap-2.5 text-sm py-1 group">
                  {done ? (
                    <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="text-amber-400 flex-shrink-0" />
                  )}
                  <span className={`${done ? "text-gray-400 line-through" : "text-gray-700 group-hover:text-[#0a1040]"} transition-colors`}>
                    {label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent members */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Recent Members</h2>
              <Link href="/admin/members" className="text-xs text-amber-600 hover:text-amber-700 font-medium">View all →</Link>
            </div>
            <div className="space-y-2">
              {recentMembers.map((m) => (
                <Link key={m.id} href={`/admin/members/${m.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 group">
                  <div>
                    <span className="text-sm font-medium text-gray-900 group-hover:text-[#0a1040]">{m.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{m.area}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(m.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent news + events row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 text-sm">Latest News</h2>
                <Link href="/admin/news" className="text-xs text-amber-600 font-medium">All →</Link>
              </div>
              <div className="space-y-2">
                {recentNews.map((n) => (
                  <Link key={n.id} href={`/admin/news/${n.id}`} className="block">
                    <p className="text-sm text-gray-700 line-clamp-1 hover:text-[#0a1040]">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(n.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 text-sm">Latest Events</h2>
                <Link href="/admin/events" className="text-xs text-amber-600 font-medium">All →</Link>
              </div>
              <div className="space-y-2">
                {recentEvents.map((e) => (
                  <Link key={e.id} href={`/admin/events/${e.id}`} className="block">
                    <p className="text-sm text-gray-700 line-clamp-1 hover:text-[#0a1040]">{e.title}</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block ${
                      e.status === "upcoming" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>{e.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks widget */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">Pending Tasks</h2>
            {pendingTasks.length > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                {pendingTasks.length}
              </span>
            )}
          </div>
          <Link href="/admin/tasks" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
            Manage →
          </Link>
        </div>
        {pendingTasks.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">All caught up! No pending tasks.</p>
            <Link href="/admin/tasks" className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-1 inline-block">
              Add a task →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => {
              const overdue = task.dueDate && new Date(task.dueDate) < new Date();
              return (
                <Link
                  key={task.id}
                  href="/admin/tasks"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
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
                      task.priority === "high"
                        ? "bg-red-50 text-red-700"
                        : task.priority === "medium"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-green-50 text-green-700"
                    }`}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-gray-400"}`}>
                        {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {quickActions.map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <Icon size={16} className="text-white" />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
