"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowRight, X, LayoutGrid, List, SlidersHorizontal, Building2 } from "lucide-react";
import MemberCard from "@/components/ui/MemberCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLocale } from "@/context/LocaleContext";
import { motion, AnimatePresence } from "framer-motion";
import { MemberType } from "@/lib/types";

const CAPACITY_TIERS = [
  { label: "All Sizes", min: 0, max: Infinity },
  { label: "Intimate (<400)", min: 0, max: 399 },
  { label: "Medium (400–699)", min: 400, max: 699 },
  { label: "Large (700–999)", min: 700, max: 999 },
  { label: "Grand (1000+)", min: 1000, max: Infinity },
];

interface MemberDirectoryProps {
  members: MemberType[];
}

export default function MemberDirectory({ members }: MemberDirectoryProps) {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState("All");
  const [capacityTier, setCapacityTier] = useState(0);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const areas = useMemo(() => {
    const areaSet = new Set(members.map((m) => m.area).filter(Boolean));
    return ["All", ...Array.from(areaSet).sort()].slice(0, 12);
  }, [members]);

  const featured = useMemo(() => members.filter((m) => m.featured).slice(0, 6), [members]);

  const filtered = useMemo(() => {
    const tier = CAPACITY_TIERS[capacityTier];
    return members.filter((m) => {
      const matchSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.location ?? "").toLowerCase().includes(search.toLowerCase());
      const matchArea = selectedArea === "All" || m.area === selectedArea;
      const matchCap = m.capacity >= tier.min && m.capacity <= tier.max;
      return matchSearch && matchArea && matchCap;
    });
  }, [search, selectedArea, capacityTier]);

  return (
    <section id="members" className="section-padding bg-white relative overflow-hidden">
      {/* Subtle background mesh */}
      <div className="absolute inset-0 bg-mesh-light opacity-70 pointer-events-none" />
      <div className="container-max">
        {/* Header */}
        <div className="text-center mb-14">
          <AnimatedSection>
            <span className="section-label justify-center">
              <span className="w-8 h-px bg-gold-500" />
              {t.members.label}
              <span className="w-8 h-px bg-gold-500" />
            </span>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="heading-lg text-navy-900 mt-4">{t.members.title}</h2>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <p className="text-body mt-3">{t.members.subtitle}</p>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="gold-divider mx-auto mt-5" />
          </AnimatedSection>
        </div>

        {/* Search + filter bar */}
        <AnimatedSection delay={0.15}>
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 mb-10">
            <div className="flex gap-3 items-center mb-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.members.search_placeholder}
                  className="w-full pl-10 pr-9 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent placeholder-slate-400 text-navy-900"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  showFilters
                    ? "bg-navy-900 border-navy-900 text-gold-400"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Filters</span>
              </button>

              {/* View toggle */}
              <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
                <button
                  onClick={() => setView("grid")}
                  className={`p-3 transition-colors ${view === "grid" ? "bg-navy-900 text-gold-400" : "text-slate-400 hover:text-slate-600"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-3 transition-colors ${view === "list" ? "bg-navy-900 text-gold-400" : "text-slate-400 hover:text-slate-600"}`}
                  aria-label="List view"
                >
                  <List size={15} />
                </button>
              </div>
            </div>

            {/* Expandable filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    {/* Area filter */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Area</p>
                      <div className="flex flex-wrap gap-2">
                        {areas.map((area) => (
                          <button
                            key={area}
                            onClick={() => setSelectedArea(area)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                              selectedArea === area
                                ? "bg-navy-900 text-gold-400"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-navy-300"
                            }`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Capacity filter */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Capacity</p>
                      <div className="flex flex-wrap gap-2">
                        {CAPACITY_TIERS.map((tier, i) => (
                          <button
                            key={tier.label}
                            onClick={() => setCapacityTier(i)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                              capacityTier === i
                                ? "bg-gold-500 text-navy-900"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-gold-300"
                            }`}
                          >
                            {tier.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </AnimatedSection>

        {/* Featured venues (shown when no active search/filter) */}
        {!search && selectedArea === "All" && capacityTier === 0 && (
          <>
            <AnimatedSection delay={0.1}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif font-bold text-navy-900 text-xl flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-gold-500 rounded-full inline-block" />
                  Featured Venues
                </h3>
              </div>
            </AnimatedSection>

            <div className={`mb-14 ${view === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-5" : "flex flex-col gap-4"}`}>
              {featured.map((m, i) => (
                <AnimatedSection key={m.id} delay={0.1 + i * 0.07}>
                  {view === "list" ? (
                    <ListMemberRow member={m} />
                  ) : (
                    <MemberCard member={m} index={i} />
                  )}
                </AnimatedSection>
              ))}
            </div>
          </>
        )}

        {/* Filtered results header */}
        {(search || selectedArea !== "All" || capacityTier !== 0) && (
          <AnimatedSection>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif font-bold text-navy-900 text-lg">
                {filtered.length} venues found
              </h3>
              <button
                onClick={() => { setSearch(""); setSelectedArea("All"); setCapacityTier(0); }}
                className="text-sm text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1"
              >
                <X size={13} />
                Clear filters
              </button>
            </div>
          </AnimatedSection>
        )}

        {/* Results grid/list */}
        {(search || selectedArea !== "All" || capacityTier !== 0) && (
          <div className={view === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10" : "flex flex-col gap-4 mb-10"}>
            {filtered.map((m, i) => (
              view === "list" ? (
                <ListMemberRow key={m.id} member={m} />
              ) : (
                <MemberCard key={m.id} member={m} index={i} />
              )
            ))}
          </div>
        )}

        {/* Browse all CTA */}
        <AnimatedSection>
          <div className="relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-navy-900 rounded-2xl">
            {/* bg decoration */}
            <div className="absolute right-0 top-0 w-64 h-full opacity-5"
              style={{ background: "radial-gradient(circle at right, #f59e0b, transparent 70%)" }}
            />
            <div className="relative">
              <h3 className="font-serif font-bold text-white text-xl">
                Browse All 150+ Member Venues
              </h3>
              <p className="text-white/50 text-sm mt-1">
                Full searchable directory with advanced filters
              </p>
            </div>
            <Link
              href="/members"
              className="relative inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold px-6 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(245,158,11,0.4)] flex-shrink-0"
            >
              View All Members
              <ArrowRight size={16} />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function ListMemberRow({ member }: { member: MemberType }) {
  return (
    <Link
      href={`/members/${member.slug}`}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-gold-200 hover:shadow-card transition-all group"
    >
      <div className="w-11 h-11 rounded-xl bg-navy-900 flex items-center justify-center flex-shrink-0 group-hover:bg-gold-500 transition-colors duration-300">
        <Building2 size={16} className="text-gold-400 group-hover:text-navy-900 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="font-semibold text-navy-900 text-sm truncate">{member.name}</h4>
          {member.featured && (
            <span className="text-xs bg-gold-50 border border-gold-200 text-gold-600 px-2 py-0.5 rounded-full flex-shrink-0">Featured</span>
          )}
        </div>
        <p className="text-xs text-slate-500">{member.location} · {member.capacity.toLocaleString()} guests</p>
      </div>
      <span className="text-gold-600 text-xs font-semibold flex-shrink-0 group-hover:translate-x-1 transition-transform">View →</span>
    </Link>
  );
}
