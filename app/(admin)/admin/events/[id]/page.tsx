"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CalendarDays, Ticket } from "lucide-react";
import EventForm from "@/components/admin/EventForm";
import EventTicketsClient from "@/components/admin/EventTicketsClient";

type TabKey = "edit" | "tickets";

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabKey>("edit");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any) => { setEvent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return (
    <div className="py-20 text-center text-gray-400 text-sm">Loading…</div>
  );
  if (!event) return (
    <div className="py-20 text-center text-gray-500 text-sm">Event not found.</div>
  );

  return (
    <div>
      <Link href="/admin/events" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={14} /> Back to events
      </Link>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-6">
        <CalendarDays size={22} className="text-indigo-500" />
        {event.title}
      </h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        <button onClick={() => setTab("edit")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            tab === "edit" ? "text-[#0a1040] border-b-2 border-[#0a1040] -mb-px bg-white" : "text-gray-500 hover:text-gray-700"
          }`}>
          <CalendarDays size={14} /> Edit Details
        </button>
        <button onClick={() => setTab("tickets")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            tab === "tickets" ? "text-[#0a1040] border-b-2 border-[#0a1040] -mb-px bg-white" : "text-gray-500 hover:text-gray-700"
          }`}>
          <Ticket size={14} /> Tickets & Registrations
        </button>
      </div>

      {tab === "edit" && <EventForm event={event} />}
      {tab === "tickets" && <EventTicketsClient eventId={params.id} />}
    </div>
  );
}
