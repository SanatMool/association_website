import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Calendar, Newspaper, Award } from "lucide-react";

export default async function DashboardPage() {
  const [memberCount, eventCount, newsCount, committeeCount] = await Promise.all([
    prisma.member.count(),
    prisma.event.count(),
    prisma.news.count(),
    prisma.committeeMember.count(),
  ]);

  const stats = [
    { label: "Members", count: memberCount, href: "/admin/members", icon: Users, color: "bg-blue-50 text-blue-700" },
    { label: "Events", count: eventCount, href: "/admin/events", icon: Calendar, color: "bg-green-50 text-green-700" },
    { label: "News Articles", count: newsCount, href: "/admin/news", icon: Newspaper, color: "bg-amber-50 text-amber-700" },
    { label: "Committee Members", count: committeeCount, href: "/admin/committee", icon: Award, color: "bg-purple-50 text-purple-700" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">Overview of EVA Nepal website content</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, count, href, icon: Icon, color }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow group"
          >
            <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}>
              <Icon size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">{label}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/admin/members/new", label: "Add Member" },
            { href: "/admin/events/new", label: "Add Event" },
            { href: "/admin/news/new", label: "Add News" },
            { href: "/admin/committee/new", label: "Add Committee Member" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 text-sm bg-[#0a1040] text-white rounded-lg hover:bg-[#0d1550] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
