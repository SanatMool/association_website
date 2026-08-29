import { prisma } from "@/lib/prisma";
import { getAssociationOrThrow } from "@/lib/getAssociation";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import MeetingsPublicClient from "./MeetingsPublicClient";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const association = await getAssociationOrThrow();
  return {
    title: `Meeting Minutes — ${association.name}`,
    description: `Published meeting minutes and agendas from ${association.name}.`,
  };
}

export default async function MeetingsPage() {
  const association = await getAssociationOrThrow();

  const meetings = await prisma.meeting.findMany({
    where: {
      associationId: association.id,
      minutes: { publishedAt: { not: null } },
    },
    select: {
      id: true,
      title: true,
      type: true,
      scheduledAt: true,
      venue: true,
      status: true,
      agendaItems: {
        orderBy: { order: "asc" },
        select: { title: true, description: true, outcome: true, resolved: true },
      },
      minutes: {
        select: { content: true, contentNe: true, publishedAt: true },
      },
    },
    orderBy: { scheduledAt: "desc" },
  });

  const rows = meetings.map((m) => ({
    id: m.id,
    title: m.title,
    type: m.type,
    scheduledAt: m.scheduledAt.toISOString(),
    venue: m.venue,
    status: m.status,
    agendaItems: m.agendaItems,
    minutes: m.minutes
      ? {
          content:     m.minutes.content,
          contentNe:   m.minutes.contentNe,
          publishedAt: m.minutes.publishedAt!.toISOString(),
        }
      : null,
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-[#0a1040] pt-28 pb-14">
        <div className="container-max px-6">
          <p className="section-label text-gold-500 mb-3">Transparency &amp; Governance</p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Meeting Minutes
          </h1>
          <p className="text-white/60 text-lg max-w-xl">
            Published agendas and minutes from {association.name} meetings.
          </p>
          {rows.length > 0 && (
            <p className="text-white/30 text-sm mt-4">
              {rows.length} published record{rows.length !== 1 ? "s" : ""} &mdash; last updated{" "}
              {formatDate(rows[0].minutes!.publishedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container-max px-6 py-12">
        <MeetingsPublicClient meetings={rows} />
      </div>
    </main>
  );
}
