import { getAssociation } from "@/lib/getAssociation";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import Footer from "./Footer";

export default async function FooterWrapper() {
  const association = await getAssociation();
  const s = await getSettings(association?.id);

  const memberCount = association?.id
    ? await prisma.memberAssociation.count({ where: { associationId: association.id, visible: true } })
    : 0;

  const logo = association?.logo ?? "/eva/evanepal_transparent.png";

  return (
    <Footer
      settings={{
        logo,
        name:        association?.name ?? undefined,
        logoInvert:  logo.includes("_transparent"),
        foundedYear: association?.foundedYear ?? 2011,
        hqLocation:  s.contact_address?.split("\n")[0] ?? "Kathmandu",
        memberCount,
        tagline:     s.footer_tagline,
        phone:       s.contact_phone,
        email:       s.contact_email,
        address:     s.contact_address,
        facebook:    s.social_facebook,
        instagram:   s.social_instagram,
        youtube:     s.social_youtube,
      }}
    />
  );
}
