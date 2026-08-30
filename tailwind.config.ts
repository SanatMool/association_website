import type { Config } from "tailwindcss";

// Each value is `rgb(var(--x) / <alpha-value>)`, where the CSS variable holds a "R G B" triple
// (defined in app/globals.css, overridden per-association in app/layout.tsx via
// lib/theme-presets.ts). Tailwind auto-substitutes the literal `<alpha-value>` placeholder at
// compile time (its documented technique for CSS-variable-based colors), so opacity modifiers
// like bg-navy-900/50 keep working — every existing bg-navy-900 / text-gold-500 / etc. class
// name is unchanged, only the resolved color becomes dynamic.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  "rgb(var(--navy-50) / <alpha-value>)",
          100: "rgb(var(--navy-100) / <alpha-value>)",
          200: "rgb(var(--navy-200) / <alpha-value>)",
          300: "rgb(var(--navy-300) / <alpha-value>)",
          400: "rgb(var(--navy-400) / <alpha-value>)",
          500: "rgb(var(--navy-500) / <alpha-value>)",
          600: "rgb(var(--navy-600) / <alpha-value>)",
          700: "rgb(var(--navy-700) / <alpha-value>)",
          800: "rgb(var(--navy-800) / <alpha-value>)",
          900: "rgb(var(--navy-900) / <alpha-value>)",
          950: "rgb(var(--navy-950) / <alpha-value>)",
        },
        gold: {
          50:  "rgb(var(--gold-50) / <alpha-value>)",
          100: "rgb(var(--gold-100) / <alpha-value>)",
          200: "rgb(var(--gold-200) / <alpha-value>)",
          300: "rgb(var(--gold-300) / <alpha-value>)",
          400: "rgb(var(--gold-400) / <alpha-value>)",
          500: "rgb(var(--gold-500) / <alpha-value>)",
          600: "rgb(var(--gold-600) / <alpha-value>)",
          700: "rgb(var(--gold-700) / <alpha-value>)",
          800: "rgb(var(--gold-800) / <alpha-value>)",
          900: "rgb(var(--gold-900) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-dm-serif)", "Georgia", "serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-pattern":    "linear-gradient(135deg, rgb(var(--navy-900) / 0.95) 0%, rgb(var(--navy-800) / 0.88) 100%)",
        "mesh-navy": `
          radial-gradient(at 20% 30%, rgb(var(--navy-800) / 0.9) 0px, transparent 60%),
          radial-gradient(at 80% 70%, rgb(var(--navy-900) / 0.8) 0px, transparent 60%),
          radial-gradient(at 50% 50%, rgb(var(--navy-600) / 0.6) 0px, transparent 70%)
        `,
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        "fade-up":    "fadeUp 0.6s ease-out forwards",
        "fade-in":    "fadeIn 0.4s ease-out forwards",
        shimmer:      "shimmer 2.5s linear infinite",
        "float":      "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "pulse-gold": "pulseGold 3s ease-in-out infinite",
        "spin-slow":  "spin 20s linear infinite",
        "border-glow":"borderGlow 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(32px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-300% 0" },
          "100%": { backgroundPosition: "300% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-12px)" },
        },
        pulseGold: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%":      { opacity: "1",   transform: "scale(1.05)" },
        },
        borderGlow: {
          "0%, 100%": { borderColor: "rgb(var(--gold-500) / 0.3)" },
          "50%":      { borderColor: "rgb(var(--gold-500) / 0.7)" },
        },
      },
      boxShadow: {
        "gold":       "0 4px 24px -4px rgb(var(--gold-500) / 0.35)",
        "gold-lg":    "0 8px 40px -4px rgb(var(--gold-500) / 0.45)",
        "gold-glow":  "0 0 30px rgb(var(--gold-500) / 0.2), 0 0 60px rgb(var(--gold-500) / 0.1)",
        "navy":       "0 4px 24px -4px rgb(var(--navy-900) / 0.45)",
        "navy-lg":    "0 12px 48px -4px rgb(var(--navy-900) / 0.55)",
        "card":       "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
        "card-md":    "0 2px 8px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        "card-gold":  "0 8px 32px rgba(0,0,0,0.1), 0 0 0 1.5px rgb(var(--gold-500) / 0.3)",
        "glass":      "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
        "inner-gold": "inset 0 1px 0 rgb(var(--gold-500) / 0.2)",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.21, 0.47, 0.32, 0.98)",
        "bounce-soft": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
