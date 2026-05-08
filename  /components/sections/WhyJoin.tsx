"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Award, Network, BookOpen, Megaphone, ListChecks, HeartHandshake, ArrowRight } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLocale } from "@/context/LocaleContext";

const icons = [Award, Network, BookOpen, Megaphone, ListChecks, HeartHandshake];

export default function WhyJoin() {
  const { t } = useLocale();

  return (
    <section id="join" className="section-padding bg-white relative overflow-hidden">
      {/* Subtle mesh background */}
      <div className="absolute inset-0 bg-mesh-light" />

      {/* Decorative gold orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-navy-900/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />

      <div className="container-max relative z-10">
        <div className="text-center mb-16">
          <AnimatedSection>
            <span className="section-label justify-center">
              <span className="w-8 h-px bg-gold-500" />
              {t.whyjoin.label}
              <span className="w-8 h-px bg-gold-500" />
            </span>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="heading-lg text-navy-900 mt-4">{t.whyjoin.title}</h2>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <p className="text-lead mt-3 max-w-xl mx-auto">
              {t.whyjoin.subtitle}
            </p>
          </AnimatedSection>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {t.whyjoin.benefits.map((benefit: { title: string; desc: string }, i: number) => {
            const Icon = icons[i];
            return (
              <AnimatedSection key={i} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="card card-hover p-7 group h-full"
                >
                  {/* Number + icon row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-navy-900 group-hover:bg-gold-500 flex items-center justify-center transition-all duration-300 shadow-navy">
                      <Icon size={22} className="text-gold-400 group-hover:text-navy-900 transition-colors duration-300" />
                    </div>
                    <span className="text-4xl font-serif font-bold text-slate-100 group-hover:text-gold-100 transition-colors leading-none select-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-navy-900 text-base mb-3 group-hover:text-navy-700 transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {benefit.desc}
                  </p>

                  {/* Bottom hover line */}
                  <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Learn more</span>
                    <ArrowRight size={12} />
                  </div>
                </motion.div>
              </AnimatedSection>
            );
          })}
        </div>

        {/* CTA block */}
        <AnimatedSection delay={0.3}>
          <div className="relative bg-navy-900 rounded-3xl p-10 md:p-14 text-center overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-mesh-navy opacity-80" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-gold-500/15 border border-gold-500/25 rounded-full px-5 py-2 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                <span className="text-gold-300 text-xs font-semibold tracking-wider uppercase">
                  Limited Memberships
                </span>
              </div>

              <h3 className="font-serif font-bold text-white text-2xl sm:text-3xl mb-4">
                Ready to join Nepal's premier venue network?
              </h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                Become part of EVA Nepal and access exclusive benefits, industry advocacy, and a community of 150+ professional venues.
              </p>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block"
              >
                <Link
                  href="/#join"
                  className="inline-flex items-center gap-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-gold-lg text-base"
                >
                  Apply for Membership
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
