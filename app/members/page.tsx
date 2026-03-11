import { prisma } from "@/lib/prisma";
import { MemberType } from "@/lib/types";
import MembersClient from "./MembersClient";

export const revalidate = 3600;

export default async function MembersPage() {
  const dbMembers = await prisma.member.findMany({
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  });

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

  return <MembersClient members={members} />;
}
