"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Award, Users, Calendar, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/context/LocaleContext";

const slides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&auto=format&fit=crop&q=80",
    label: "Grand Banquet Halls",
    accent: "Celebrations of a Lifetime",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1920&auto=format&fit=crop&q=80",
    label: "Elegant Wedding Venues",
    accent: "Where Love Stories Begin",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1920&auto=format&fit=crop&q=80",
    label: "Corporate Event Spaces",
    accent: "Professional. Prestigious.",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=1920&auto=format&fit=crop&q=80",
    label: "Celebration Venues",
    accent: "Every Occasion, Perfected",
  },
];

const stats = [
  { icon: Users,    value: "150+", keyLabel: "stats_members"  as const },
  { icon: Award,    value: "14+",  keyLabel: "stats_years"    as const },
  { icon: Calendar, value: "20+",  keyLabel: "stats_events"   as const },
  { icon: MapPin,   value: "100%", keyLabel: "stats_coverage" as const },
];

// Bokeh orbs config
const BOKEH = [
  { cx: "15%",  cy: "25%",  size: 320, color: "rgba(245,158,11,0.07)",  dur: 9  },
  { cx: "80%",  cy: "15%",  size: 260, color: "rgba(255,255,255,0.03)", dur: 13 },
  { cx: "65%",  cy: "75%",  size: 400, color: "rgba(245,158,11,0.05)",  dur: 11 },
  { cx: "30%",  cy: "80%",  size: 200, color: "rgba(100,130,255,0.04)", dur: 8  },
  { cx: "88%",  cy: "55%",  size: 180, color: "rgba(245,158,11,0.06)",  dur: 15 },
];

