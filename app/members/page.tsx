import { prisma } from "@/lib/prisma";
import { MemberType } from "@/lib/types";
import { getAssociationOrThrow } from "@/lib/getAssociation";
import { getSettings } from "@/lib/settings";
import MembersClient from "./MembersClient";

export const revalidate = 3600;

export default async function MembersPage() {
  const association = await getAssociationOrThrow();

  const [dbMembers, siteSettings] = await Promise.all([
    prisma.member.findMany({
      where: { associations: { some: { associationId: association.id, visible: true } } },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    }),
    getSettings(association.id),
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

  return <MembersClient members={members} defaultMemberImage={siteSettings.default_member_image} />;
}
