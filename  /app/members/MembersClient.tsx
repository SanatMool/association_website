"use client";

import { useState, useMemo } from "react";
import { Search, Filter, X, Building2 } from "lucide-react";
import MemberCard from "@/components/ui/MemberCard";
import { useLocale } from "@/context/LocaleContext";
import { motion } from "framer-motion";
import { MemberType } from "@/lib/types";

interface MembersClientProps {
  members: MemberType[];
}

export default function MembersClient({ members }: MembersClientProps) {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState("All");

  const areas = useMemo(() => {
    const areaSet = new Set(members.map((m) => m.area).filter(Boolean));
    return ["All", ...Array.from(areaSet).sort()];
  }, [members]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.location ?? "").toLowerCase().includes(search.toLowerCase());
      const matchArea = selectedArea === "All" || m.area === selectedArea;
      return matchSearch && matchArea;
    });
  }, [members, search, selectedArea]);

  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      {/* Page Header */}
      <div className="bg-navy-900 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 text-gold-400 text-sm font-medium mb-4">
              <span className="w-6 h-px bg-gold-500" />
              {t.members.label}
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-3">
              {t.members.title}
            </h1>
            <p className="text-white/60 text-lg">{t.members.subtitle}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 mb-8"
        >
          <div className="relative mb-4">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.members.search_placeholder}
              className="w-full pl-11 pr-10 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent text-sm text-navy-900 placeholder-slate-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter size={14} className="text-slate-400 flex-shrink-0" />
            {areas.slice(0, 15).map((area) => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full transition-all ${
                  selectedArea === area
                    ? "bg-navy-900 text-gold-400"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-500 text-sm">
            Showing <span className="font-semibold text-navy-900">{filtered.length}</span> venues
          </p>
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-gold-500" />
            <span className="text-sm text-slate-500">{members.length} total members</span>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((member, i) => (
              <MemberCard key={member.id} member={member} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Building2 size={40} className="text-slate-300 mx-auto mb-4" />
            <h3 className="font-serif font-bold text-navy-900 text-lg mb-2">No venues found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
            <button onClick={() => { setSearch(""); setSelectedArea("All"); }} className="mt-4 text-gold-600 hover:text-gold-700 text-sm font-medium">
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
