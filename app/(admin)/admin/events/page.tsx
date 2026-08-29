import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import { autoArchivePastEvents } from "@/lib/eventStatus";
import EventsClient from "./EventsClient";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;
  await autoArchivePastEvents(associationId);

  const events = await prisma.event.findMany({
    where: { associationId },
    orderBy: { date: "desc" },
    select: {
      id: true, title: true, date: true, type: true,
      status: true, location: true, attendees: true, startTime: true, image: true,
    },
  });

  const rows = events.map((e) => ({
    id:         e.id,
    title:      e.title,
    date:       e.date.toISOString(),
    type:       e.type,
    status:     e.status,
    location:   e.location,
    attendees:  e.attendees,
    startTime:  e.startTime,
    image:      e.image,
  }));

  return <EventsClient events={rows} />;
}
