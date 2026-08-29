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
      include: {
        associations: {
          where: { associationId: association.id },
          select: { showPhone: true, showEmail: true },
        },
      },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    }),
    getSettings(association.id),
  ]);

  const memberMode = siteSettings.member_mode ?? "venue";

  const members: MemberType[] = dbMembers.map((m) => {
    const link = m.associations[0];
    const showPhone = link?.showPhone ?? false;
    const showEmail = link?.showEmail ?? false;
    // Resolve phones: use phones[] array, fall back to splitting legacy phone string
    const phones = m.phones.length > 0 ? m.phones : (m.phone ? m.phone.split(",").map((p) => p.trim()).filter(Boolean) : []);
    return {
      id: m.id,
      slug: m.slug,
      name: m.name,
      location: m.location,
      area: m.area,
      capacity: memberMode === "venue" ? m.capacity : null,
      phones: showPhone ? phones : [],
      email: showEmail ? m.email : null,
      website: m.website,
      category: m.category ?? m.type,
      type: m.type,
      description: m.description,
      amenities: m.amenities,
      memberSince: m.memberSince,
      featured: m.featured,
      image: m.image,
    };
  });

  return <MembersClient members={members} defaultMemberImage={siteSettings.default_member_image} memberMode={memberMode} />;
}
