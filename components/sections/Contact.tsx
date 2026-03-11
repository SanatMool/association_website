"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube, Clock, ArrowUpRight } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLocale } from "@/context/LocaleContext";

export default function Contact() {
  const { t } = useLocale();

  const cards = [
    {
      icon: MapPin,
      title: "Head Office",
      content: (
        <>
          <p className="text-slate-400 text-sm leading-relaxed">
            Maitidevi<br />Kathmandu, Nepal
          </p>
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-4 text-gold-400 text-sm hover:text-gold-300 transition-colors font-medium"
          >
            View on Maps <ArrowUpRight size={13} />
          </a>
        </>
      ),
    },
    {
      icon: Phone,
      title: "Contact Details",
      content: (
        <div className="space-y-3.5">
          {[
            { Icon: Phone, href: "tel:+977-1-XXXXXXX",    text: "+977-1-XXXXXXX",    isLink: true  },
            { Icon: Mail,  href: "mailto:info@evanepal.org", text: "info@evanepal.org", isLink: true  },
            { Icon: Clock, href: null,                    text: "Sun–Fri: 10am – 5pm",isLink: false },
          ].map(({ Icon, href, text, isLink }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-gold-500" />
              </div>
              {isLink ? (
                <a href={href!} className="text-slate-400 hover:text-gold-400 text-sm transition-colors">
                  {text}
                </a>
              ) : (
                <span className="text-slate-400 text-sm">{text}</span>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Instagram,
      title: t.contact.follow,
      content: (
        <>
          <div className="flex items-center justify-center gap-3 mt-1">
            {[
              { href: "https://facebook.com", Icon: Facebook, hover: "hover:bg-blue-600",  label: "Facebook"  },
              { href: "https://instagram.com",Icon: Instagram, hover: "hover:bg-pink-600", label: "Instagram" },
              { href: "https://youtube.com",  Icon: Youtube,  hover: "hover:bg-red-600",   label: "YouTube"   },
            ].map(({ href, Icon, hover, label }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                whileHover={{ scale: 1.12, y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`w-12 h-12 rounded-xl bg-white/10 ${hover} flex items-center justify-center transition-colors duration-200`}
              >
                <Icon size={20} className="text-white" />
              </motion.a>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-5 text-center leading-relaxed">
            Stay updated with latest news<br />and events from EVA Nepal
          </p>
        </>
      ),
    },
  ];

  return (
    <section id="contact" className="section-padding relative overflow-hidden" style={{ background: "linear-gradient(160deg, #03061a 0%, #060b2c 50%, #0a1040 100%)" }}>
      {/* Background mesh */}
      <div className="absolute inset-0 bg-mesh-navy opacity-50" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="container-max relative z-10">
        <div className="text-center mb-16">
          <AnimatedSection>
            <span className="section-label justify-center text-gold-400">
              <span className="w-8 h-px bg-gold-500" />
              {t.contact.label}
              <span className="w-8 h-px bg-gold-500" />
            </span>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="heading-lg text-white mt-4">{t.contact.title}</h2>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="gold-divider mx-auto mt-5" />
          </AnimatedSection>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <AnimatedSection key={card.title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="relative bg-white/5 backdrop-blur-sm border border-white/10 hover:border-gold-500/25 rounded-2xl p-8 text-center h-full flex flex-col transition-colors duration-300 group"
                >
                  {/* Top accent line */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-gold-500/0 group-hover:bg-gold-500/60 rounded-full transition-all duration-500" />

                  <div className="w-14 h-14 bg-gold-500/15 group-hover:bg-gold-500/25 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors duration-300">
                    <Icon size={24} className="text-gold-400" />
                  </div>
                  <h3 className="font-serif font-bold text-white text-lg mb-4">
                    {card.title}
                  </h3>
                  <div className="flex-1">
                    {card.content}
                  </div>
                </motion.div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
