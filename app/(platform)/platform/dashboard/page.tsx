import { prisma } from "@/lib/prisma";
import { getPlatformUser } from "@/lib/platformAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Users, Calendar, Newspaper, CheckCircle, XCircle, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlatformDashboardPage() {
  const user = await getPlatformUser();
  if (!user) redirect("/platform/login");

  const [associations, totalMembers, totalEvents, totalNews, recentLogs] = await Promise.all([
    prisma.association.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            memberLinks: true,
            events: true,
            news: true,
            committee: true,
            admins: true,
          },
        },
      },
    }),
    prisma.memberAssociation.count(),
    prisma.event.count(),
    prisma.news.count(),
    prisma.apiLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { association: { select: { name: true, slug: true } } },
    }),
  ]);

  const activeCount = associations.filter((a) => a.active).length;

  const platformStats = [
    { label: "Associations", value: `${activeCount} / ${associations.length}`, sub: "active / total", icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total Members", value: totalMembers.toLocaleString(), sub: "across all associations", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Events", value: totalEvents.toLocaleString(), sub: "across all associations", icon: Calendar, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total News", value: totalNews.toLocaleString(), sub: "articles published", icon: Newspaper, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Welcome back, {user.name} · All associations overview</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {platformStats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
            <div className="text-xs text-gray-400">{sub}</div>
            <div className="text-sm font-medium text-gray-600 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Associations table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Associations</h2>
          <Link href="/platform/associations" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            View all →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Association</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Domain</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Members</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Events</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">News</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {associations.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-900">{a.name}</div>
                  <div className="text-xs text-gray-400">/{a.slug}</div>
                </td>
                <td className="px-5 py-3 text-gray-500 font-mono text-xs">{a.domain}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full capitalize">
                    {a.plan}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-gray-700 font-medium">{a._count.memberLinks}</td>
                <td className="px-5 py-3 text-right text-gray-500">{a._count.events}</td>
                <td className="px-5 py-3 text-right text-gray-500">{a._count.news}</td>
                <td className="px-5 py-3">
                  {a.active ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700">
                      <CheckCircle size={12} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-red-500">
                      <XCircle size={12} /> Inactive
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/platform/associations/${a.id}`}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent API logs */}
      {recentLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent API Activity</h2>
            <Link href="/platform/logs" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Path</th>
                <th className="text-left px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Method</th>
                <th className="text-left px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Association</th>
                <th className="text-right px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Time (ms)</th>
                <th className="text-left px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-2.5 font-mono text-gray-700">{log.path}</td>
                  <td className="px-5 py-2.5">
                    <span className="font-semibold text-gray-600 uppercase">{log.method}</span>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={`font-bold ${
                      log.statusCode < 300 ? "text-green-600" :
                      log.statusCode < 400 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-gray-500">{log.association?.name ?? "—"}</td>
                  <td className="px-5 py-2.5 text-right text-gray-500">{log.responseTimeMs}</td>
                  <td className="px-5 py-2.5 text-gray-400">
                    {new Date(log.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
