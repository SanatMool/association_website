"use client";

import { ReactNode, InputHTMLAttributes, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Lock, LucideIcon } from "lucide-react";
import { ACCENTS, Accent } from "./accent";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } } };

interface StatTile { value: string; label: string }

interface AuthCardProps {
  accent?: Accent;
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  brandIcon?: LucideIcon; // used instead of logoUrl when there's no logo image (e.g. Platform panel)
  brandName: string;
  description: string;
  statTiles?: StatTile[];
  panelTitle: string;
  panelSubtitle: string;
  headerIcon?: LucideIcon;
  error?: string;
  footerLabel?: string;
  copyrightLabel: string;
  children: ReactNode; // the <form> itself
}

/**
 * Shared login-page shell — extracted from app/(admin)/admin/login/page.tsx,
 * which already had the full glass/gradient/bokeh treatment. Parameterized by
 * accent so portal (gold) and platform (indigo) get the same polish without
 * re-deriving it by hand. Auth logic (NextAuth vs custom cookie POST) stays in
 * each page; this only owns the visual shell + branding panel.
 */
export default function AuthCard({
  accent = "gold", logoUrl, logoWidth = 280, logoHeight = 180, brandIcon: BrandIcon, brandName, description,
  statTiles = [], panelTitle, panelSubtitle, headerIcon: HeaderIcon = Lock, error, footerLabel = "Restricted access",
  copyrightLabel, children,
}: AuthCardProps) {
  const a = ACCENTS[accent];

  const brandMark = (size: number) =>
    logoUrl ? (
      <Image src={logoUrl} alt={brandName} width={logoWidth} height={logoHeight} className="h-auto w-auto" style={{ height: size }} priority />
    ) : BrandIcon ? (
      <div className="rounded-2xl flex items-center justify-center" style={{ width: size, height: size, background: a.iconBg, border: a.iconBorder }}>
        <BrandIcon size={size * 0.45} className={a.solidText} />
      </div>
    ) : null;

  return (
    <div className={`min-h-screen relative overflow-hidden ${a.meshClass}`}>
      <div className="texture-noise scan-line absolute inset-0 pointer-events-none z-0" />

      <div className="absolute pointer-events-none rounded-full" style={{ width: 600, height: 600, top: "-15%", left: "-10%", background: `radial-gradient(circle, ${a.orbPrimary} 0%, transparent 65%)`, animation: "bokehFloat 12s ease-in-out infinite" }} />
      <div className="absolute pointer-events-none rounded-full" style={{ width: 500, height: 500, bottom: "-12%", right: "-8%", background: `radial-gradient(circle, ${a.orbSecondary} 0%, transparent 65%)`, animation: "bokehFloat 16s ease-in-out infinite reverse", animationDelay: "3s" }} />
      <div className="absolute pointer-events-none rounded-full" style={{ width: 350, height: 350, top: "45%", left: "45%", background: `radial-gradient(circle, ${a.orbPrimary} 0%, transparent 65%)`, animation: "bokehFloat 10s ease-in-out infinite", animationDelay: "6s" }} />

      <div className="relative z-10 min-h-screen flex">
        {/* Left panel — branding */}
        <div className="hidden lg:flex flex-col justify-between w-[460px] flex-shrink-0 border-r border-white/[0.07] p-12 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(160deg, ${a.orbPrimary.replace(/[\d.]+\)$/, "0.04)")} 0%, transparent 60%)` }} />

          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 flex justify-center">
            {brandMark(112)}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="relative z-10">
            <div className={`${a.dividerClass} mb-7`} />
            <h2 className="text-4xl font-bold text-white leading-[1.15] tracking-tight mb-5">
              <span className={a.textGradientClass}>{brandName}</span>
            </h2>
            <p className="text-white/40 text-sm leading-relaxed mb-10 max-w-[280px]">{description}</p>

            {statTiles.length > 0 && (
              <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-3 gap-3">
                {statTiles.map(({ value, label }) => (
                  <motion.div key={label} variants={fadeUp} className="card-glass p-4 text-center">
                    <div className={`text-xl font-bold mb-0.5 truncate ${a.solidText}`} title={value}>{value}</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest">{label}</div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.6 }} className="relative z-10">
            <a href="https://www.nibjar.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 group">
              <span className="text-white/30 text-xs group-hover:text-white/50 transition-colors">Powered by Nibjar Solutions</span>
              <Image src="/nibjar/nibjar_white_logo.png" alt="Nibjar Solutions" width={100} height={34} className="h-7 w-auto opacity-40 group-hover:opacity-70 transition-opacity" />
            </a>
          </motion.div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 55% at 65% 50%, ${a.spotlight} 0%, transparent 70%)` }} />

          <motion.div initial={{ opacity: 0, y: 36, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-[400px] relative z-10">
            <div className="lg:hidden flex justify-center mb-8">
              {brandMark(64)}
            </div>

            <div className={`${a.gradientBorderClass} rounded-3xl p-[1.5px] ${a.glowPulseClass}`}>
              <div className="rounded-3xl overflow-hidden" style={{ background: "rgba(8,12,45,0.88)", backdropFilter: "blur(24px)" }}>
                <div className="px-8 pt-7 pb-5 border-b border-white/[0.07] flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight mb-0.5">{panelTitle}</h1>
                    <p className="text-xs text-white/35">{panelSubtitle}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-4" style={{ background: a.iconBg, border: a.iconBorder }}>
                    <HeaderIcon size={15} className={a.solidText} />
                  </div>
                </div>

                <motion.div variants={stagger} initial="hidden" animate="show" className="px-8 py-7">
                  {children}
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl mt-4">
                      <span className="text-red-400 flex-shrink-0 font-bold">✕</span>
                      {error}
                    </motion.div>
                  )}
                </motion.div>

                <div className="px-8 pb-6 border-t border-white/[0.06] pt-4 flex items-center justify-between">
                  <span className="text-[11px] text-white/20">{footerLabel}</span>
                  <a href="https://www.nibjar.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 group">
                    <span className="text-[11px] text-white/20 group-hover:text-white/40 transition-colors">by</span>
                    <Image src="/nibjar/nibjar_white_logo.png" alt="Nibjar Solutions" width={72} height={24} className="h-5 w-auto opacity-30 group-hover:opacity-60 transition-opacity" />
                  </a>
                </div>
              </div>
            </div>

            <p className="text-center text-white/15 text-xs mt-5">{copyrightLabel}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function AuthFieldWrap({ children }: { children: ReactNode }) {
  return <motion.div variants={fadeUp}>{children}</motion.div>;
}

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  accent?: Accent;
  rightSlot?: ReactNode;
}

/** Styled input with an accent-colored focus glow, shared by all 3 login forms. */
export function AuthInput({ label, icon: Icon, accent = "gold", rightSlot, ...inputProps }: AuthInputProps) {
  const a = ACCENTS[accent];
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-[0.18em] mb-2">{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 z-10" />
        <input
          {...inputProps}
          onFocus={(e) => { setFocused(true); inputProps.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); inputProps.onBlur?.(e); }}
          className={`w-full pl-10 ${rightSlot ? "pr-10" : "pr-3"} py-3 rounded-xl text-sm text-white placeholder-white/20 transition-all focus:outline-none`}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: focused ? a.focusBorder : "1px solid rgba(255,255,255,0.1)",
            boxShadow: focused ? a.focusShadow : "none",
          }}
        />
        {rightSlot && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  );
}

interface AuthSubmitButtonProps {
  loading?: boolean;
  accent?: Accent;
  icon: LucideIcon;
  label: string;
}

export function AuthSubmitButton({ loading, accent = "gold", icon: Icon, label }: AuthSubmitButtonProps) {
  const a = ACCENTS[accent];
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 min-h-[48px]"
      style={{ background: a.buttonGradient, color: a.buttonTextColor, boxShadow: a.buttonShadow }}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: `${a.buttonTextColor}4d`, borderTopColor: a.buttonTextColor }} />
      ) : (
        <>
          <Icon size={15} />
          {label}
        </>
      )}
    </button>
  );
}
