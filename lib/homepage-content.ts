import {
  Shield, Star, TrendingUp, Network, BookOpen, Users, Award, Megaphone,
  ListChecks, HeartHandshake, Building2, Calendar, MapPin, Globe, Handshake,
  Briefcase, GraduationCap, Target, Trophy, CheckCircle, MessageSquare,
  Lightbulb, Rocket, Scale, type LucideIcon,
} from "lucide-react";

export interface HeroSlide {
  image: string;
  label: string;
}

export interface ContentItem {
  icon: string;
  title: string;
  desc: string;
}

export interface HomepageContent {
  heroSlides?: HeroSlide[];      // 0-4 items; empty/absent -> fall back to Hero.tsx's stock slides
  aboutImage?: string;
  aboutHeadline?: string;
  aboutBadge?: string;
  missionItems?: ContentItem[];  // 1-6 items; empty/absent -> fall back to t.mission.items
  whyjoinItems?: ContentItem[];  // 1-6 items; empty/absent -> fall back to t.whyjoin.benefits
  eventsHeadline?: string;       // /events page header; falls back to t.events.title
  eventsSubtitle?: string;       // /events page header; falls back to t.events.subtitle
  coverageArea?: string;         // region text — About's "Coverage" tile, Stats' valley-coverage card, /members subtitle; falls back to "Kathmandu Valley"
  aboutGrowingLabel?: string;    // About section's floating "Growing" badge label; falls back to "Growing"
  statsHeadlinePrefix?: string;  // Stats section big headline, first line; falls back to "A Decade of Impact,"
  statsHeadlineAccent?: string;  // Stats section big headline, second (gold) line; falls back to "By the Numbers"
  statsTagline?: string;         // Stats section bottom line (before " · Est. {year}"); falls back to mode-based default
}

/**
 * Curated icon set for Mission/WhyJoin cards — a fixed picker, not a free-text field or a full
 * icon-library browser, so every admin-authored card still looks intentional (same principle as
 * the color-preset registry: bounded choices instead of unrestricted freedom).
 */
export const SECTION_ICONS: Record<string, LucideIcon> = {
  Shield, Star, TrendingUp, Network, BookOpen, Users, Award, Megaphone,
  ListChecks, HeartHandshake, Building2, Calendar, MapPin, Globe, Handshake,
  Briefcase, GraduationCap, Target, Trophy, CheckCircle, MessageSquare,
  Lightbulb, Rocket, Scale,
};

export const DEFAULT_SECTION_ICON = "Star";

export function getSectionIcon(name: string | null | undefined): LucideIcon {
  if (name && name in SECTION_ICONS) return SECTION_ICONS[name];
  return SECTION_ICONS[DEFAULT_SECTION_ICON];
}

const MAX_HERO_SLIDES = 4;
const MIN_CONTENT_ITEMS = 1;
const MAX_CONTENT_ITEMS = 6;

function sanitizeContentItems(items: unknown): ContentItem[] | undefined {
  if (!Array.isArray(items)) return undefined;
  const cleaned = items
    .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
    .map((i) => ({
      icon: typeof i.icon === "string" && i.icon in SECTION_ICONS ? i.icon : DEFAULT_SECTION_ICON,
      title: typeof i.title === "string" ? i.title.slice(0, 100) : "",
      desc: typeof i.desc === "string" ? i.desc.slice(0, 300) : "",
    }))
    .filter((i) => i.title.trim().length > 0)
    .slice(0, MAX_CONTENT_ITEMS);
  return cleaned.length >= MIN_CONTENT_ITEMS ? cleaned : undefined;
}

function sanitizeHeroSlides(slides: unknown): HeroSlide[] | undefined {
  if (!Array.isArray(slides)) return undefined;
  const cleaned = slides
    .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
    .map((s) => ({
      image: typeof s.image === "string" ? s.image.slice(0, 500) : "",
      label: typeof s.label === "string" ? s.label.slice(0, 100) : "",
    }))
    .filter((s) => s.image.trim().length > 0)
    .slice(0, MAX_HERO_SLIDES);
  return cleaned.length > 0 ? cleaned : undefined;
}

/** Validates + sanitizes an untrusted API request body into a safe HomepageContent object. */
export function sanitizeHomepageContent(input: unknown): HomepageContent {
  if (typeof input !== "object" || input === null) return {};
  const body = input as Record<string, unknown>;
  const result: HomepageContent = {};

  const heroSlides = sanitizeHeroSlides(body.heroSlides);
  if (heroSlides) result.heroSlides = heroSlides;

  if (typeof body.aboutImage === "string") result.aboutImage = body.aboutImage.slice(0, 500);
  if (typeof body.aboutHeadline === "string") result.aboutHeadline = body.aboutHeadline.slice(0, 150);
  if (typeof body.aboutBadge === "string") result.aboutBadge = body.aboutBadge.slice(0, 80);

  const missionItems = sanitizeContentItems(body.missionItems);
  if (missionItems) result.missionItems = missionItems;

  const whyjoinItems = sanitizeContentItems(body.whyjoinItems);
  if (whyjoinItems) result.whyjoinItems = whyjoinItems;

  if (typeof body.eventsHeadline === "string") result.eventsHeadline = body.eventsHeadline.slice(0, 150);
  if (typeof body.eventsSubtitle === "string") result.eventsSubtitle = body.eventsSubtitle.slice(0, 200);

  if (typeof body.coverageArea === "string") result.coverageArea = body.coverageArea.slice(0, 80);
  if (typeof body.aboutGrowingLabel === "string") result.aboutGrowingLabel = body.aboutGrowingLabel.slice(0, 30);
  if (typeof body.statsHeadlinePrefix === "string") result.statsHeadlinePrefix = body.statsHeadlinePrefix.slice(0, 80);
  if (typeof body.statsHeadlineAccent === "string") result.statsHeadlineAccent = body.statsHeadlineAccent.slice(0, 80);
  if (typeof body.statsTagline === "string") result.statsTagline = body.statsTagline.slice(0, 120);

  return result;
}
