import { prisma } from "@/lib/prisma";
import { getPlatformUser } from "@/lib/platformAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, ExternalLink, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlatformAssociationsPage() {
  const user = await getPlatformUser();
  if (!user) redirect("/platform/login");

  const associations = await prisma.association.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          memberLinks: true,
          events: true,
          news: true,
          committee: true,
          admins: true,
          timeline: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Associations</h1>
          <p className="text-gray-400 text-sm mt-0.5">{associations.length} association{associations.length !== 1 ? "s" : ""} registered</p>
        </div>
        <Link
          href="/platform/associations/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={14} />
          New Association
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Association</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Domain</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Members</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Events</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">News</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Committee</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admins</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {associations.map((a) => (
              <tr key={a.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-gray-900">{a.name}</div>
                  {a.nameNe && <div className="text-xs text-gray-400">{a.nameNe}</div>}
                  <div className="text-xs text-gray-400 font-mono mt-0.5">/{a.slug}</div>
                </td>
                <td className="px-5 py-3.5">
                  <a
                    href={`https://${a.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-mono text-xs"
                  >
                    {a.domain}
                    <ExternalLink size={10} />
                  </a>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full capitalize">
                    {a.plan}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{a._count.memberLinks}</td>
                <td className="px-5 py-3.5 text-right text-gray-500">{a._count.events}</td>
                <td className="px-5 py-3.5 text-right text-gray-500">{a._count.news}</td>
                <td className="px-5 py-3.5 text-right text-gray-500">{a._count.committee}</td>
                <td className="px-5 py-3.5 text-right text-gray-500">{a._count.admins}</td>
                <td className="px-5 py-3.5">
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
                <td className="px-5 py-3.5">
                  <Link
                    href={`/platform/associations/${a.id}`}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                  >
                    Details →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {associations.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No associations registered yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
