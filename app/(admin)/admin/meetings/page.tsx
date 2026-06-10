import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  agm: "AGM", picnic: "Picnic", program: "Program", committee: "Committee", special: "Special",
};
const TYPE_COLORS: Record<string, string> = {
  agm: "bg-purple-50 text-purple-700", picnic: "bg-green-50 text-green-700",
  program: "bg-blue-50 text-blue-700", committee: "bg-amber-50 text-amber-700", special: "bg-rose-50 text-rose-700",
};

export default async function MeetingsPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");

  const meetings = await prisma.meeting.findMany({
    where: { associationId: ctx.associationId ?? undefined },
    orderBy: { scheduledAt: "desc" },
    include: { _count: { select: { agendaItems: true, expenses: true, contributions: true } } },
  });

  const upcoming = meetings.filter((m) => m.status === "scheduled");
  const past     = meetings.filter((m) => m.status !== "scheduled");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{upcoming.length} upcoming · {past.length} past</p>
        </div>
        <Link href="/admin/meetings/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] transition-colors">
          <Plus size={14} /> Schedule Meeting
        </Link>
      </div>

      {meetings.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 text-center py-16 text-gray-400">
          <Calendar size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No meetings scheduled yet.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</h2>
          <MeetingTable meetings={upcoming} />
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Past</h2>
          <MeetingTable meetings={past} />
        </div>
      )}
    </div>
  );
}

function MeetingTable({ meetings }: { meetings: ReturnType<typeof Array.prototype.filter> }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Meeting</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Venue</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Agenda</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Expenses</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {(meetings as Array<{
            id: string; title: string; type: string; scheduledAt: Date;
            venue: string | null; status: string;
            _count: { agendaItems: number; expenses: number; contributions: number };
          }>).map((m) => (
            <tr key={m.id} className="hover:bg-gray-50/50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{m.title}</div>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[m.type] ?? "bg-gray-100 text-gray-600"}`}>
                  {TYPE_LABELS[m.type] ?? m.type}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(m.scheduledAt.toISOString())}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{m.venue ?? "—"}</td>
              <td className="px-4 py-3 text-right text-gray-500 text-xs">{m._count.agendaItems}</td>
              <td className="px-4 py-3 text-right text-gray-500 text-xs">{m._count.expenses}</td>
              <td className="px-4 py-3">
                {m.status === "scheduled" && <span className="inline-flex items-center gap-1 text-xs text-blue-600"><Clock size={11} />Scheduled</span>}
                {m.status === "completed"  && <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle size={11} />Completed</span>}
                {m.status === "cancelled"  && <span className="inline-flex items-center gap-1 text-xs text-red-500"><XCircle size={11} />Cancelled</span>}
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/meetings/${m.id}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap">
                  Manage →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
