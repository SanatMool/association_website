import { prisma } from "@/lib/prisma";
import { EventType } from "@/lib/types";
import EventsClient from "./EventsClient";

export const revalidate = 3600;

export default async function EventsPage() {
  const dbEvents = await prisma.event.findMany({ orderBy: { date: "desc" } });

  const events: EventType[] = dbEvents.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    titleNe: e.titleNe,
    description: e.description,
    date: e.date.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
    location: e.location,
    type: e.type,
    status: e.status,
    image: e.image,
  }));

  return <EventsClient events={events} />;
}
