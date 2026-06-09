import { prisma } from "@/lib/prisma";
import { getPlatformUser } from "@/lib/platformAuth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PlatformLogsPage() {
  const user = await getPlatformUser();
  if (!user) redirect("/platform/login");

  const logs = await prisma.apiLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { association: { select: { name: true, slug: true } } },
  });

  const errorCount = logs.filter((l) => l.statusCode >= 400).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">API Logs</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Last {logs.length} requests
          {errorCount > 0 && (
            <span className="ml-2 text-red-500 font-medium">· {errorCount} error{errorCount !== 1 ? "s" : ""}</span>
          )}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No API logs recorded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Path</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Method</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Association</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time (ms)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Error</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className={`hover:bg-gray-50/50 ${log.statusCode >= 500 ? "bg-red-50/30" : log.statusCode >= 400 ? "bg-amber-50/20" : ""}`}
                >
                  <td className="px-4 py-2.5 font-mono text-gray-700 text-xs max-w-[240px] truncate">{log.path}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase">{log.method}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-sm font-bold ${
                      log.statusCode < 300 ? "text-green-600" :
                      log.statusCode < 400 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{log.association?.name ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-2.5 text-right text-gray-400 text-xs">{log.responseTimeMs}</td>
                  <td className="px-4 py-2.5 text-xs text-red-500 max-w-[200px] truncate">{log.errorMessage ?? ""}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short",
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })}
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
