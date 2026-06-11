import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getAssociationOrThrow } from "@/lib/getAssociation";
import Link from "next/link";
import { Metadata } from "next";
import {
  CalendarDays, MapPin, Clock, Users, ChevronLeft,
  ArrowUpRight, ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const association = await getAssociationOrThrow();
  const event = await prisma.event.findFirst({
    where: { slug: params.slug, associationId: association.id },
  });
  if (!event) return { title: "Event Not Found" };
  return {
    title: `${event.title} | ${association.name}`,
    description: event.description.slice(0, 160),
  };
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

const TYPE_LABELS: Record<string, string> = {
  networking: "Networking",
  training:   "Training",
  meeting:    "Meeting",
  exhibition: "Exhibition",
  conference: "Conference",
};

const TYPE_COLORS: Record<string, string> = {
  networking: "bg-purple-100 text-purple-800",
  training:   "bg-blue-100 text-blue-800",
  meeting:    "bg-slate-100 text-slate-700",
  exhibition: "bg-amber-100 text-amber-800",
  conference: "bg-emerald-100 text-emerald-800",
};

export default async function EventDetailPage({ params }: Props) {
  const association = await getAssociationOrThrow();
  const event = await prisma.event.findFirst({
    where: { slug: params.slug, associationId: association.id },
  });
  if (!event) notFound();

  const isUpcoming = event.status === "upcoming";
  const timeLabel = event.startTime
    ? event.endTime
      ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
      : formatTime(event.startTime)
    : null;

  const mapsUrl = event.latitude && event.longitude
    ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}`
    : event.location
    ? `https://www.google.com/maps/search/${encodeURIComponent(event.location + ", Nepal")}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      {/* Hero */}
      <div className="bg-navy-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/events" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-sm mb-6 transition-colors">
            <ChevronLeft size={14} /> Back to events
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${TYPE_COLORS[event.type] ?? "bg-gray-100 text-gray-700"}`}>
              {TYPE_LABELS[event.type] ?? event.type}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${isUpcoming ? "bg-gold-500 text-navy-900" : "bg-white/10 text-white/70"}`}>
              {isUpcoming ? "Upcoming" : "Past"}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
            {event.title}
          </h1>
          {event.titleNe && (
            <p className="text-white/50 text-lg mb-4">{event.titleNe}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 text-white/70 text-sm">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-gold-400" />
              {formatDate(event.date.toISOString())}
              {event.endDate && event.endDate.toISOString().substring(0, 10) !== event.date.toISOString().substring(0, 10)
                ? ` – ${formatDate(event.endDate.toISOString())}`
                : ""}
            </span>
            {timeLabel && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-gold-400" />
                {timeLabel}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-gold-400" />
              {event.location}
            </span>
            {event.attendees && (
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-gold-400" />
                ~{event.attendees} attendees
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cover image */}
      {event.image && (
        <div className="max-w-4xl mx-auto px-4 -mt-6">
          <div className="h-64 sm:h-80 rounded-2xl overflow-hidden shadow-lg">
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Description */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-navy-900 mb-4">About this event</h2>
            <div className="prose prose-slate max-w-none">
              {event.description.split("\n").map((para, i) => (
                <p key={i} className="text-slate-600 leading-relaxed mb-4">{para}</p>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Details card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Event Details</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <CalendarDays size={15} className="text-gold-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">{formatDate(event.date.toISOString())}</p>
                    {event.endDate && event.endDate.toISOString().substring(0, 10) !== event.date.toISOString().substring(0, 10) && (
                      <p className="text-gray-400 text-xs">to {formatDate(event.endDate.toISOString())}</p>
                    )}
                  </div>
                </div>

                {timeLabel && (
                  <div className="flex items-center gap-3">
                    <Clock size={15} className="text-gold-500 flex-shrink-0" />
                    <span className="text-gray-700">{timeLabel}</span>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <MapPin size={15} className="text-gold-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{event.location}</span>
                </div>

                {event.attendees && (
                  <div className="flex items-center gap-3">
                    <Users size={15} className="text-gold-500 flex-shrink-0" />
                    <span className="text-gray-700">~{event.attendees} expected</span>
                  </div>
                )}
              </div>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors mt-2"
                >
                  <ArrowUpRight size={14} /> Get Directions
                </a>
              )}
            </div>

            {/* Map embed if coordinates available */}
            {event.latitude && event.longitude && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="h-48">
                  <iframe
                    title="Event location map"
                    width="100%"
                    height="100%"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${event.longitude - 0.005},${event.latitude - 0.003},${event.longitude + 0.005},${event.latitude + 0.003}&layer=mapnik&marker=${event.latitude},${event.longitude}`}
                    style={{ border: 0 }}
                  />
                </div>
                <div className="px-4 py-2.5 border-t border-gray-50">
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=17/${event.latitude}/${event.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink size={10} /> View larger map
                  </a>
                </div>
              </div>
            )}

            <Link
              href="/events"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft size={13} /> All events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
