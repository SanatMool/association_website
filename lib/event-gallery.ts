const MAX_PROMO_IMAGES = 4;
const MAX_RECAP_IMAGES = 6;

function sanitizeImageArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .slice(0, max);
}

/** Caps promoImages/recapImages length and validates recapVideoUrl on an incoming event API body. */
export function sanitizeEventGalleryFields(body: Record<string, unknown>): {
  promoImages?: string[];
  recapImages?: string[];
  recapVideoUrl?: string | null;
} {
  const result: { promoImages?: string[]; recapImages?: string[]; recapVideoUrl?: string | null } = {};

  if ("promoImages" in body) result.promoImages = sanitizeImageArray(body.promoImages, MAX_PROMO_IMAGES);
  if ("recapImages" in body) result.recapImages = sanitizeImageArray(body.recapImages, MAX_RECAP_IMAGES);
  if ("recapVideoUrl" in body) {
    const v = body.recapVideoUrl;
    result.recapVideoUrl = typeof v === "string" && v.trim() ? v.trim().slice(0, 500) : null;
  }

  return result;
}
