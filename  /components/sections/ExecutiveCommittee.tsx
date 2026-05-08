"use client";

import CommitteeCard from "@/components/ui/CommitteeCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLocale } from "@/context/LocaleContext";
import { CommitteeType } from "@/lib/types";

interface ExecutiveCommitteeProps {
  committee: CommitteeType[];
}

export default function ExecutiveCommittee({ committee }: ExecutiveCommitteeProps) {
  const { t } = useLocale();

  const leadership = committee.filter((m) => m.order <= 4);
  const rest = committee.filter((m) => m.order > 4);

  return (
    <section id="committee" className="section-padding bg-slate-50 relative overflow-hidden">
      {/* Subtle decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold-500/3 rounded-full translate-x-1/2 -translate-y-1/4 pointer-events-none" />

      <div className="container-max relative z-10">
        <div className="text-center mb-16">
          <AnimatedSection>
            <span className="section-label justify-center">
              <span className="w-8 h-px bg-gold-500" />
              {t.committee.label}
              <span className="w-8 h-px bg-gold-500" />
            </span>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="heading-lg text-navy-900 mt-4">
              {t.committee.title}
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <p className="text-body mt-3 max-w-xl mx-auto">
              {t.committee.subtitle}
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="gold-divider mx-auto mt-5" />
          </AnimatedSection>
        </div>

        {/* Leadership — President & VP highlighted */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {leadership.map((member, i) => (
            <AnimatedSection key={member.id} delay={i * 0.08}>
              <CommitteeCard member={member} highlighted={member.order <= 2} />
            </AnimatedSection>
          ))}
        </div>

        {/* Divider */}
        <div className="relative my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-200" />
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest whitespace-nowrap px-2">
            Committee Members
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-200" />
        </div>

        {/* Remaining committee */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {rest.map((member, i) => (
            <AnimatedSection key={member.id} delay={0.3 + i * 0.06}>
              <CommitteeCard member={member} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
