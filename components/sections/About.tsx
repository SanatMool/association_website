"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLocale } from "@/context/LocaleContext";
import { Building2, Calendar, MapPin, Globe, TrendingUp } from "lucide-react";

interface AboutProps {
  foundedYear?: number;
  location?: string;
  memberCount?: number;
  yearsActive?: number;
  name?: string;
  description?: string;
  memberMode?: "venue" | "person";
  aboutImage?: string;
  aboutHeadline?: string;
  aboutBadge?: string;
  aboutGrowingLabel?: string;
  coverageArea?: string;
}

export default function About({ foundedYear = 2011, location = "Maitidevi, Kathmandu", memberCount = 150, yearsActive = 14, name = "EVA Nepal", description, memberMode = "venue", aboutImage, aboutHeadline, aboutBadge, aboutGrowingLabel, coverageArea = "Kathmandu Valley" }: AboutProps) {
  const { t } = useLocale();
  const isPersonMode = memberMode === "person";
  const shortName = name.split(" ")[0];

  const details = [
    { icon: Calendar,   label: t.about.established, value: String(foundedYear) },
    { icon: MapPin,     label: t.about.hq,          value: location },
    { icon: Globe,      label: t.about.coverage,    value: coverageArea },
    { icon: Building2,  label: "Members",            value: isPersonMode ? `${memberCount}+` : `${memberCount}+ Venues` },
  ];

  return (
    <section id="about" className="section-padding bg-white">
      <div className="container-max">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: Content ── */}
          <div>
            <AnimatedSection>
              <span className="section-label">
                <span className="w-8 h-px bg-gold-500" />
                About {shortName}
              </span>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <h2 className="heading-lg text-navy-900 mt-4 mb-6">
                {aboutHeadline || t.about.title}
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <p className="text-body text-lg mb-8">
                {description || t.about.description}
              </p>
            </AnimatedSection>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              {details.map(({ icon: Icon, label, value }, i) => (
                <AnimatedSection key={label} delay={0.3 + i * 0.08}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-gold-200 hover:shadow-card transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-navy-900 group-hover:bg-gold-500 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                      <Icon size={16} className="text-gold-400 group-hover:text-navy-900 transition-colors duration-300" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                        {label}
                      </div>
                      <div className="font-bold text-navy-900 text-sm mt-0.5">
                        {value}
                      </div>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>

          {/* ── Right: Visual ── */}
          <AnimatedSection direction="left" delay={0.2}>
            <div className="relative">

              {/* Main image */}
              <div className="relative h-[440px] rounded-3xl overflow-hidden shadow-navy-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={aboutImage || (isPersonMode
                    ? "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&auto=format&fit=crop&q=80"
                    : "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=900&auto=format&fit=crop&q=80")}
                  alt={isPersonMode ? "Professional community in Kathmandu" : "Grand banquet hall in Kathmandu"}
                  className="w-full h-full object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/20 to-transparent" />

                {/* Bottom text overlay — extra bottom padding keeps this clear of the floating
                    stat card below, which overlaps this same corner by design */}
                <div className="absolute bottom-0 left-0 right-0 p-8 pb-20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                    <span className="text-gold-300 text-xs font-semibold tracking-wider uppercase">
                      {aboutBadge || "Official Industry Body"}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {isPersonMode
                      ? `Representing ${shortName}'s professional community since ${foundedYear}`
                      : `Representing ${shortName}'s premier event venues since ${foundedYear}`}
                  </p>
                </div>
              </div>

              {/* Floating stat — bottom left */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-card-hover p-5 border border-slate-100/80"
              >
                <div className="text-3xl font-serif font-bold text-navy-900">{memberCount}+</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-wide">
                  {isPersonMode ? "Members" : "Member Venues"}
                </div>
              </motion.div>

              {/* Floating stat — top right */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute -top-5 -right-5 bg-gold-500 rounded-2xl shadow-gold p-4 text-navy-900"
              >
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-navy-900/70" />
                  <span className="text-xs font-bold uppercase tracking-wide">{aboutGrowingLabel || "Growing"}</span>
                </div>
                <div className="text-2xl font-serif font-bold mt-1">{yearsActive} Yrs</div>
              </motion.div>

              {/* Decorative ring */}
              <div className="absolute -bottom-3 -right-3 w-24 h-24 border-2 border-gold-500/20 rounded-3xl -z-10" />
            </div>
          </AnimatedSection>

        </div>
      </div>
    </section>
  );
}
