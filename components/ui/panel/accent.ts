// Shared accent configuration for the internal panels (admin/portal = gold, platform = indigo).
// Keeps one visual "shape" (glass cards, glow, gradient text, motion) with a swappable color
// identity, instead of duplicating markup per panel. See app/globals.css for the underlying
// .bg-mesh-*, .text-gradient-*, .*-glow-pulse, .animated-gradient-border* utilities this reads.

export type Accent = "gold" | "indigo";

export const ACCENTS: Record<Accent, {
  textGradientClass: string;
  meshClass: string;
  dividerClass: string;
  glowPulseClass: string;
  gradientBorderClass: string;
  hoverBorder: string;      // Tailwind class, e.g. "hover:border-gold-400/30"
  hoverGlowRGBA: string;    // for inline boxShadow hover-glow overlays
  solidText: string;        // Tailwind text color class for numerals/emphasis
  iconBg: string;
  iconBorder: string;
  buttonGradient: string;
  buttonShadow: string;
  buttonTextColor: string;
  focusBorder: string;
  focusShadow: string;
  orbPrimary: string;
  orbSecondary: string;
  spotlight: string;
}> = {
  gold: {
    textGradientClass: "text-gradient-gold",
    meshClass: "bg-mesh-navy",
    dividerClass: "gold-divider",
    glowPulseClass: "gold-glow-pulse",
    gradientBorderClass: "animated-gradient-border",
    hoverBorder: "hover:border-gold-400/30",
    hoverGlowRGBA: "0 12px 48px rgba(10,16,64,0.18), 0 0 0 1.5px rgba(245,158,11,0.3)",
    solidText: "text-amber-400",
    iconBg: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.06))",
    iconBorder: "1px solid rgba(245,158,11,0.3)",
    buttonGradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    buttonShadow: "0 0 24px rgba(245,158,11,0.25), 0 4px 16px rgba(0,0,0,0.3)",
    buttonTextColor: "#060b2c",
    focusBorder: "1px solid rgba(245,158,11,0.5)",
    focusShadow: "0 0 0 3px rgba(245,158,11,0.08)",
    orbPrimary: "rgba(245,158,11,0.18)",
    orbSecondary: "rgba(99,102,241,0.14)",
    spotlight: "rgba(245,158,11,0.07)",
  },
  indigo: {
    textGradientClass: "text-gradient-indigo",
    meshClass: "bg-mesh-indigo",
    dividerClass: "indigo-divider",
    glowPulseClass: "indigo-glow-pulse",
    gradientBorderClass: "animated-gradient-border-indigo",
    hoverBorder: "hover:border-indigo-400/30",
    hoverGlowRGBA: "0 12px 48px rgba(30,27,75,0.28), 0 0 0 1.5px rgba(99,102,241,0.35)",
    solidText: "text-indigo-300",
    iconBg: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))",
    iconBorder: "1px solid rgba(99,102,241,0.35)",
    buttonGradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    buttonShadow: "0 0 24px rgba(99,102,241,0.3), 0 4px 16px rgba(0,0,0,0.3)",
    buttonTextColor: "#ffffff",
    focusBorder: "1px solid rgba(99,102,241,0.55)",
    focusShadow: "0 0 0 3px rgba(99,102,241,0.12)",
    orbPrimary: "rgba(99,102,241,0.22)",
    orbSecondary: "rgba(245,158,11,0.10)",
    spotlight: "rgba(99,102,241,0.10)",
  },
};
