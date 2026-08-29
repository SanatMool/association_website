"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Users2, CreditCard, Clock, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import StatCard from "@/components/ui/panel/StatCard";
import PanelCard from "@/components/ui/panel/PanelCard";

interface PortalData {
  user: { name: string; email: string };
  member: { name: string; area: string; image: string | null };
  association: { name: string; logo: string | null };
}
interface Meeting { id: string; title: string; type: string; scheduledAt: string; venue: string | null; status: string; attended: boolean; agendaItems: { title: string }[] }
interface Event   { id: string; title: string; date: string; location: string; type: string; status: string }
interface Payment { status: string; amount: string }

const TYPE_COLORS: Record<string, string> = { agm: "bg-purple-50 text-purple-700", picnic: "bg-green-50 text-green-700", program: "bg-blue-50 text-blue-700", committee: "bg-amber-50 text-amber-700", special: "bg-rose-50 text-rose-700" };

export default function PortalHomePage() {
  const [me,       setMe]       = useState<PortalData | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [events,   setEvents]   = useState<Event[]>([]);
  const [dues,     setDues]     = useState<Payment[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/me").then((r) => r.json()),
      fetch("/api/portal/meetings").then((r) => r.json()),
      fetch("/api/portal/events").then((r) => r.json()),
      fetch("/api/portal/dues").then((r) => r.json()),
    ]).then(([meJson, mJson, eJson, dJson]) => {
      if ((meJson as { success: boolean; data: PortalData }).success) setMe((meJson as { success: boolean; data: PortalData }).data);
      if ((mJson as { success: boolean; data: Meeting[] }).success) setMeetings((mJson as { success: boolean; data: Meeting[] }).data);
      if ((eJson as { success: boolean; data: Event[] }).success) setEvents((eJson as { success: boolean; data: Event[] }).data);
      if ((dJson as { success: boolean; data: Payment[] }).success) setDues((dJson as { success: boolean; data: Payment[] }).data);
    });
  }, []);

  const nextMeeting      = meetings.find((m) => m.status === "scheduled");
  const upcomingEvents   = events.filter((e) => e.status === "upcoming").slice(0, 3);
  const pendingDues      = dues.filter((d) => d.status === "pending").length;
  const attendedCount    = meetings.filter((m) => m.attended).length;
  const totalMeetings    = meetings.filter((m) => m.status !== "scheduled").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome{me ? `, ${me.member.name.split(" ")[0]}` : ""}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{me?.association.name}</p>
      </div>

      {/* Quick stats */}
      <div className="relative bg-mesh-navy rounded-3xl p-5 sm:p-6 mb-8 overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          <Link href="/portal/meetings">
            <StatCard label="Upcoming Meetings" value={meetings.filter((m) => m.status === "scheduled").length} icon={Users2} accent="gold" />
          </Link>
          <Link href="/portal/meetings">
            <StatCard label="Meetings Attended" value={attendedCount} sublabel={totalMeetings > 0 ? `of ${totalMeetings}` : undefined} icon={UserCheck} accent="gold" />
          </Link>
          <Link href="/portal/events">
            <StatCard label="Upcoming Events" value={upcomingEvents.length} icon={Calendar} accent="gold" />
          </Link>
          <Link href="/portal/dues">
            <StatCard label="Pending Dues" value={pendingDues} icon={CreditCard} accent="gold" />
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Next meeting */}
        <PanelCard className="overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Next Meeting</h2>
            <Link href="/portal/meetings" className="text-xs text-amber-600 hover:text-amber-700">View all →</Link>
          </div>
          {nextMeeting ? (
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0"><Users2 size={16} className="text-indigo-600" /></div>
                <div>
                  <div className="font-semibold text-gray-900">{nextMeeting.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(nextMeeting.scheduledAt)}{nextMeeting.venue ? ` · ${nextMeeting.venue}` : ""}</div>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium mt-1 inline-block ${TYPE_COLORS[nextMeeting.type] ?? "bg-gray-100 text-gray-600"}`}>{nextMeeting.type.toUpperCase()}</span>
                </div>
              </div>
              {nextMeeting.agendaItems.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Agenda</div>
                  <ol className="space-y-1">
                    {nextMeeting.agendaItems.slice(0, 4).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-xs text-gray-400 font-mono mt-0.5 flex-shrink-0">{i + 1}.</span>{item.title}
                      </li>
                    ))}
                    {nextMeeting.agendaItems.length > 4 && <li className="text-xs text-gray-400">+{nextMeeting.agendaItems.length - 4} more items</li>}
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 text-center text-gray-400 text-sm py-10"><Clock size={20} className="mx-auto mb-2 opacity-30" />No upcoming meetings</div>
          )}
        </PanelCard>

        {/* Upcoming events */}
        <PanelCard className="overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
            <Link href="/portal/events" className="text-xs text-amber-600 hover:text-amber-700">View all →</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="p-5 text-center text-gray-400 text-sm py-10"><Calendar size={20} className="mx-auto mb-2 opacity-30" />No upcoming events</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {upcomingEvents.map((ev) => (
                <div key={ev.id} className="px-5 py-4 flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg flex-shrink-0"><Calendar size={14} className="text-green-600" /></div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">{ev.title}</div>
                    <div className="text-xs text-gray-400">{formatDate(ev.date)} · {ev.location}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
}
