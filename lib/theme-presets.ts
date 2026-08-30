/**
 * Per-association color presets. Each preset mirrors the exact shade-step shape of the
 * original navy/gold Tailwind palette (11 steps 50-950 for primary, 10 steps 50-900 for
 * accent) so every existing `bg-navy-900` / `text-gold-500` etc. class across the app keeps
 * working unchanged — only the resolved color changes, via CSS custom properties injected in
 * app/layout.tsx. Ramps are hand-curated (mostly adapted from Tailwind's own well-tested
 * default palette hues) rather than generated at runtime, so every combination is guaranteed
 * to look intentional instead of random.
 */

export interface PrimaryRamp {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string;
}

export interface AccentRamp {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string;
}

export interface ThemePreset {
  key: string;
  label: string;
  primary: PrimaryRamp;
  accent: AccentRamp;
}

export const DEFAULT_THEME_PRESET = "navy-gold" as const;

export const THEME_PRESETS: Record<string, ThemePreset> = {
  "navy-gold": {
    key: "navy-gold",
    label: "Navy & Gold",
    primary: {
      50: "#eef0fa", 100: "#d5d9f2", 200: "#aab3e5", 300: "#7e8dd8", 400: "#5267cb",
      500: "#2640be", 600: "#1c33a8", 700: "#0d1654", 800: "#0a1040", 900: "#060b2c", 950: "#03061a",
    },
    accent: {
      50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24",
      500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f",
    },
  },
  "emerald-amber": {
    key: "emerald-amber",
    label: "Emerald & Amber",
    primary: {
      50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399",
      500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b", 950: "#022c22",
    },
    accent: {
      50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24",
      500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f",
    },
  },
  "burgundy-champagne": {
    key: "burgundy-champagne",
    label: "Burgundy & Champagne",
    primary: {
      50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185",
      500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337", 950: "#4c0519",
    },
    accent: {
      50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15",
      500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12",
    },
  },
  "charcoal-copper": {
    key: "charcoal-copper",
    label: "Charcoal & Copper",
    primary: {
      50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa",
      500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b", 950: "#09090b",
    },
    accent: {
      50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c",
      500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12",
    },
  },
  "royal-blue-coral": {
    key: "royal-blue-coral",
    label: "Royal Blue & Coral",
    primary: {
      50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa",
      500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554",
    },
    accent: {
      50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171",
      500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d",
    },
  },
  "plum-terracotta": {
    key: "plum-terracotta",
    label: "Plum & Terracotta",
    primary: {
      50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa",
      500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065",
    },
    accent: {
      50: "#fdf4f2", 100: "#fbe7e2", 200: "#f5c9bd", 300: "#eda690", 400: "#d8836a",
      500: "#c2685a", 600: "#a8503f", 700: "#8a3d2f", 800: "#6b2e24", 900: "#4f221a",
    },
  },
};

export function getThemePreset(key: string | null | undefined): ThemePreset {
  if (key && key in THEME_PRESETS) return THEME_PRESETS[key];
  return THEME_PRESETS[DEFAULT_THEME_PRESET];
}

export function hexToRgbTriple(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function themePresetToCssVars(preset: ThemePreset): string {
  const navyVars = (Object.entries(preset.primary) as [string, string][])
    .map(([shade, hex]) => `--navy-${shade}: ${hexToRgbTriple(hex)};`)
    .join(" ");
  const goldVars = (Object.entries(preset.accent) as [string, string][])
    .map(([shade, hex]) => `--gold-${shade}: ${hexToRgbTriple(hex)};`)
    .join(" ");
  return `${navyVars} ${goldVars}`;
}
