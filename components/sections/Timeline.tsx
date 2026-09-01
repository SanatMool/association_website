"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useSafeInView } from "@/components/ui/useSafeInView";
import { TimelineType } from "@/lib/types";

interface MilestoneItem {
  year: string;
  title: string;
  description: string;
  stat?: string | null;
  highlight?: boolean;
}


function TimelineItem({
  item,
  index,
  isLeft,
}: {
  item: MilestoneItem;
  index: number;
  isLeft: boolean;
}) {
  const { ref, isInView: inView } = useSafeInView("-80px");

  return (
    <div
      ref={ref}
      className={`relative flex items-center gap-0 ${isLeft ? "flex-row" : "flex-row-reverse"} mb-6 lg:mb-10`}
    >
      {/* Content card */}
      <motion.div
        initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
        className={`w-full lg:w-5/12 ${isLeft ? "lg:pr-10" : "lg:pl-10"}`}
      >
        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className={`group relative rounded-2xl p-6 transition-all duration-300 overflow-hidden ${
            item.highlight
              ? "bg-white/8 border border-gold-500/30 backdrop-blur-sm"
              : "bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-sm"
          }`}
        >
          {/* Top accent for highlighted */}
          {item.highlight && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
          )}

          {/* Subtle inner glow */}
          <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
            item.highlight ? "bg-gold-500/5" : "bg-white/3"
          }`} />

          {/* Year badge */}
          <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-4 text-sm font-bold relative ${
            item.highlight
              ? "bg-gold-500 text-navy-900 shadow-gold"
              : "bg-white/10 text-white/80 border border-white/15"
          }`}>
            {item.year}
          </div>

          <h3 className={`font-serif font-bold text-base mb-2 relative ${
            item.highlight ? "text-white" : "text-white/85 group-hover:text-white transition-colors"
          }`}>
            {item.title}
          </h3>
          <p className="text-white/45 text-sm leading-relaxed mb-4 relative">{item.description}</p>

          <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full relative ${
            item.highlight
              ? "bg-gold-500/15 text-gold-400 border border-gold-500/30"
              : "bg-white/8 text-white/50 border border-white/10"
          }`}>
            {item.stat}
          </div>
        </motion.div>
      </motion.div>

      {/* Center spine dot */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="hidden lg:flex flex-shrink-0 w-2/12 items-center justify-center relative z-10"
      >
        <motion.div
          whileHover={{ scale: 1.2 }}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-serif font-bold text-sm cursor-default ${
            item.highlight
              ? "bg-gold-500 border-gold-400 text-navy-900 shadow-[0_0_0_4px_rgba(245,158,11,0.15),0_0_24px_rgba(245,158,11,0.4)]"
              : "bg-navy-800 border-white/15 text-white/70 shadow-[0_0_0_3px_rgba(255,255,255,0.04)]"
          }`}
        >
          {item.year.slice(2)}
        </motion.div>
      </motion.div>

      {/* Spacer */}
      <div className="hidden lg:block w-5/12" />
    </div>
  );
}

interface TimelineProps {
  entries: TimelineType[];
  name?: string;
  foundedYear?: number;
  memberCount?: number;
  yearsActive?: number;
  memberMode?: "venue" | "person";
}

export default function Timeline({ entries, name = "the association", foundedYear = 2011, memberCount = 150, yearsActive = 14, memberMode = "venue" }: TimelineProps) {
  if (!entries || entries.length === 0) return null;
  const isPersonMode = memberMode === "person";

  const milestones: MilestoneItem[] = [...entries]
    .sort((a, b) => a.order - b.order)
    .map((e) => ({
      year: String(e.year),
      title: e.title,
      description: e.description,
      stat: e.stat,
      highlight: e.highlighted,
    }));

  return (
    <section className="section-padding relative overflow-hidden" style={{
      background: "linear-gradient(180deg, rgb(var(--navy-900)) 0%, rgb(var(--navy-800)) 50%, rgb(var(--navy-900)) 100%)"
    }}>
      {/* Background texture */}
      <div className="absolute inset-0 bg-mesh-navy opacity-60" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Large decorative text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="text-[16rem] font-serif font-bold text-white/[0.018] leading-none select-none tracking-tight">
          {foundedYear}
        </span>
      </div>

      <div className="container-max relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <AnimatedSection>
            <span className="section-label justify-center text-gold-400">
              <span className="w-8 h-px bg-gold-500" />
              Our Journey
              <span className="w-8 h-px bg-gold-500" />
            </span>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="heading-lg text-white mt-4">
              {yearsActive} Years of Leading<br />
              <span className="text-gold-400">{isPersonMode ? "Nepal's Professional Community" : "Nepal's Event Industry"}</span>
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <p className="text-white/50 mt-3 max-w-xl mx-auto text-base leading-relaxed">
              {isPersonMode
                ? `From a small group of founding members in ${foundedYear} to the definitive professional association representing ${memberCount}+ members across Kathmandu Valley.`
                : `From a small group of venue owners in ${foundedYear} to the definitive industry association representing ${memberCount}+ venues across Kathmandu Valley.`}
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="gold-divider mx-auto mt-5" />
          </AnimatedSection>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical spine */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 z-0"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 15%, rgba(255,255,255,0.08) 85%, transparent)" }}
          />
          {/* Animated gold progress line */}
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.5, ease: "easeInOut", delay: 0.3 }}
            className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 z-0 origin-top"
            style={{ background: "linear-gradient(to bottom, rgb(var(--gold-500) / 0.6), rgb(var(--gold-500) / 0.2) 70%, transparent)" }}
          />

          <div className="space-y-0">
            {milestones.map((item, index) => (
              <TimelineItem
                key={item.year}
                item={item}
                index={index}
                isLeft={index % 2 === 0}
              />
            ))}
          </div>
        </div>

        {/* Bottom summary */}
        <AnimatedSection delay={0.2}>
          <div className="mt-14 relative bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-12 text-center overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(ellipse at 50% 100%, rgb(var(--gold-500) / 0.07) 0%, transparent 60%)"
            }} />

            <div className="relative">
              <h3 className="font-serif font-bold text-white text-2xl sm:text-3xl mb-3">
                {isPersonMode ? "Building Nepal's Professional Community" : "Building the Future of Event Venues in Nepal"}
              </h3>
              <p className="text-white/50 max-w-xl mx-auto mb-10 text-sm leading-relaxed">
                {isPersonMode
                  ? `From ${foundedYear} to today, ${name} continues to grow, advocate, and elevate standards across Nepal's professional community.`
                  : `From ${foundedYear} to today, ${name} continues to grow, advocate, and elevate the standard of event venues across the Kathmandu Valley.`}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-10">
                {[
                  { value: String(foundedYear), label: "Founded" },
                  { value: `${memberCount}+`, label: isPersonMode ? "Members" : "Member Venues" },
                  { value: `${yearsActive}+`, label: "Years"   },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className="font-serif font-bold text-3xl sm:text-4xl text-gold-400 leading-none">{value}</div>
                    <div className="text-white/40 text-xs uppercase tracking-widest mt-1.5 font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
