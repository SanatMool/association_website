import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft, User } from "lucide-react";
import { getAdminContext } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const BS_MONTHS = [
  "", "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
];
const AD_MONTHS = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function CommitteeHistoryPage() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const archived = await prisma.committeeMember.findMany({
    where: { associationId, active: false },
    orderBy: [{ termYearBS: "desc" }, { termMonthBS: "desc" }, { order: "asc" }],
  });

  // Group by termYearBS descending
  const grouped: Record<string, typeof archived> = {};
  for (const m of archived) {
    const key = m.termYearBS
      ? `bs_${m.termYearBS}_${m.termMonthBS ?? 0}`
      : `ad_${m.termYearAD ?? "unknown"}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }

  const terms = Object.entries(grouped).map(([key, members]) => {
    const first = members[0];
    return { key, termYearBS: first.termYearBS, termMonthBS: first.termMonthBS, termYearAD: first.termYearAD, termMonthAD: first.termMonthAD, members };
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/committee" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ChevronLeft size={15} /> Back to Current Committee
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Committee History</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          All past committees — {archived.length} archived member record{archived.length !== 1 ? "s" : ""} across {terms.length} term{terms.length !== 1 ? "s" : ""}
        </p>
      </div>

      {terms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <User size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No archived committees yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Use the &quot;Archive Committee&quot; button on the committee page to archive the current committee when a new election takes place.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {terms.map((term) => {
            const bsLabel  = term.termYearBS  ? `${term.termMonthBS ? BS_MONTHS[term.termMonthBS] + " " : ""}${term.termYearBS} B.S.` : null;
            const adLabel  = term.termYearAD  ? `${term.termMonthAD ? AD_MONTHS[term.termMonthAD] + " " : ""}${term.termYearAD} A.D.` : null;
            const termLabel = [bsLabel, adLabel].filter(Boolean).join(" / ");

            return (
              <div key={term.key} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div>
                    <h2 className="font-bold text-gray-900">Elected {termLabel || "Unknown Term"}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{term.members.length} committee member{term.members.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {term.termYearBS && (
                      <span className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                        {term.termYearBS} B.S.
                      </span>
                    )}
                    {term.termYearAD && (
                      <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                        {term.termYearAD} A.D.
                      </span>
                    )}
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">#</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">Name</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">Role</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">Venue</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {term.members.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-400 text-xs">{m.order}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {m.name}
                          {m.highlighted && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full">★</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{m.role}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{m.venue ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/committee/${m.id}`}
                            className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
