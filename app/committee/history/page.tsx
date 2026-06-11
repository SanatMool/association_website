import { prisma } from "@/lib/prisma";
import { getAssociationOrThrow } from "@/lib/getAssociation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const revalidate = 3600;

const BS_MONTHS = [
  "", "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
];
const AD_MONTHS = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function generateMetadata(): Promise<Metadata> {
  const association = await getAssociationOrThrow();
  return {
    title:       `Committee History — ${association.name}`,
    description: `Past executive committees of ${association.name} since its founding.`,
  };
}

export default async function CommitteeHistoryPage() {
  const association   = await getAssociationOrThrow();
  const associationId = association.id;

  const archived = await prisma.committeeMember.findMany({
    where: { associationId, active: false },
    orderBy: [{ termYearBS: "desc" }, { termMonthBS: "desc" }, { order: "asc" }],
  });

  // Group by BS term year
  const grouped: Record<string, typeof archived> = {};
  for (const m of archived) {
    const key = m.termYearBS
      ? `bs_${m.termYearBS}_${m.termMonthBS ?? 0}`
      : `ad_${m.termYearAD ?? "unknown"}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }

  const terms = Object.entries(grouped).map(([key, members]) => {
    const first = members[0];
    return {
      key,
      termYearBS:  first.termYearBS,
      termMonthBS: first.termMonthBS,
      termYearAD:  first.termYearAD,
      termMonthAD: first.termMonthAD,
      members,
    };
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0a1040] text-white py-16">
        <div className="container-max section-padding">
          <Link
            href="/#committee"
            className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90 mb-6 transition-colors"
          >
            <ChevronLeft size={15} /> Back to current committee
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">
            Committee History
          </h1>
          <p className="text-white/60 max-w-xl">
            A record of every executive committee that has served {association.name} since its founding.
            {terms.length > 0 && ` Showing ${terms.length} past term${terms.length !== 1 ? "s" : ""}.`}
          </p>
        </div>
      </div>

      <div className="container-max section-padding py-12">
        {terms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <p className="text-gray-400">No archived committee data yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {terms.map((term) => {
              const bsLabel  = term.termYearBS  ? `${term.termMonthBS ? BS_MONTHS[term.termMonthBS] + " " : ""}${term.termYearBS} B.S.` : null;
              const adLabel  = term.termYearAD  ? `${term.termMonthAD ? AD_MONTHS[term.termMonthAD] + " " : ""}${term.termYearAD} A.D.` : null;
              const termLabel = [bsLabel, adLabel].filter(Boolean).join(" / ");

              // Separate highlighted (office bearers) from members
              const bearers = term.members.filter((m) => m.highlighted);
              const regular = term.members.filter((m) => !m.highlighted);

              return (
                <section key={term.key}>
                  {/* Term header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px flex-1 bg-gray-200" />
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {term.termYearBS && (
                        <span className="px-3 py-1 text-sm font-semibold bg-[#0a1040] text-white rounded-full">
                          {term.termYearBS} B.S.
                        </span>
                      )}
                      {term.termYearAD && (
                        <span className="px-3 py-1 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                          {term.termYearAD} A.D.
                        </span>
                      )}
                      {!term.termYearBS && !term.termYearAD && (
                        <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-600 rounded-full">
                          Unknown Term
                        </span>
                      )}
                    </div>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  <p className="text-center text-sm text-gray-400 mb-8 -mt-3">
                    Elected {termLabel} · {term.members.length} committee member{term.members.length !== 1 ? "s" : ""}
                  </p>

                  {/* Office bearers */}
                  {bearers.length > 0 && (
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-4">Office Bearers</p>
                      <div className="flex flex-wrap justify-center gap-4">
                        {bearers.map((m) => (
                          <MemberCard key={m.id} member={m} prominent />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regular members */}
                  {regular.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-4">Executive Members</p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {regular.map((m) => (
                          <MemberCard key={m.id} member={m} prominent={false} />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

interface CardMember {
  id: string; name: string; nameNe: string | null;
  role: string; venue: string | null; image: string | null; highlighted: boolean;
}

function MemberCard({ member: m, prominent }: { member: CardMember; prominent: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden text-center ${prominent ? "w-44" : "w-36"}`}>
      <div className={`relative bg-gray-100 ${prominent ? "h-36" : "h-28"}`}>
        {m.image ? (
          <Image src={m.image} alt={m.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl font-serif font-bold">
            {m.name.charAt(0)}
          </div>
        )}
        {m.highlighted && (
          <span className="absolute top-2 right-2 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">★</span>
        )}
      </div>
      <div className="px-2 py-2.5">
        <p className={`font-semibold text-gray-900 leading-tight ${prominent ? "text-sm" : "text-xs"}`}>{m.name}</p>
        {m.nameNe && <p className="text-[10px] text-gray-400 mt-0.5">{m.nameNe}</p>}
        <p className={`text-amber-600 font-medium mt-1 ${prominent ? "text-xs" : "text-[10px]"}`}>{m.role}</p>
        {m.venue && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{m.venue}</p>}
      </div>
    </div>
  );
}
