"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Globe } from "lucide-react";
import Image from "next/image";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { t, locale, setLocale } = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/",         label: t.nav.home },
    { href: "/#about",   label: t.nav.about },
    { href: "/members",  label: t.nav.members },
    { href: "/events",   label: t.nav.events },
    { href: "/news",     label: t.nav.news },
    { href: "/#committee", label: t.nav.committee },
    { href: "/#contact", label: t.nav.contact },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0]);

  // On the homepage the hero is dark so we can start transparent.
  // On every other page (members, events, news, slug pages) the background is
  // light — always use the solid dark style so text remains visible.
  const isHomepage = pathname === "/";
  const solidNav = isScrolled || !isHomepage;

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0,    opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        solidNav
          ? "bg-navy-950/95 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.4)] py-2"
          : "bg-transparent py-4"
      )}
    >
      {/* Top gold line — visible on interior pages always, on homepage only when scrolled */}
      <AnimatePresence>
        {solidNav && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500 to-transparent origin-center"
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center group">
            <motion.div
              whileHover={{ scale: 1.04 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Image
                src="/evanepal.png"
                alt="EVA Nepal"
                width={120}
                height={77}
                className="h-10 w-auto brightness-0 invert"
                priority
              />
            </motion.div>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden lg:flex items-center">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-sm font-medium transition-colors duration-200 group"
                >
                  <span className={cn(
                    "transition-colors duration-200",
                    active ? "text-gold-400" : "text-white/70 group-hover:text-white"
                  )}>
                    {link.label}
                  </span>
                  {/* Animated underline */}
                  <motion.span
                    layoutId="nav-underline"
                    className={cn(
                      "absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gold-500",
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                    )}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                </Link>
              );
            })}
          </nav>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <motion.button
                onClick={() => setLangOpen(!langOpen)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-white/8 transition-all tracking-wider uppercase"
              >
                <Globe size={13} />
                {locale}
                <ChevronDown
                  size={11}
                  className={cn("transition-transform duration-200", langOpen ? "rotate-180" : "")}
                />
              </motion.button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0,  scale: 1 }}
                    exit={{   opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden min-w-[130px]"
                  >
                    {[
                      { code: "en", label: "English",  flag: "🇬🇧" },
                      { code: "ne", label: "नेपाली", flag: "🇳🇵" },
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setLocale(lang.code as "en" | "ne"); setLangOpen(false); }}
                        className={cn(
                          "w-full text-left px-4 py-3 text-sm flex items-center gap-2.5 transition-colors",
                          locale === lang.code
                            ? "bg-navy-900 text-gold-400 font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <span>{lang.flag}</span>
                        {lang.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Join CTA */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="hidden sm:block"
            >
              <Link
                href="/#join"
                className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 hover:shadow-gold"
              >
                {t.nav.join}
              </Link>
            </motion.div>

            {/* Mobile Toggle */}
            <motion.button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              whileTap={{ scale: 0.9 }}
              className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isMobileOpen ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={{   rotate:  90,  opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{   opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden bg-navy-950/98 backdrop-blur-xl border-t border-white/8"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      isActive(link.href)
                        ? "text-gold-400 bg-white/8"
                        : "text-white/70 hover:text-white hover:bg-white/6"
                    )}
                  >
                    {isActive(link.href) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mr-2.5" />
                    )}
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.04, duration: 0.2 }}
                className="pt-1"
              >
                <Link
                  href="/#join"
                  onClick={() => setIsMobileOpen(false)}
                  className="block w-full text-center bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold text-sm px-4 py-3.5 rounded-xl mt-1 transition-colors"
                >
                  {t.nav.join}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
