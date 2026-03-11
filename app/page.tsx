import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import StatsSection from "@/components/sections/StatsSection";
import About from "@/components/sections/About";
import Mission from "@/components/sections/Mission";
import MemberDirectory from "@/components/sections/MemberDirectory";
import WhyJoin from "@/components/sections/WhyJoin";
import Events from "@/components/sections/Events";
import News from "@/components/sections/News";
import ExecutiveCommittee from "@/components/sections/ExecutiveCommittee";
import MembershipForm from "@/components/sections/MembershipForm";
import Contact from "@/components/sections/Contact";
import Timeline from "@/components/sections/Timeline";
import { prisma } from "@/lib/prisma";
import { MemberType, EventType, NewsType, CommitteeType } from "@/lib/types";

export const metadata: Metadata = {
  title:
    "EVA Nepal – Event and Venue Association Nepal | Representing Nepal's Event Industry",
  description:
    "EVA Nepal is the official association of event venues, banquet halls and wedding venues in Kathmandu. Representing 150+ member venues across Kathmandu Valley since 2011.",
};

export const revalidate = 3600;

export default async function Home() {
  const [dbMembers, dbEvents, dbNews, dbCommittee] = await Promise.all([
    prisma.member.findMany({ orderBy: [{ featured: "desc" }, { name: "asc" }] }),
    prisma.event.findMany({ orderBy: { date: "desc" } }),
    prisma.news.findMany({ orderBy: { publishedAt: "desc" } }),
    prisma.committeeMember.findMany({ orderBy: { order: "asc" } }),
  ]);

  const members: MemberType[] = dbMembers.map((m) => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    location: m.location,
    area: m.area,
    capacity: m.capacity,
    phone: m.phone,
    website: m.website,
    category: m.category ?? m.type,
    type: m.type,
    description: m.description,
    amenities: m.amenities,
    memberSince: m.memberSince,
    featured: m.featured,
    image: m.image,
  }));

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

  const news: NewsType[] = dbNews.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    titleNe: n.titleNe,
    excerpt: n.excerpt,
    content: n.content,
    date: n.publishedAt.toISOString(),
    category: n.category,
    author: n.author,
    image: n.image,
    featured: n.featured,
  }));

  const committee: CommitteeType[] = dbCommittee.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    roleKey: c.roleKey,
    venue: c.venue,
    bio: c.bio,
    order: c.order,
    highlighted: c.highlighted,
    image: c.image,
  }));

  return (
    <>
      <Hero />
      <StatsSection />
      <About />
      <Mission />
      <MemberDirectory members={members} />
      <WhyJoin />
      <Timeline />
      <Events events={events} />
      <News news={news} />
      <ExecutiveCommittee committee={committee} />
      <MembershipForm />
      <Contact />
    </>
  );
}
