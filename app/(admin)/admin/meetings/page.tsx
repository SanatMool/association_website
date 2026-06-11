import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import MeetingsListClient from "./MeetingsListClient";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");

  const meetings = await prisma.meeting.findMany({
    where: { associationId: ctx.associationId ?? undefined },
    orderBy: { scheduledAt: "desc" },
    select: {
      id: true, title: true, type: true, scheduledAt: true,
      venue: true, status: true,
      _count: { select: { agendaItems: true, expenses: true } },
    },
  });

  const rows = meetings.map((m) => ({
    id:           m.id,
    title:        m.title,
    type:         m.type,
    scheduledAt:  m.scheduledAt.toISOString(),
    venue:        m.venue,
    status:       m.status,
    agendaCount:  m._count.agendaItems,
    expenseCount: m._count.expenses,
  }));

  return <MeetingsListClient meetings={rows} />;
}
