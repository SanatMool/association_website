import { prisma } from "@/lib/prisma";
import { getPlatformUser } from "@/lib/platformAuth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Users, Calendar, Newspaper, Award, Clock, ExternalLink, Pencil } from "lucide-react";
import AiQuotaManager from "./AiQuotaManager";
import DeleteAssociationButton from "./DeleteAssociationButton";
import PanelCard from "@/components/ui/panel/PanelCard";
import { PanelTable, PanelTableHead, PanelTableRow } from "@/components/ui/panel/PanelTable";
import Badge from "@/components/ui/panel/Badge";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function AssociationDetailPage({ params }: Props) {
  const user = await getPlatformUser();
  if (!user) redirect("/platform/login");

  const association = await prisma.association.findUnique({
    where: { id: params.id },
    include: {
      admins: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          memberLinks: true,
          events: true,
          news: true,
          committee: true,
          timeline: true,
          admins: true,
        },
      },
    },
  });

  if (!association) notFound();

  const today = new Date().toISOString().substring(0, 10);
  const [recentLogs, aiLimitSetting, aiEnabledSetting, aiUsageToday] = await Promise.all([
    prisma.apiLog.findMany({
      where: { associationId: association.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.siteSettings.findUnique({
      where: { key_associationId: { key: "ai_daily_limit", associationId: association.id } },
    }),
    prisma.siteSettings.findUnique({
      where: { key_associationId: { key: "ai_enabled", associationId: association.id } },
    }),
    prisma.aiUsage.findUnique({
      where: { associationId_date: { associationId: association.id, date: today } },
    }),
  ]);

  const aiLimit   = parseInt(aiLimitSetting?.value ?? "50", 10);
  const aiUsed    = aiUsageToday?.count ?? 0;
  const aiEnabled = aiEnabledSetting?.value !== "false";
  const aiQuota   = { used: aiUsed, limit: aiLimit, remaining: Math.max(0, aiLimit - aiUsed), date: today, enabled: aiEnabled };

  const statCards = [
    { label: "Members", value: association._count.memberLinks, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Events", value: association._count.events, icon: Calendar, color: "text-green-600", bg: "bg-green-50" },
    { label: "News Articles", value: association._count.news, icon: Newspaper, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Committee", value: association._count.committee, icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Timeline Entries", value: association._count.timeline, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Admin Users", value: association._count.admins, icon: Users, color: "text-slate-600", bg: "bg-slate-100" },
  ];

  return (
    <div>
      <Link href="/platform/associations" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-5 transition-colors">
        <ArrowLeft size={13} />
        Back to Associations
      </Link>

      {/* Header */}
      <PanelCard className="p-6 mb-6" hover={false}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{association.name}</h1>
              {association.active ? (
                <Badge tone="success" icon={<CheckCircle size={11} />}>Active</Badge>
              ) : (
                <Badge tone="danger" icon={<XCircle size={11} />}>Inactive</Badge>
              )}
            </div>
            {association.nameNe && <p className="text-gray-500 text-sm">{association.nameNe}</p>}
            {association.description && <p className="text-gray-400 text-sm mt-2 max-w-2xl">{association.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/platform/associations/${association.id}/edit`}
              className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Pencil size={11} />
              Edit
            </Link>
            <a
              href={`https://${association.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 px-3 py-1.5 rounded-lg"
            >
              Visit Site
              <ExternalLink size={11} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
          {[
            { label: "Slug", value: association.slug },
            { label: "Domain", value: association.domain, mono: true },
            { label: "Plan", value: association.plan },
            { label: "Founded", value: association.foundedYear?.toString() ?? "—" },
          ].map(({ label, value, mono }) => (
            <div key={label}>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</div>
              <div className={`text-sm font-semibold text-gray-700 ${mono ? "font-mono" : ""}`}>{value}</div>
            </div>
          ))}
        </div>
      </PanelCard>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <PanelCard key={label} className="p-4 text-center" hover={false}>
            <div className={`inline-flex p-2 rounded-xl ${bg} mb-2`}>
              <Icon size={16} className={color} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </PanelCard>
        ))}
      </div>

      {/* AI Quota */}
      <div className="mb-6">
        <AiQuotaManager associationId={association.id} initial={aiQuota} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Admin users */}
        <PanelTable>
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-gray-900">Admin Users</h2>
          </div>
          {association.admins.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No admin users</div>
          ) : (
            <table className="w-full text-sm">
              <PanelTableHead>
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                </tr>
              </PanelTableHead>
              <tbody className="divide-y divide-gray-50">
                {association.admins.map((admin, i) => (
                  <PanelTableRow key={admin.id} index={i}>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{admin.name}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{admin.email}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone="warning" className="capitalize">{admin.role}</Badge>
                    </td>
                  </PanelTableRow>
                ))}
              </tbody>
            </table>
          )}
        </PanelTable>

        {/* Recent API logs */}
        <PanelTable>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent API Logs</h2>
            <Link href="/platform/logs" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              All logs →
            </Link>
          </div>
          {recentLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No logs yet</div>
          ) : (
            <table className="w-full text-xs">
              <PanelTableHead>
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Path</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-wider">ms</th>
                </tr>
              </PanelTableHead>
              <tbody className="divide-y divide-gray-50">
                {recentLogs.map((log, i) => (
                  <PanelTableRow key={log.id} index={i}>
                    <td className="px-4 py-2 font-mono text-gray-700 truncate max-w-[180px]">{log.path}</td>
                    <td className="px-4 py-2">
                      <span className={`font-bold ${
                        log.statusCode < 300 ? "text-green-600" :
                        log.statusCode < 400 ? "text-amber-600" : "text-red-600"
                      }`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400">{log.responseTimeMs}</td>
                  </PanelTableRow>
                ))}
              </tbody>
            </table>
          )}
        </PanelTable>
      </div>

      <div className="mt-6">
        <DeleteAssociationButton
          associationId={association.id}
          associationName={association.name}
          associationSlug={association.slug}
          counts={{
            members: association._count.memberLinks,
            events: association._count.events,
            news: association._count.news,
            committee: association._count.committee,
            admins: association._count.admins,
          }}
        />
      </div>
    </div>
  );
}
