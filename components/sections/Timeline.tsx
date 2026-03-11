"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import AnimatedSection from "@/components/ui/AnimatedSection";

const milestones = [
  {
    year: "2011",
    title: "EVA Nepal Founded",
    description:
      "Event and Venue Association Nepal was formally established in Maitidevi, Kathmandu, uniting the valley's banquet hall and event venue owners under one voice.",
    highlight: true,
    stat: "Founding Year",
  },
  {
    year: "2012",
    title: "First Annual General Meeting",
    description:
      "EVA Nepal held its inaugural Annual General Meeting, establishing the executive committee structure and drafting the association's foundational bylaws.",
    stat: "20+ Founding Members",
  },
  {
    year: "2014",
    title: "Quality Standards Initiative",
    description:
      "The association launched its first Quality Standards Framework, setting benchmarks for service quality, hygiene, and safety across member venues.",
    stat: "First Quality Framework",
  },
  {
    year: "2016",
    title: "Training Programs Launched",
    description:
      "EVA Nepal introduced structured training and workshop programs for venue owners and staff, covering event management, catering standards, and customer service.",
    stat: "500+ Trained",
  },
  {
    year: "2018",
    title: "Member Directory Goes Digital",
    description:
      "The association launched a comprehensive digital member directory, helping event planners and couples find and connect with certified EVA Nepal member venues.",
    stat: "80+ Listed Venues",
  },
  {
    year: "2020",
    title: "Resilience Through Challenge",
    description:
      "EVA Nepal supported its members through industry disruptions, organizing relief coordination, guidance on health protocols, and advocating for the event industry.",
    stat: "Industry Solidarity",
  },
  {
    year: "2022",
    title: "Kathmandu Venue Expo Launched",
    description:
      "The first Kathmandu Venue Expo brought together 40+ member venues at BhrikutiMandap, creating Nepal's largest gathering of event venues in one place.",
    stat: "40+ Venues Exhibited",
  },
  {
    year: "2024",
    title: "Nepal Venue Industry Conference",
    description:
      "EVA Nepal hosted the Nepal Venue Industry Conference, bringing together government officials, industry leaders, and 100+ venue owners for a two-day policy summit.",
    stat: "100+ Attendees",
  },
  {
    year: "2025",
    title: "150+ Member Milestone",
    description:
      "EVA Nepal reached a landmark milestone of 150+ registered member venues across the Kathmandu Valley, cementing its position as the definitive industry body.",
    highlight: true,
    stat: "150+ Members",
  },
];

function TimelineItem({
  item,
  index,
  isLeft,
}: {
  item: (typeof milestones)[0];
  index: number;
  isLeft: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

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

export default function Timeline() {
  return (
    <section className="section-padding relative overflow-hidden" style={{
      background: "linear-gradient(180deg, #060b2c 0%, #0a1040 50%, #060b2c 100%)"
    }}>
      {/* Background texture */}
      <div className="absolute inset-0 bg-mesh-navy opacity-60" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Large decorative text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="text-[16rem] font-serif font-bold text-white/[0.018] leading-none select-none tracking-tight">
          2011
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
              14 Years of Leading<br />
              <span className="text-gold-400">Nepal&apos;s Event Industry</span>
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <p className="text-white/50 mt-3 max-w-xl mx-auto text-base leading-relaxed">
              From a small group of venue owners in 2011 to the definitive industry association representing 150+ venues across Kathmandu Valley.
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
            style={{ background: "linear-gradient(to bottom, rgba(245,158,11,0.6), rgba(245,158,11,0.2) 70%, transparent)" }}
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
              background: "radial-gradient(ellipse at 50% 100%, rgba(245,158,11,0.07) 0%, transparent 60%)"
            }} />

            <div className="relative">
              <h3 className="font-serif font-bold text-white text-2xl sm:text-3xl mb-3">
                Building the Future of Event Venues in Nepal
              </h3>
              <p className="text-white/50 max-w-xl mx-auto mb-10 text-sm leading-relaxed">
                From 2011 to today, EVA Nepal continues to grow, advocate, and elevate the standard of event venues across the Kathmandu Valley.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-10">
                {[
                  { value: "2011", label: "Founded" },
                  { value: "150+", label: "Members" },
                  { value: "14+",  label: "Years"   },
                  { value: "500+", label: "Trained" },
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
