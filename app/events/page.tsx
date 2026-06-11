import { prisma } from "@/lib/prisma";
import { EventType } from "@/lib/types";
import { getAssociationOrThrow } from "@/lib/getAssociation";
import EventsClient from "./EventsClient";

export const revalidate = 3600;

export default async function EventsPage() {
  const association = await getAssociationOrThrow();

  const dbEvents = await prisma.event.findMany({
    where: { associationId: association.id },
    orderBy: { date: "desc" },
  });

  const events: EventType[] = dbEvents.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    titleNe: e.titleNe,
    description: e.description,
    date: e.date.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
    startTime: e.startTime ?? null,
    endTime: e.endTime ?? null,
    location: e.location,
    latitude: e.latitude ?? null,
    longitude: e.longitude ?? null,
    type: e.type,
    status: e.status,
    attendees: e.attendees ?? null,
    image: e.image,
  }));

  return <EventsClient events={events} />;
}
