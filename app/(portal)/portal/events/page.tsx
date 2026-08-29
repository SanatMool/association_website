"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle, Users, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/utils";
import PanelCard from "@/components/ui/panel/PanelCard";
import EmptyState from "@/components/ui/panel/EmptyState";

interface Rsvp  { id: string; status: string; guestCount: number; note: string | null }
interface Event { id: string; title: string; date: string; endDate: string | null; location: string; type: string; status: string; description: string; _count: { rsvps: number }; rsvps: Rsvp[] }

const RSVP_OPTIONS = [
  { v: "attending",     l: "Attending",     color: "bg-green-600 text-white" },
  { v: "not_attending", l: "Not Attending", color: "bg-red-500 text-white" },
  { v: "maybe",         l: "Maybe",         color: "bg-amber-500 text-white" },
];

export default function PortalEventsPage() {
  const [events,  setEvents]  = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState<string | null>(null);
  const [expandedRsvp, setExpandedRsvp] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [note,       setNote]       = useState("");

  async function load() {
    const res  = await fetch("/api/portal/events");
    const json = await res.json() as { success: boolean; data: Event[] };
    if (json.success) setEvents(json.data);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function submitRsvp(eventId: string, status: string) {
    setRsvping(eventId);
    await fetch(`/api/portal/rsvp/events/${eventId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, guestCount, note }) });
    setExpandedRsvp(null); setGuestCount(1); setNote("");
    await load();
    setRsvping(null);
  }

  async function removeRsvp(eventId: string) {
    setRsvping(eventId);
    await fetch(`/api/portal/rsvp/events/${eventId}`, { method: "DELETE" });
    await load();
    setRsvping(null);
  }

  const upcoming = events.filter((e) => e.status === "upcoming");
  const past     = events.filter((e) => e.status !== "upcoming");

  function RsvpPanel({ ev }: { ev: Event }) {
    const myRsvp = ev.rsvps[0];
    if (expandedRsvp !== ev.id) {
      return (
        <div className="flex items-center gap-2 mt-3">
          {myRsvp ? (
            <>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${myRsvp.status === "attending" ? "bg-green-100 text-green-700" : myRsvp.status === "not_attending" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                {RSVP_OPTIONS.find((o) => o.v === myRsvp.status)?.l ?? myRsvp.status}
                {myRsvp.guestCount > 1 ? ` (${myRsvp.guestCount} guests)` : ""}
              </span>
              <button onClick={() => setExpandedRsvp(ev.id)} className="text-xs text-gray-400 hover:text-gray-700 underline">Change</button>
              <button onClick={() => removeRsvp(ev.id)} className="text-xs text-red-400 hover:text-red-600 underline">Remove</button>
            </>
          ) : (
            <button onClick={() => setExpandedRsvp(ev.id)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              <CheckCircle size={12} /> RSVP
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto flex items-center gap-1"><Users size={11} />{ev._count.rsvps} attending</span>
        </div>
      );
    }
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
        <div className="flex flex-wrap gap-2">
          {RSVP_OPTIONS.map(({ v, l, color }) => (
            <button key={v} disabled={!!rsvping} onClick={() => submitRsvp(ev.id, v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${color}`}>{l}</button>
          ))}
          <button onClick={() => setExpandedRsvp(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800">Cancel</button>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            Guests:
            <div className="relative">
              <select value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))}
                className="pl-2 pr-6 py-1 border border-gray-200 rounded text-xs appearance-none focus:outline-none">
                {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)"
            className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none" />
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <p className="text-sm text-gray-400 mt-0.5">RSVP to upcoming events and view past ones.</p>
      </div>

      {events.length === 0 && <EmptyState icon={Calendar} title="No events found." />}

      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((ev) => (
              <PanelCard key={ev.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{ev.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(ev.date)} · {ev.location}</p>
                    {ev.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{ev.description}</p>}
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg flex-shrink-0"><Calendar size={16} className="text-green-600" /></div>
                </div>
                <RsvpPanel ev={ev} />
              </PanelCard>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Past</h2>
          <div className="space-y-2">
            {past.map((ev) => (
              <PanelCard key={ev.id} className="p-4 opacity-70">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-gray-700">{ev.title}</span>
                    <span className="text-xs text-gray-400 ml-3">{formatDate(ev.date)} · {ev.location}</span>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={11} />{ev._count.rsvps}</span>
                </div>
              </PanelCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
