"use client";

import { useEffect, useState } from "react";
import { Users2, CheckCircle, ChevronDown, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Rsvp        { id: string; status: string; guestCount: number; note: string | null }
interface AgendaItem  { title: string; description: string | null }
interface Minutes     { content: string; publishedAt: string | null }
interface Meeting {
  id: string; title: string; type: string; scheduledAt: string;
  venue: string | null; status: string; description: string | null;
  agendaItems: AgendaItem[]; minutes: Minutes | null;
  _count: { rsvps: number }; rsvps: Rsvp[];
}

const TYPE_LABELS: Record<string, string> = { agm: "AGM", picnic: "Picnic", program: "Program", committee: "Committee", special: "Special" };
const TYPE_COLORS: Record<string, string> = { agm: "bg-purple-50 text-purple-700", picnic: "bg-green-50 text-green-700", program: "bg-blue-50 text-blue-700", committee: "bg-amber-50 text-amber-700", special: "bg-rose-50 text-rose-700" };
const RSVP_OPTIONS = [
  { v: "attending",     l: "Attending",     color: "bg-green-600 text-white" },
  { v: "not_attending", l: "Not Attending", color: "bg-red-500 text-white" },
  { v: "maybe",         l: "Maybe",         color: "bg-amber-500 text-white" },
];

export default function PortalMeetingsPage() {
  const [meetings,     setMeetings]     = useState<Meeting[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [expandedRsvp, setExpandedRsvp] = useState<string | null>(null);
  const [expandedMin,  setExpandedMin]  = useState<string | null>(null);
  const [guestCount,   setGuestCount]   = useState(1);
  const [note,         setNote]         = useState("");
  const [rsvping,      setRsvping]      = useState<string | null>(null);

  async function load() {
    const res  = await fetch("/api/portal/meetings");
    const json = await res.json() as { success: boolean; data: Meeting[] };
    if (json.success) setMeetings(json.data);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function submitRsvp(meetingId: string, status: string) {
    setRsvping(meetingId);
    await fetch(`/api/portal/rsvp/meetings/${meetingId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, guestCount, note }) });
    setExpandedRsvp(null); setGuestCount(1); setNote("");
    await load();
    setRsvping(null);
  }

  async function removeRsvp(meetingId: string) {
    setRsvping(meetingId);
    await fetch(`/api/portal/rsvp/meetings/${meetingId}`, { method: "DELETE" });
    await load();
    setRsvping(null);
  }

  const upcoming = meetings.filter((m) => m.status === "scheduled");
  const past     = meetings.filter((m) => m.status !== "scheduled");

  if (loading) return <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>;

  function MeetingCard({ m, dimmed }: { m: Meeting; dimmed?: boolean }) {
    const myRsvp = m.rsvps[0];
    const isExpRsvp = expandedRsvp === m.id;
    const isExpMin  = expandedMin  === m.id;

    return (
      <div className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${dimmed ? "opacity-70" : ""}`}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{m.title}</h3>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${TYPE_COLORS[m.type] ?? "bg-gray-100 text-gray-600"}`}>{TYPE_LABELS[m.type] ?? m.type}</span>
              </div>
              <p className="text-xs text-gray-400">{formatDate(m.scheduledAt)}{m.venue ? ` · ${m.venue}` : ""}</p>
              {m.description && <p className="text-sm text-gray-500 mt-1.5">{m.description}</p>}
            </div>
            <div className="flex-shrink-0 flex gap-1.5">
              {m.minutes?.publishedAt && (
                <button onClick={() => setExpandedMin(isExpMin ? null : m.id)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <FileText size={11} /> Minutes
                </button>
              )}
            </div>
          </div>

          {/* Agenda */}
          {m.agendaItems.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-50">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Agenda</div>
              <ol className="space-y-1">
                {m.agendaItems.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-xs text-gray-400 font-mono mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <div>
                      <span>{item.title}</span>
                      {item.description && <span className="text-gray-400 text-xs ml-1">— {item.description}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* RSVP */}
          {m.status === "scheduled" && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              {!isExpRsvp ? (
                <div className="flex items-center gap-2">
                  {myRsvp ? (
                    <>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${myRsvp.status === "attending" ? "bg-green-100 text-green-700" : myRsvp.status === "not_attending" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {RSVP_OPTIONS.find((o) => o.v === myRsvp.status)?.l}{myRsvp.guestCount > 1 ? ` (${myRsvp.guestCount})` : ""}
                      </span>
                      <button onClick={() => setExpandedRsvp(m.id)} className="text-xs text-gray-400 hover:text-gray-700 underline">Change</button>
                      <button onClick={() => removeRsvp(m.id)} className="text-xs text-red-400 hover:text-red-600 underline">Remove</button>
                    </>
                  ) : (
                    <button onClick={() => setExpandedRsvp(m.id)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <CheckCircle size={12} /> RSVP
                    </button>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{m._count.rsvps} attending</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {RSVP_OPTIONS.map(({ v, l, color }) => (
                      <button key={v} disabled={!!rsvping} onClick={() => submitRsvp(m.id, v)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50 ${color}`}>{l}</button>
                    ))}
                    <button onClick={() => setExpandedRsvp(null)} className="px-3 py-1.5 text-xs text-gray-500">Cancel</button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      Guests:
                      <div className="relative">
                        <select value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))}
                          className="pl-2 pr-6 py-1 border border-gray-200 rounded text-xs appearance-none focus:outline-none">
                          {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)"
                      className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Minutes panel */}
        {isExpMin && m.minutes && (
          <div className="border-t border-gray-100 p-5 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={13} className="text-indigo-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Meeting Minutes</span>
              <button onClick={() => setExpandedMin(null)} className="ml-auto text-xs text-gray-400 hover:text-gray-700">Close</button>
            </div>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{m.minutes.content}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
        <p className="text-sm text-gray-400 mt-0.5">View upcoming meetings, agenda, and minutes.</p>
      </div>

      {meetings.length === 0 && <div className="text-center py-16 text-gray-400 text-sm"><Users2 size={24} className="mx-auto mb-2 opacity-30" />No meetings yet.</div>}

      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="space-y-3">{upcoming.map((m) => <MeetingCard key={m.id} m={m} />)}</div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Past</h2>
          <div className="space-y-3">{past.map((m) => <MeetingCard key={m.id} m={m} dimmed />)}</div>
        </div>
      )}
    </div>
  );
}
