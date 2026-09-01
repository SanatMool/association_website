"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useSafeInView } from "@/components/ui/useSafeInView";
import { Building2, Award, Calendar, MapPin, type LucideIcon } from "lucide-react";

interface StatsSectionProps {
  memberCount?: number;
  eventsHosted?: number;
  yearsActive?: number;
  foundedYear?: number;
  shortName?: string;
  memberMode?: string;
  coverageArea?: string;
  statsHeadlinePrefix?: string;
  statsHeadlineAccent?: string;
  statsTagline?: string;
}

function Counter({
  value,
  suffix,
  duration = 2.2,
}: {
  value: number;
  suffix: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const end = start + duration * 1000;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / (duration * 1000));
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(value);
    };

    requestAnimationFrame(tick);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : count}
      {suffix}
    </span>
  );
}

function StatCard({ value, suffix, label, desc, icon: Icon, delay }: {
  value: number; suffix: string; label: string; desc: string; icon: LucideIcon; delay: number;
}) {
  const { ref, isInView } = useSafeInView("-40px");

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group"
    >
      {/* Card */}
      <div className="relative bg-white/[0.04] backdrop-blur-sm border border-white/10 hover:border-gold-500/35 rounded-2xl p-6 sm:p-8 text-center overflow-hidden transition-all duration-300 h-full">
        {/* Hover glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold-500/0 to-gold-500/0 group-hover:from-gold-500/5 group-hover:to-transparent rounded-2xl transition-all duration-500 pointer-events-none" />

        {/* Top accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-16 h-[2px] bg-gradient-to-r from-transparent via-gold-500 to-transparent transition-all duration-500" />

        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gold-500/10 group-hover:bg-gold-500/20 flex items-center justify-center mx-auto mb-5 transition-colors duration-300">
          <Icon size={22} className="text-gold-400" />
        </div>

        {/* Counter */}
        <div className="font-serif font-bold text-4xl sm:text-5xl text-white mb-2 leading-none tracking-tight">
          <Counter value={value} suffix={suffix} />
        </div>

        {/* Label */}
        <div className="text-gold-400 font-semibold text-sm mb-2 tracking-wide">
          {label}
        </div>

        {/* Description */}
        <p className="text-white/40 text-xs leading-relaxed">
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

export default function StatsSection({ memberCount = 150, eventsHosted = 20000, yearsActive = 14, foundedYear = 2011, shortName = "EVA", memberMode = "venue", coverageArea = "Kathmandu Valley", statsHeadlinePrefix, statsHeadlineAccent, statsTagline }: StatsSectionProps) {
  const isPersonMode = memberMode === "person";
  const stats = [
    { value: memberCount, suffix: "+", label: isPersonMode ? "Members" : "Member Venues",  desc: isPersonMode ? "Registered members of the association" : "Registered banquet halls & event spaces", icon: Building2, delay: 0   },
    { value: yearsActive, suffix: "+", label: "Years Leading",  desc: isPersonMode ? `Serving Nepal's professional community since ${foundedYear}` : `Serving Nepal's event industry since ${foundedYear}`, icon: Award, delay: 0.1 },
    { value: eventsHosted, suffix: "+", label: "Events Hosted", desc: isPersonMode ? "Across all members collectively" : "Across all member venues collectively", icon: Calendar,  delay: 0.2 },
    { value: 100,         suffix: "%", label: "Valley Coverage",desc: isPersonMode ? `${coverageArea}'s largest professional network` : `${coverageArea}'s largest venue network`, icon: MapPin,    delay: 0.3 },
  ];

  const eyebrow = useSafeInView();
  const tagline = useSafeInView();

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Rich dark background */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(135deg, rgb(var(--navy-950)) 0%, rgb(var(--navy-900)) 40%, rgb(var(--navy-800)) 70%, rgb(var(--navy-900)) 100%)"
      }} />
      <div className="absolute inset-0 bg-mesh-navy opacity-70" />

      {/* Top & bottom gold accent lines */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      {/* Ambient gold glow */}
      <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[220px] h-[140px] sm:w-[350px] sm:h-[220px] lg:w-[500px] lg:h-[300px] rounded-full bg-gold-500/6 blur-[100px] pointer-events-none" />
      <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[180px] h-[100px] sm:w-[280px] sm:h-[150px] lg:w-[400px] lg:h-[200px] rounded-full bg-blue-600/5 blur-[80px] pointer-events-none" />

      {/* Decorative large faded text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="text-[7rem] sm:text-[12rem] lg:text-[20rem] font-serif font-bold text-white/[0.015] leading-none select-none">
          {shortName}
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section eyebrow */}
        <motion.div
          ref={eyebrow.ref}
          initial={{ opacity: 0, y: 16 }}
          animate={eyebrow.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2.5 text-gold-400 font-semibold text-xs tracking-[0.2em] uppercase">
            <span className="w-8 h-px bg-gold-500" />
            The Numbers
            <span className="w-8 h-px bg-gold-500" />
          </span>
          <h2 className="font-serif font-bold text-white text-3xl sm:text-4xl mt-4 leading-tight">
            {statsHeadlinePrefix || "A Decade of Impact,"}<br />
            <span className="text-gold-400">{statsHeadlineAccent || "By the Numbers"}</span>
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Bottom tagline */}
        <motion.div
          ref={tagline.ref}
          initial={{ opacity: 0 }}
          animate={tagline.isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-white/35 text-sm font-medium tracking-wider uppercase">
            {statsTagline || (isPersonMode ? "Nepal's Premier Professional Association" : "Nepal's Premier Event & Venue Association")} · Est. {foundedYear}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
