"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLocale } from "@/context/LocaleContext";
import { getSectionIcon, type ContentItem } from "@/lib/homepage-content";

// Icon names used for the i18n-default items (positional, matches their original lucide imports)
const DEFAULT_ICON_NAMES = ["Shield", "Star", "TrendingUp", "Network", "BookOpen", "Users"];

const accentColors = [
  { bg: "bg-blue-500/10",    icon: "text-blue-400",    border: "hover:border-blue-400/30",   num: "text-blue-400/40"   },
  { bg: "bg-gold-500/10",    icon: "text-gold-400",    border: "hover:border-gold-400/30",   num: "text-gold-400/40"   },
  { bg: "bg-emerald-500/10", icon: "text-emerald-400", border: "hover:border-emerald-400/30",num: "text-emerald-400/40"},
  { bg: "bg-purple-500/10",  icon: "text-purple-400",  border: "hover:border-purple-400/30", num: "text-purple-400/40" },
  { bg: "bg-rose-500/10",    icon: "text-rose-400",    border: "hover:border-rose-400/30",   num: "text-rose-400/40"   },
  { bg: "bg-cyan-500/10",    icon: "text-cyan-400",    border: "hover:border-cyan-400/30",   num: "text-cyan-400/40"   },
];

interface MissionProps {
  items?: ContentItem[];
}

export default function Mission({ items }: MissionProps) {
  const { t } = useLocale();

  const displayItems: ContentItem[] = items && items.length > 0
    ? items
    : t.mission.items.map((item: { title: string; desc: string }, i: number) => ({
        icon: DEFAULT_ICON_NAMES[i % DEFAULT_ICON_NAMES.length],
        title: item.title,
        desc: item.desc,
      }));

  return (
    <section className="section-padding relative overflow-hidden" style={{ background: "linear-gradient(160deg, rgb(var(--navy-900)) 0%, rgb(var(--navy-800)) 60%, rgb(var(--navy-700)) 100%)" }}>
      {/* Background mesh */}
      <div className="absolute inset-0 bg-mesh-navy opacity-60" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="container-max relative z-10">
        <div className="text-center mb-16">
          <AnimatedSection>
            <span className="section-label justify-center text-gold-400">
              <span className="w-8 h-px bg-gold-500" />
              {t.mission.label}
              <span className="w-8 h-px bg-gold-500" />
            </span>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="heading-lg text-white mt-4">
              {t.mission.title}
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="gold-divider mx-auto mt-5" />
          </AnimatedSection>
        </div>

        <div className="flex flex-wrap justify-center gap-5">
          {displayItems.map((item, i) => {
            const Icon = getSectionIcon(item.icon);
            const color = accentColors[i % accentColors.length];
            return (
              <AnimatedSection key={i} delay={i * 0.08} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`relative bg-white/5 backdrop-blur-sm border border-white/10 ${color.border} rounded-2xl p-7 transition-all duration-300 h-full group overflow-hidden`}
                >
                  {/* Large background number */}
                  <span className={`absolute top-4 right-5 text-7xl font-serif font-bold ${color.num} leading-none select-none`}>
                    {i + 1}
                  </span>

                  {/* Icon */}
                  <div className={`relative w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center mb-5 transition-transform group-hover:scale-110`}>
                    <Icon size={22} className={color.icon} />
                  </div>

                  <h3 className="font-serif font-bold text-white text-lg mb-3 relative">
                    {item.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed relative">
                    {item.desc}
                  </p>

                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ${color.bg.replace("/10", "/60")}`} />
                </motion.div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
