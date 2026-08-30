/**
 * Per-association color presets. Each preset mirrors the exact shade-step shape of the
 * original navy/gold Tailwind palette (11 steps 50-950 for primary, 10 steps 50-900 for
 * accent) so every existing `bg-navy-900` / `text-gold-500` etc. class across the app keeps
 * working unchanged — only the resolved color changes, via CSS custom properties injected in
 * app/layout.tsx.
 *
 * Every colorful primary ramp (all except the neutral-based Charcoal/Onyx/Espresso families,
 * which are already dark enough as-is) is built from the ORIGINAL navy ramp's own measured
 * HSL lightness/saturation curve — not from Tailwind's off-the-shelf UI palettes. Tailwind's
 * stock "900" shades (e.g. blue-900 at L≈33%, rose-900 at L≈30%) are far lighter than navy's
 * actual 900 (L≈9.8%), so directly substituting them made large section backgrounds render as
 * flat, bright, saturated color blocks instead of navy's moody near-black depth — the exact
 * "not premium" defect this curve fixes. Applying navy's real curve (700≈19%L, 800≈14.5%L,
 * 900≈9.8%L, 950≈5.7%L, all ~73-79% saturation — dark AND rich, like a jewel tone, not
 * desaturated/gray) at each preset's hue keeps every preset's depth and richness consistent
 * with the original. Accent ramps keep their existing shape (that role wasn't the problem);
 * the one exception is the ex-"coral" accent, replaced with a muted oxblood — pure red reads
 * as an alarm/urgent color in UI, which fights a premium/institutional tone regardless of the
 * primary it's paired with.
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
      50: "#eefaf7", 100: "#d5f2ea", 200: "#aae5d4", 300: "#7ed8bf", 400: "#52cba9",
      500: "#26be93", 600: "#1ca880", 700: "#0d5440", 800: "#0a4031", 900: "#062c21", 950: "#031a14",
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
      50: "#faeef1", 100: "#f2d5dd", 200: "#e5aabb", 300: "#d87e98", 400: "#cb5274",
      500: "#be2651", 600: "#a81c44", 700: "#540d21", 800: "#400a19", 900: "#2c0611", 950: "#1a030a",
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
  "royal-blue-oxblood": {
    key: "royal-blue-oxblood",
    label: "Royal Blue & Oxblood",
    primary: {
      50: "#eef1fa", 100: "#d5ddf2", 200: "#aabae5", 300: "#7e96d8", 400: "#5272cb",
      500: "#264fbe", 600: "#1c41a8", 700: "#0d2054", 800: "#0a1840", 900: "#06102c", 950: "#03091a",
    },
    accent: {
      50: "#fdf3f2", 100: "#f8dfda", 200: "#f0bcb2", 300: "#e39184", 400: "#d06a5c",
      500: "#b8402f", 600: "#973122", 700: "#7b241a", 800: "#5e1a14", 900: "#45130f",
    },
  },
  "plum-terracotta": {
    key: "plum-terracotta",
    label: "Plum & Terracotta",
    primary: {
      50: "#f4eefa", 100: "#e2d5f2", 200: "#c5aae5", 300: "#a87ed8", 400: "#8b52cb",
      500: "#6d26be", 600: "#5d1ca8", 700: "#2e0d54", 800: "#230a40", 900: "#18062c", 950: "#0e031a",
    },
    accent: {
      50: "#fdf4f2", 100: "#fbe7e2", 200: "#f5c9bd", 300: "#eda690", 400: "#d8836a",
      500: "#c2685a", 600: "#a8503f", 700: "#8a3d2f", 800: "#6b2e24", 900: "#4f221a",
    },
  },
  "saffron-forest": {
    key: "saffron-forest",
    label: "Saffron & Forest",
    primary: {
      50: "#eefaf3", 100: "#d5f2e1", 200: "#aae5c2", 300: "#7ed8a4", 400: "#52cb84",
      500: "#26be65", 600: "#1ca856", 700: "#0d542b", 800: "#0a4020", 900: "#062c16", 950: "#031a0d",
    },
    accent: {
      50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c",
      500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12",
    },
  },
  "onyx-platinum": {
    key: "onyx-platinum",
    label: "Onyx & Platinum",
    primary: {
      50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8",
      500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617",
    },
    accent: {
      50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa",
      500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b",
    },
  },
  "teal-rosegold": {
    key: "teal-rosegold",
    label: "Deep Teal & Rose Gold",
    primary: {
      50: "#eefaf9", 100: "#d5f2ef", 200: "#aae5df", 300: "#7ed8cf", 400: "#52cbbf",
      500: "#26beaf", 600: "#1ca89a", 700: "#0d544d", 800: "#0a403b", 900: "#062c28", 950: "#031a18",
    },
    accent: {
      50: "#fdf3f2", 100: "#fbe4e1", 200: "#f5c8c2", 300: "#eda89f", 400: "#c98a82",
      500: "#b76e79", 600: "#9c5560", 700: "#7d434c", 800: "#5f333a", 900: "#46262b",
    },
  },
  "espresso-gold": {
    key: "espresso-gold",
    label: "Espresso & Gold",
    primary: {
      50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e",
      500: "#78716c", 600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1c1917", 950: "#0c0a09",
    },
    accent: {
      50: "#fdf8ec", 100: "#faf0d4", 200: "#f3dfa3", 300: "#eac96c", 400: "#d9ac3f",
      500: "#b8860b", 600: "#966b09", 700: "#78530a", 800: "#5c400c", 900: "#46320c",
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
