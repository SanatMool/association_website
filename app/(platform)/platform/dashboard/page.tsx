import { prisma } from "@/lib/prisma";
import { getPlatformUser } from "@/lib/platformAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { PanelTable, PanelTableHead, PanelTableRow } from "@/components/ui/panel/PanelTable";
import Badge from "@/components/ui/panel/Badge";
import StatsRow from "./StatsRow";

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Welcome back, {user.name} · All associations overview</p>
      </div>

      {/* Top stats */}
      <div className="relative bg-mesh-indigo rounded-3xl p-5 sm:p-6 mb-8 overflow-hidden">
        <StatsRow
          activeCount={activeCount}
          totalAssociations={associations.length}
          totalMembers={totalMembers}
          totalEvents={totalEvents}
          totalNews={totalNews}
        />
      </div>

      {/* Associations table */}
      <PanelTable className="mb-8">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Associations</h2>
          <Link href="/platform/associations" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            View all →
          </Link>
        </div>
        <table className="w-full text-sm">
          <PanelTableHead>
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
          </PanelTableHead>
          <tbody className="divide-y divide-slate-50">
            {associations.map((a, i) => (
              <PanelTableRow key={a.id} index={i}>
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-900">{a.name}</div>
                  <div className="text-xs text-gray-400">/{a.slug}</div>
                </td>
                <td className="px-5 py-3 text-gray-500 font-mono text-xs">{a.domain}</td>
                <td className="px-5 py-3">
                  <Badge tone="info" className="capitalize">{a.plan}</Badge>
                </td>
                <td className="px-5 py-3 text-right text-gray-700 font-medium">{a._count.memberLinks}</td>
                <td className="px-5 py-3 text-right text-gray-500">{a._count.events}</td>
                <td className="px-5 py-3 text-right text-gray-500">{a._count.news}</td>
                <td className="px-5 py-3">
                  {a.active ? (
                    <Badge tone="success" icon={<CheckCircle size={11} />}>Active</Badge>
                  ) : (
                    <Badge tone="danger" icon={<XCircle size={11} />}>Inactive</Badge>
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
              </PanelTableRow>
            ))}
          </tbody>
        </table>
      </PanelTable>

      {/* Recent API logs */}
      {recentLogs.length > 0 && (
        <PanelTable>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent API Activity</h2>
            <Link href="/platform/logs" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>
          <table className="w-full text-xs">
            <PanelTableHead>
              <tr>
                <th className="text-left px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Path</th>
                <th className="text-left px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Method</th>
                <th className="text-left px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Association</th>
                <th className="text-right px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Time (ms)</th>
                <th className="text-left px-5 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">When</th>
              </tr>
            </PanelTableHead>
            <tbody className="divide-y divide-slate-50">
              {recentLogs.map((log, i) => (
                <PanelTableRow key={log.id} index={i}>
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
                </PanelTableRow>
              ))}
            </tbody>
          </table>
        </PanelTable>
      )}
    </div>
  );
}
