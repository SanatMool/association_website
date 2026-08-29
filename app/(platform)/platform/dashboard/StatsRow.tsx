"use client";

import { Building2, Users, Calendar, Newspaper } from "lucide-react";
import StatCard from "@/components/ui/panel/StatCard";

interface StatsRowProps {
  activeCount: number;
  totalAssociations: number;
  totalMembers: number;
  totalEvents: number;
  totalNews: number;
}

/**
 * Icon components can't cross the server->client boundary as props (RSC only
 * allows serializable data), so this client component owns the icon set
 * itself — the server page only passes plain numbers.
 */
export default function StatsRow({ activeCount, totalAssociations, totalMembers, totalEvents, totalNews }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
      <StatCard label="Associations" value={activeCount} raw={`${activeCount} / ${totalAssociations}`} sublabel="active / total" icon={Building2} accent="indigo" />
      <StatCard label="Total Members" value={totalMembers} sublabel="across all associations" icon={Users} accent="indigo" />
      <StatCard label="Total Events" value={totalEvents} sublabel="across all associations" icon={Calendar} accent="indigo" />
      <StatCard label="Total News" value={totalNews} sublabel="articles published" icon={Newspaper} accent="indigo" />
    </div>
  );
}
