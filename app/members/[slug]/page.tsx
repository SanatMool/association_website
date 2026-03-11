import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Users, Phone, Globe, ArrowLeft, Calendar, CheckCircle, Building2 } from "lucide-react";
import { getMemberBySlug, members } from "@/data/members";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return members.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const member = getMemberBySlug(params.slug);
  if (!member) return { title: "Venue Not Found" };

  return {
    title: `${member.name} – EVA Nepal Member Venue | ${member.location}`,
    description: `${member.name} is an EVA Nepal certified event venue located in ${member.location}. Capacity: ${member.capacity} guests. ${member.description}`,
    keywords: [
      member.name,
      `${member.name} ${member.location}`,
      `event venue ${member.area}`,
      `banquet hall ${member.area}`,
      "EVA Nepal member",
    ],
    openGraph: {
      title: `${member.name} | EVA Nepal`,
      description: member.description,
      type: "website",
    },
  };
}

export default function MemberProfilePage({ params }: Props) {
  const member = getMemberBySlug(params.slug);

  if (!member) notFound();

  const relatedMembers = members
    .filter((m) => m.area === member.area && m.id !== member.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-navy-700 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/members"
              className="hover:text-navy-700 transition-colors"
            >
              Members
            </Link>
            <span>/</span>
            <span className="text-navy-900 font-medium">{member.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/members"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-navy-700 text-sm font-medium mb-8 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Members
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden sticky top-28">
              <div className="h-2 bg-gradient-to-r from-navy-700 via-gold-500 to-navy-700" />
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Building2 size={32} className="text-gold-400" />
                </div>

                <h1 className="font-serif font-bold text-navy-900 text-xl leading-tight mb-2">
                  {member.name}
                </h1>

                <span className="inline-block text-xs font-medium text-gold-600 bg-gold-50 border border-gold-200 px-3 py-1 rounded-full mb-5">
                  {member.category}
                </span>

                {member.featured && (
                  <div className="flex items-center justify-center gap-1.5 mb-4">
                    <span className="text-xs font-semibold bg-navy-900 text-gold-400 px-3 py-1 rounded-full">
                      ★ Featured Venue
                    </span>
                  </div>
                )}

                <div className="space-y-3 text-left mt-5">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin size={15} className="text-gold-500 flex-shrink-0" />
                    {member.location}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Users size={15} className="text-gold-500 flex-shrink-0" />
                    Up to {member.capacity} guests
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone size={15} className="text-gold-500 flex-shrink-0" />
                    <a
                      href={`tel:${member.phone}`}
                      className="hover:text-navy-700"
                    >
                      {member.phone}
                    </a>
                  </div>
                  {member.website && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Globe
                        size={15}
                        className="text-gold-500 flex-shrink-0"
                      />
                      <a
                        href={`https://${member.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-navy-700 truncate"
                      >
                        {member.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar
                      size={15}
                      className="text-gold-500 flex-shrink-0"
                    />
                    Member since {member.memberSince}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100">
                  <a
                    href={`tel:${member.phone}`}
                    className="block w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl text-sm text-center transition-colors mb-2"
                  >
                    Call Now
                  </a>
                  {member.website && (
                    <a
                      href={`https://${member.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-gold-50 hover:bg-gold-100 text-gold-700 font-semibold py-3 rounded-xl text-sm text-center border border-gold-200 transition-colors"
                    >
                      Visit Website
                    </a>
                  )}
                </div>

                {/* EVA Badge */}
                <div className="mt-5 flex items-center justify-center gap-2 bg-gold-50 border border-gold-200 rounded-xl px-4 py-2.5">
                  <CheckCircle size={15} className="text-gold-600" />
                  <span className="text-gold-700 text-xs font-semibold">
                    EVA Nepal Certified Member
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
              <h2 className="font-serif font-bold text-navy-900 text-xl mb-4">
                About {member.name}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {member.description}
              </p>
              <p className="text-slate-600 leading-relaxed mt-3">
                Located in {member.location}, this venue has been a proud
                member of the Event and Venue Association Nepal (EVA Nepal)
                since {member.memberSince}. With a capacity of up to{" "}
                {member.capacity} guests, it is an excellent choice for
                weddings, receptions, corporate events, and social gatherings.
              </p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
              <h2 className="font-serif font-bold text-navy-900 text-xl mb-5">
                Amenities & Features
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {member.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
                  >
                    <CheckCircle size={14} className="text-gold-500" />
                    <span className="text-sm font-medium text-navy-800">
                      {amenity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue Details */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
              <h2 className="font-serif font-bold text-navy-900 text-xl mb-5">
                Venue Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Venue Type", value: member.category },
                  { label: "Maximum Capacity", value: `${member.capacity} guests` },
                  { label: "Area", value: member.area },
                  { label: "Full Address", value: member.location },
                  { label: "EVA Member Since", value: member.memberSince },
                  { label: "Contact", value: member.phone },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
                      {label}
                    </div>
                    <div className="font-semibold text-navy-900 text-sm">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Venues */}
            {relatedMembers.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
                <h2 className="font-serif font-bold text-navy-900 text-xl mb-5">
                  Other Venues in {member.area}
                </h2>
                <div className="space-y-3">
                  {relatedMembers.map((m) => (
                    <Link
                      key={m.id}
                      href={`/members/${m.slug}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-gold-200 hover:bg-gold-50/30 transition-all group"
                    >
                      <div>
                        <div className="font-semibold text-navy-900 text-sm group-hover:text-navy-700">
                          {m.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Capacity: {m.capacity} guests
                        </div>
                      </div>
                      <span className="text-gold-600 text-xs font-semibold">
                        View →
                      </span>
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
