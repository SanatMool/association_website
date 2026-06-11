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
import { getSettings } from "@/lib/settings";
import { getAssociationOrThrow } from "@/lib/getAssociation";
import { MemberType, EventType, NewsType, CommitteeType, TimelineType } from "@/lib/types";

// Page-level metadata is handled by generateMetadata() in app/layout.tsx

export const revalidate = 3600;

export default async function Home() {
  const association = await getAssociationOrThrow();
  const associationId = association.id;

  const [dbMembers, dbEvents, dbNews, dbCommittee, memberCount, dbTimeline, siteSettings] = await Promise.all([
    prisma.member.findMany({
      where: { associations: { some: { associationId, visible: true } } },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    }),
    prisma.event.findMany({
      where: { associationId },
      orderBy: { date: "desc" },
    }),
    prisma.news.findMany({
      where: { associationId },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.committeeMember.findMany({
      where: { associationId, active: true },
      orderBy: { order: "asc" },
    }),
    prisma.memberAssociation.count({ where: { associationId, visible: true } }),
    prisma.timelineEntry.findMany({
      where: { associationId },
      orderBy: { order: "asc" },
    }),
    getSettings(associationId),
  ]);

  const foundedYear = association.foundedYear ?? 2011;
  const yearsActive = Math.max(1, new Date().getFullYear() - foundedYear);
  const eventsHosted = parseInt(siteSettings.stats_events_hosted ?? "20000", 10);
  const shortName = association.name.split(" ")[0];
  const hqLocation = siteSettings.contact_address?.split("\n")[0] ?? "Kathmandu";

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
    nameNe: c.nameNe,
    role: c.role,
    roleKey: c.roleKey,
    venue: c.venue,
    venueNe: c.venueNe,
    organization: c.organization,
    bio: c.bio,
    order: c.order,
    highlighted: c.highlighted,
    image: c.image,
    termYearAD: c.termYearAD,
    termMonthAD: c.termMonthAD,
    termYearBS: c.termYearBS,
    termMonthBS: c.termMonthBS,
  }));

  const timeline: TimelineType[] = dbTimeline.map((t) => ({
    id: t.id,
    year: t.year,
    title: t.title,
    titleNe: t.titleNe,
    description: t.description,
    descriptionNe: t.descriptionNe,
    stat: t.stat,
    highlighted: t.highlighted,
    order: t.order,
  }));

  return (
    <>
      <Hero
        name={association.name}
        foundedYear={foundedYear}
        memberCount={memberCount}
        yearsActive={yearsActive}
        heroImage={siteSettings.hero_image ?? null}
      />
      <StatsSection
        memberCount={memberCount}
        eventsHosted={eventsHosted}
        yearsActive={yearsActive}
        foundedYear={foundedYear}
        shortName={shortName}
      />
      <About
        foundedYear={foundedYear}
        location={hqLocation}
        memberCount={memberCount}
        yearsActive={yearsActive}
        name={association.name}
        description={association.description ?? undefined}
      />
      <Mission />
      <MemberDirectory members={members} defaultMemberImage={siteSettings.default_member_image} memberCount={memberCount} />
      <WhyJoin name={association.name} memberCount={memberCount} />
      <Timeline entries={timeline} />
      <Events events={events} />
      <News news={news} name={association.name} />
      <ExecutiveCommittee committee={committee} />
      <MembershipForm name={association.name} />
      <Contact
        name={association.name}
        settings={{
          phone:     siteSettings.contact_phone,
          email:     siteSettings.contact_email,
          address:   siteSettings.contact_address,
          hours:     siteSettings.contact_hours,
          mapUrl:    siteSettings.contact_map_url,
          facebook:  siteSettings.social_facebook,
          instagram: siteSettings.social_instagram,
          youtube:   siteSettings.social_youtube,
        }}
      />
    </>
  );
}
