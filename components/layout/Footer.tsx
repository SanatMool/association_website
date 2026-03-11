"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube } from "lucide-react";
import { useLocale } from "@/context/LocaleContext";

interface FooterSettings {
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
}

export default function Footer({ settings }: { settings?: FooterSettings }) {
  const { t } = useLocale();

  const tagline   = settings?.tagline   ?? "";
  const phone     = settings?.phone     ?? "+977-1-XXXXXXX";
  const email     = settings?.email     ?? "info@evanepal.org";
  const address   = settings?.address   ?? "Maitidevi, Kathmandu\nNepal";
  const facebook  = settings?.facebook  ?? "https://facebook.com";
  const instagram = settings?.instagram ?? "https://instagram.com";
  const youtube   = settings?.youtube   ?? "https://youtube.com";

  const quickLinks = [
    { href: "/",           label: t.nav.home },
    { href: "/#about",     label: t.nav.about },
    { href: "/members",    label: t.nav.members },
    { href: "/events",     label: t.nav.events },
    { href: "/news",       label: t.nav.news },
    { href: "/#committee", label: t.nav.committee },
    { href: "/#join",      label: t.nav.join },
    { href: "/#contact",   label: t.nav.contact },
  ];

  return (
    <footer className="bg-navy-950 text-white relative overflow-hidden">
      {/* Top gold accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

      {/* Background texture */}
      <div className="absolute inset-0 bg-mesh-navy opacity-40 pointer-events-none" />

      {/* Main Footer */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* ── Brand ── */}
          <div className="lg:col-span-2">
            <div className="mb-5">
              <Image
                src="/evanepal.png"
                alt="EVA Nepal"
                width={160}
                height={103}
                className="h-12 w-auto brightness-0 invert"
              />
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-7 max-w-sm">
              {tagline || `${t.footer.tagline}. ${t.about.description.slice(0, 120)}...`}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{t.footer.follow_us}:</span>
              {[
                { href: facebook,  Icon: Facebook,  hover: "hover:bg-blue-600",  label: "Facebook"  },
                { href: instagram, Icon: Instagram, hover: "hover:bg-pink-600",  label: "Instagram" },
                { href: youtube,   Icon: Youtube,   hover: "hover:bg-red-600",   label: "YouTube"   },
              ].map(({ href, Icon, hover, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`w-9 h-9 rounded-lg bg-white/8 ${hover} flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg`}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* ── Quick Links ── */}
          <div>
            <h3 className="font-semibold text-white mb-5 text-xs tracking-[0.15em] uppercase">
              {t.footer.quick_links}
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-gold-400 text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gold-500/40 group-hover:bg-gold-500 transition-colors flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact Info ── */}
          <div>
            <h3 className="font-semibold text-white mb-5 text-xs tracking-[0.15em] uppercase">
              {t.footer.contact_info}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={14} className="text-gold-500" />
                </div>
                <span className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">{address}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
                  <Phone size={14} className="text-gold-500" />
                </div>
                <a href={`tel:${phone}`} className="text-slate-400 hover:text-gold-400 text-sm transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
                  <Mail size={14} className="text-gold-500" />
                </div>
                <a href={`mailto:${email}`} className="text-slate-400 hover:text-gold-400 text-sm transition-colors">
                  {email}
                </a>
              </li>
            </ul>

            <div className="mt-6 inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-lg px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
              <span className="text-gold-400 text-xs font-semibold">150+ Active Members</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="relative z-10 border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-xs">
            &copy; 2025 {t.footer.association}. {t.footer.rights}
          </p>
          <p className="text-slate-600 text-xs">
            Established 2011 &middot; Maitidevi, Kathmandu
          </p>
        </div>
      </div>
    </footer>
  );
}
