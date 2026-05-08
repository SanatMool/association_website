import type { Config } from "tailwindcss";

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
          50:  "#eef0fa",
          100: "#d5d9f2",
          200: "#aab3e5",
          300: "#7e8dd8",
          400: "#5267cb",
          500: "#2640be",
          600: "#1c33a8",
          700: "#0d1654",
          800: "#0a1040",
          900: "#060b2c",
          950: "#03061a",
        },
        gold: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },
      fontFamily: {
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-dm-serif)", "Georgia", "serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-pattern":    "linear-gradient(135deg, rgba(6,11,44,0.95) 0%, rgba(10,16,64,0.88) 100%)",
        "mesh-navy": `
          radial-gradient(at 20% 30%, rgba(10,16,64,0.9) 0px, transparent 60%),
          radial-gradient(at 80% 70%, rgba(6,11,44,0.8) 0px, transparent 60%),
          radial-gradient(at 50% 50%, rgba(26,35,126,0.6) 0px, transparent 70%)
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
          "0%, 100%": { borderColor: "rgba(245,158,11,0.3)" },
          "50%":      { borderColor: "rgba(245,158,11,0.7)" },
        },
      },
      boxShadow: {
        "gold":       "0 4px 24px -4px rgba(245,158,11,0.35)",
        "gold-lg":    "0 8px 40px -4px rgba(245,158,11,0.45)",
        "gold-glow":  "0 0 30px rgba(245,158,11,0.2), 0 0 60px rgba(245,158,11,0.1)",
        "navy":       "0 4px 24px -4px rgba(6,11,44,0.45)",
        "navy-lg":    "0 12px 48px -4px rgba(6,11,44,0.55)",
        "card":       "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
        "card-md":    "0 2px 8px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        "card-gold":  "0 8px 32px rgba(0,0,0,0.1), 0 0 0 1.5px rgba(245,158,11,0.3)",
        "glass":      "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
        "inner-gold": "inset 0 1px 0 rgba(245,158,11,0.2)",
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
