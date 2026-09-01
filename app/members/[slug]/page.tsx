import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SmartImage from "@/components/ui/SmartImage";
import { MapPin, Users, Phone, Globe, ArrowLeft, Calendar, CheckCircle, Building2, Facebook, Instagram, Youtube, Navigation } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAssociationOrThrow } from "@/lib/getAssociation";
import { getSettings } from "@/lib/settings";

interface Props {
  params: { slug: string };
}

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const association = await getAssociationOrThrow();
  const settings = await getSettings(association.id);
  const isPersonMode = settings.member_mode === "person";
  const member = await prisma.member.findUnique({ where: { slug: params.slug } });
  if (!member) return { title: isPersonMode ? "Member Not Found" : "Venue Not Found" };

  return {
    title: isPersonMode
      ? `${member.name} – Member | ${member.location}`
      : `${member.name} – Member Venue | ${member.location}`,
    description: isPersonMode
      ? `${member.name} is a member of ${association.name}, based in ${member.location}. ${member.description ?? ""}`
      : `${member.name} is a certified event venue located in ${member.location}.${member.capacity != null ? ` Capacity: ${member.capacity} guests.` : ""} ${member.description ?? ""}`,
    keywords: isPersonMode
      ? [member.name, `${member.name} ${member.location}`]
      : [member.name, `${member.name} ${member.location}`, `event venue ${member.area}`, `banquet hall ${member.area}`],
    openGraph: {
      title: member.name,
      description: member.description ?? undefined,
      type: "website",
    },
  };
}