export default function Hero() {
  const { t } = useLocale();
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [slideProgress, setSlideProgress] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  const SLIDE_DURATION = 5500;

  // Slide auto-play + progress
  useEffect(() => {
    if (!isAutoPlaying) return;
    setSlideProgress(0);
    const startTime = Date.now();

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setSlideProgress(Math.min(100, (elapsed / SLIDE_DURATION) * 100));
    }, 50);

    const slideTimer = setTimeout(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, SLIDE_DURATION);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(slideTimer);
    };
  }, [current, isAutoPlaying]);

  const prev = () => {
    setIsAutoPlaying(false);
    setSlideProgress(0);
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  };
  const next = () => {
    setIsAutoPlaying(false);
    setSlideProgress(0);
    setCurrent((c) => (c + 1) % slides.length);
  };

  // Parallax on scroll
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], ["0%", "25%"]);
  const textY = useTransform(scrollY, [0, 400], ["0%", "15%"]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">

      {/* ── Slideshow background ── */}
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
          style={{ y: bgY }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slides[current].image}
            alt={slides[current].label}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Layered overlays for cinematic depth ── */}
      <div className="absolute inset-0 z-[1]" style={{
        background: "linear-gradient(105deg, rgba(3,6,26,0.96) 0%, rgba(6,11,44,0.88) 40%, rgba(10,16,64,0.70) 70%, rgba(3,6,26,0.55) 100%)"
      }} />
      <div className="absolute inset-0 z-[1]" style={{
        background: "linear-gradient(to top, rgba(3,6,26,0.85) 0%, transparent 50%)"
      }} />
      {/* Subtle color grade — warm amber hint */}
      <div className="absolute inset-0 z-[1] mix-blend-multiply" style={{
        background: "radial-gradient(ellipse at 30% 60%, rgba(245,158,11,0.12) 0%, transparent 60%)"
      }} />

      {/* ── Grain / film texture overlay ── */}
      <div className="absolute inset-0 z-[2] texture-noise pointer-events-none opacity-40" />

      {/* ── Bokeh light orbs ── */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        {BOKEH.map((b, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, 30, -20, 15, 0],
              y: [0, -25, 20, -10, 0],
            }}
            transition={{
              duration: b.dur,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.8,
            }}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: b.cx,
              top: b.cy,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
              filter: "blur(40px)",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      {/* ── Decorative thin horizontal lines ── */}
      <div className="absolute inset-0 z-[3] pointer-events-none">
        <div className="absolute top-[28%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        <div className="absolute top-[72%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        {/* Vertical accent */}
        <div className="absolute top-20 bottom-20 left-[8%] w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent hidden xl:block" />
      </div>

      {/* ── Slide controls ── */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/8 hover:bg-white/16 border border-white/15 hover:border-white/30 flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm hover:scale-110"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/8 hover:bg-white/16 border border-white/15 hover:border-white/30 flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm hover:scale-110"
      >
        <ChevronRight size={18} />
      </button>

      {/* ── Slide indicator — bottom right ── */}
      <div className="absolute bottom-24 right-6 z-20 flex flex-col items-end gap-4">
        {/* Slide label */}
        <AnimatePresence mode="wait">
          <motion.span
            key={current}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-white/45 text-xs tracking-[0.2em] uppercase font-medium"
          >
            {slides[current].label}
          </motion.span>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIsAutoPlaying(false); setSlideProgress(0); setCurrent(i); }}
              aria-label={`Slide ${i + 1}`}
              className="relative overflow-hidden"
            >
              <span className={`block rounded-full transition-all duration-400 ${
                i === current ? "w-7 h-2 bg-gold-400/40" : "w-2 h-2 bg-white/20 hover:bg-white/40"
              }`} />
              {/* Progress fill */}
              {i === current && (
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full bg-gold-400"
                  style={{ width: `${slideProgress}%` }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Counter 01/04 */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/35">
          <span className="text-white/60">0{current + 1}</span>
          <span>/</span>
          <span>0{slides.length}</span>
        </div>
      </div>

      {/* ── Main content ── */}
      <motion.div
        style={{ y: textY, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-36 w-full"
      >
        <div className="grid lg:grid-cols-5 gap-12 items-center">

          {/* ── Left: Text (3/5) ── */}
          <div className="lg:col-span-3">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2.5 mb-8"
            >
              <div className="flex items-center gap-2.5 bg-gold-500/12 hover:bg-gold-500/18 border border-gold-500/30 rounded-full px-4 py-2 backdrop-blur-sm transition-colors">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-400" />
                </div>
                <Award size={13} className="text-gold-400" />
                <span className="text-gold-300 text-sm font-medium tracking-wide">{t.hero.badge}</span>
                <span className="w-px h-3.5 bg-gold-500/40" />
                <span className="text-gold-400/70 text-xs font-mono">Est. 2011</span>
              </div>
            </motion.div>

            {/* Slide accent line */}
            <AnimatePresence mode="wait">
              <motion.p
                key={current}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="text-gold-400/70 text-xs font-semibold tracking-[0.25em] uppercase mb-4"
              >
                {slides[current].accent}
              </motion.p>
            </AnimatePresence>

            {/* Title — staggered word reveal */}
            <div className="overflow-hidden mb-2">
              <motion.h1
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-[4.5rem] font-bold text-white leading-[1.05]"
              >
                Event and Venue
              </motion.h1>
            </div>
            <div className="overflow-hidden mb-7">
              <motion.h1
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-[4.5rem] font-bold leading-[1.05]"
              >
                <span className="text-gradient-gold">Association Nepal</span>
              </motion.h1>
            </div>

            {/* Gold divider */}
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="w-28 h-px bg-gradient-to-r from-gold-500 via-gold-300 to-transparent mb-7"
            />

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="text-xl sm:text-2xl text-white/70 font-light mb-4 italic font-serif"
            >
              {t.hero.subtitle}
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="text-white/50 text-base max-w-lg leading-relaxed mb-10"
            >
              {t.hero.description}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/members"
                className="group relative inline-flex items-center gap-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold px-7 py-4 rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-gold-lg text-base overflow-hidden"
              >
                {/* Shine sweep */}
                <motion.span
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "200%" }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
                />
                {t.hero.cta_primary}
                <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/#join"
                className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/15 border border-white/20 hover:border-white/35 text-white font-semibold px-7 py-4 rounded-xl transition-all duration-200 hover:-translate-y-1 backdrop-blur-sm text-base"
              >
                {t.hero.cta_secondary}
              </Link>
            </motion.div>
          </div>

          {/* ── Right: Floating venue thumbnails (2/5) ── */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="lg:col-span-2 hidden lg:block relative h-[440px]"
          >
            {/* Main large card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-[270px] h-[270px] rounded-2xl overflow-hidden border border-white/10"
              style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.1)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop&q=75"
                alt="Grand Banquet Hall"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/85 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-semibold text-sm">Grand Banquet Hall</p>
                <p className="text-gold-400 text-xs mt-0.5">Kathmandu</p>
              </div>
              {/* Capacity badge */}
              <div className="absolute top-3 right-3 bg-gold-500/90 text-navy-900 text-xs font-bold px-2.5 py-1 rounded-full">
                1200 guests
              </div>
            </motion.div>

            {/* Second card */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute bottom-0 left-0 w-[220px] h-[220px] rounded-2xl overflow-hidden border border-white/10"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&auto=format&fit=crop&q=75"
                alt="Wedding Venue"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/85 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white font-semibold text-xs">Wedding Venue</p>
                <p className="text-gold-400 text-[10px] mt-0.5">Patan</p>
              </div>
            </motion.div>

            {/* Center floating stat badge */}
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-1, 1, -1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              className="absolute top-[42%] left-[28%] bg-gold-500 rounded-2xl px-5 py-4 text-navy-900"
              style={{ boxShadow: "0 12px 40px rgba(245,158,11,0.5), 0 4px 16px rgba(245,158,11,0.3)" }}
            >
              <div className="font-serif font-bold text-3xl leading-none">150+</div>
              <div className="text-xs font-bold mt-1 uppercase tracking-wide opacity-75">
                Member Venues
              </div>
            </motion.div>

            {/* Decorative ring behind thumbnails */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-white/5 pointer-events-none"
              style={{ boxShadow: "inset 0 0 60px rgba(245,158,11,0.04)" }}
            />
          </motion.div>
        </div>

        {/* ── Stats Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {stats.map(({ icon: Icon, value, keyLabel }, i) => (
            <motion.div
              key={keyLabel}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.95 + i * 0.08 }}
              whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
              className="group relative bg-white/[0.06] backdrop-blur-md border border-white/10 hover:border-gold-500/30 rounded-xl p-4 sm:p-5 text-center cursor-default overflow-hidden transition-colors duration-300"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gold-500/0 group-hover:bg-gold-500/5 transition-colors duration-300 rounded-xl pointer-events-none" />

              <div className="w-9 h-9 rounded-lg bg-gold-500/12 group-hover:bg-gold-500/22 flex items-center justify-center mx-auto mb-3 transition-colors duration-300">
                <Icon size={18} className="text-gold-400" />
              </div>
              <div className="font-serif font-bold text-2xl sm:text-3xl text-white mb-0.5 leading-none">
                {value}
              </div>
              <div className="text-white/40 text-[10px] uppercase tracking-wider font-medium">
                {t.hero[keyLabel]}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
      >
        <span className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-medium">Scroll</span>
        <motion.div
          animate={{ y: [0, 9, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-gold-400/80" />
        </motion.div>
      </motion.div>

      {/* ── Bottom gradient fade into next section ── */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/5 to-transparent z-[5] pointer-events-none" />
    </section>
  );
}