export default async function MemberProfilePage({ params }: Props) {
  const association = await getAssociationOrThrow();
  const settings = await getSettings(association.id);
  const isPersonMode = settings.member_mode === "person";

  // Verify the member belongs to this association and is visible
  const memberWithLink = await prisma.member.findFirst({
    where: {
      slug: params.slug,
      associations: { some: { associationId: association.id, visible: true } },
    },
    include: {
      associations: {
        where: { associationId: association.id },
        select: { showPhone: true, showEmail: true },
      },
    },
  });

  if (!memberWithLink) notFound();

  const assocLink = memberWithLink.associations[0];
  const showPhone = assocLink?.showPhone ?? false;
  const showEmail = assocLink?.showEmail ?? false;

  // Resolve phones: phones[] array first, fall back to legacy phone string
  const phones = memberWithLink.phones.length > 0
    ? memberWithLink.phones
    : (memberWithLink.phone ? memberWithLink.phone.split(",").map((p) => p.trim()).filter(Boolean) : []);

  const member = {
    ...memberWithLink,
    // Apply visibility rules
    phones: showPhone ? phones : [],
    email: showEmail ? memberWithLink.email : null,
  };

  // notFound is called above after memberWithLink check

  const relatedMembers = await prisma.member.findMany({
    where: {
      area: member.area,
      NOT: { slug: params.slug },
      associations: { some: { associationId: association.id, visible: true } },
    },
    take: 3,
  });

  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-navy-700 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/members" className="hover:text-navy-700 transition-colors">Members</Link>
            <span>/</span>
            <span className="text-navy-900 font-medium">{member.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/members" className="inline-flex items-center gap-2 text-slate-500 hover:text-navy-700 text-sm font-medium mb-8 transition-colors">
          <ArrowLeft size={15} />
          Back to Members
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Profile Card */}
          <div className="lg:col-span-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden sticky top-28">
              <div className="h-2 bg-gradient-to-r from-navy-700 via-gold-500 to-navy-700" />
              <div className="p-8 text-center">
                {member.image ? (
                  <SmartImage src={member.image} alt={member.name}
                    className="w-20 h-20 rounded-2xl mx-auto mb-5" fit="cover" />
                ) : (
                  <div className="w-20 h-20 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Building2 size={32} className="text-gold-400" />
                  </div>
                )}

                <h1 className="font-serif font-bold text-navy-900 text-xl leading-tight mb-2">
                  {member.name}
                </h1>

                <span className="inline-block text-xs font-medium text-gold-600 bg-gold-50 border border-gold-200 px-3 py-1 rounded-full mb-5">
                  {member.category ?? member.type}
                </span>

                {member.featured && (
                  <div className="flex items-center justify-center gap-1.5 mb-4">
                    <span className="text-xs font-semibold bg-navy-900 text-gold-400 px-3 py-1 rounded-full">
                      ★ {isPersonMode ? "Featured Member" : "Featured Venue"}
                    </span>
                  </div>
                )}

                <div className="space-y-3 text-left mt-5">
                  {member.location && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <MapPin size={15} className="text-gold-500 flex-shrink-0" />
                      {member.location}
                    </div>
                  )}
                  {member.capacity != null && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Users size={15} className="text-gold-500 flex-shrink-0" />
                      Up to {member.capacity.toLocaleString()} guests
                    </div>
                  )}
                  {member.phones.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                      <Phone size={15} className="text-gold-500 flex-shrink-0" />
                      <a href={`tel:${p}`} className="hover:text-navy-700">{p}</a>
                    </div>
                  ))}
                  {member.website && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Globe size={15} className="text-gold-500 flex-shrink-0" />
                      <a href={`https://${member.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-navy-700 truncate">
                        {member.website}
                      </a>
                    </div>
                  )}
                  {member.memberSince && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Calendar size={15} className="text-gold-500 flex-shrink-0" />
                      Member since {member.memberSince}
                    </div>
                  )}
                  {/* Social media */}
                  {(member.facebook || member.instagram || member.youtube) && (
                    <div className="flex items-center gap-2 pt-1">
                      {member.facebook && (
                        <a href={member.facebook.startsWith("http") ? member.facebook : `https://facebook.com/${member.facebook}`}
                          target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                          <Facebook size={14} />
                        </a>
                      )}
                      {member.instagram && (
                        <a href={member.instagram.startsWith("http") ? member.instagram : `https://instagram.com/${member.instagram}`}
                          target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-pink-50 text-pink-500 hover:bg-pink-100 transition-colors">
                          <Instagram size={14} />
                        </a>
                      )}
                      {member.youtube && (
                        <a href={member.youtube.startsWith("http") ? member.youtube : `https://youtube.com/${member.youtube}`}
                          target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                          <Youtube size={14} />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100">
                  {member.phones.length > 0 && (
                    <a href={`tel:${member.phones[0]}`} className="block w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl text-sm text-center transition-colors mb-2">
                      Call Now
                    </a>
                  )}
                  {member.website && (
                    <a href={`https://${member.website}`} target="_blank" rel="noopener noreferrer" className="block w-full bg-gold-50 hover:bg-gold-100 text-gold-700 font-semibold py-3 rounded-xl text-sm text-center border border-gold-200 transition-colors mb-2">
                      Visit Website
                    </a>
                  )}
                  {member.latitude != null && member.longitude != null && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${member.latitude},${member.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-3 rounded-xl text-sm text-center border border-emerald-200 transition-colors"
                    >
                      <Navigation size={14} />
                      Get Directions
                    </a>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-center gap-2 bg-gold-50 border border-gold-200 rounded-xl px-4 py-2.5">
                  <CheckCircle size={15} className="text-gold-600" />
                  <span className="text-gold-700 text-xs font-semibold">{association.name} Certified Member</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {member.description && (
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
                <h2 className="font-serif font-bold text-navy-900 text-xl mb-4">About {member.name}</h2>
                <p className="text-slate-600 leading-relaxed">{member.description}</p>
                {member.memberSince && (
                  <p className="text-slate-600 leading-relaxed mt-3">
                    {isPersonMode
                      ? `Based in ${member.location}, ${member.name} has been a proud member of ${association.name} since ${member.memberSince}.`
                      : `Located in ${member.location}, this venue has been a proud member of ${association.name} since ${member.memberSince}.`}
                    {!isPersonMode && member.capacity != null && ` With a capacity of up to ${member.capacity.toLocaleString()} guests, it is an excellent choice for weddings, receptions, corporate events, and social gatherings.`}
                  </p>
                )}
              </div>
            )}

            {member.amenities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
                <h2 className="font-serif font-bold text-navy-900 text-xl mb-5">Amenities & Features</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {member.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                      <CheckCircle size={14} className="text-gold-500" />
                      <span className="text-sm font-medium text-navy-800">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
              <h2 className="font-serif font-bold text-navy-900 text-xl mb-5">{isPersonMode ? "Member Details" : "Venue Details"}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: isPersonMode ? "Category" : "Venue Type", value: member.category ?? member.type },
                  member.capacity != null ? { label: "Maximum Capacity", value: `${member.capacity.toLocaleString()} guests` } : null,
                  { label: "Area", value: member.area },
                  member.location ? { label: "Full Address", value: member.location } : null,
                  member.memberSince ? { label: "Member Since", value: member.memberSince } : null,
                  member.phones.length > 0 ? { label: "Contact", value: member.phones.join(", ") } : null,
                ]
                  .filter((x): x is { label: string; value: string | null } => x !== null)
                  .map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{label}</div>
                      <div className="font-semibold text-navy-900 text-sm">{value}</div>
                    </div>
                  ))}
              </div>
            </div>

            {member.latitude != null && member.longitude != null && (
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                <div className="px-8 pt-6 pb-4">
                  <h2 className="font-serif font-bold text-navy-900 text-xl">Location</h2>
                </div>
                <iframe
                  title={`Map for ${member.name}`}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${member.longitude - 0.005},${member.latitude - 0.005},${member.longitude + 0.005},${member.latitude + 0.005}&layer=mapnik&marker=${member.latitude},${member.longitude}`}
                  width="100%"
                  height="280"
                  className="border-0"
                  loading="lazy"
                />
                <div className="px-8 py-4">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${member.latitude},${member.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    <Navigation size={14} />
                    Open in Google Maps for directions
                  </a>
                </div>
              </div>
            )}

            {relatedMembers.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
                <h2 className="font-serif font-bold text-navy-900 text-xl mb-5">{isPersonMode ? `Other Members in ${member.area}` : `Other Venues in ${member.area}`}</h2>
                <div className="space-y-3">
                  {relatedMembers.map((m) => (
                    <Link key={m.id} href={`/members/${m.slug}`} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-gold-200 hover:bg-gold-50/30 transition-all group">
                      <div>
                        <div className="font-semibold text-navy-900 text-sm group-hover:text-navy-700">{m.name}</div>
                        {m.capacity != null && (
                          <div className="text-xs text-slate-500 mt-0.5">Capacity: {m.capacity.toLocaleString()} guests</div>
                        )}
                      </div>
                      <span className="text-gold-600 text-xs font-semibold">View →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
