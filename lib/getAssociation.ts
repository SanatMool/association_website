import { cache } from "react";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Association } from "@prisma/client";

// Default slug used in local development when no domain match is found
const DEV_FALLBACK_SLUG = process.env.DEV_ASSOCIATION_SLUG ?? "eva-nepal";

/**
 * getAssociation()
 *
 * Resolves the current Association based on the incoming hostname.
 * - Reads x-hostname header injected by middleware.ts
 * - Queries the Association table for a matching domain.
 * - Falls back to DEV_FALLBACK_SLUG on localhost / unknown domains in dev.
 * - Returns null (and caller should 404) if no match in production.
 *
 * Uses React.cache() — one DB query per request, no matter how many
 * server components call this function in a single page render.
 */
export const getAssociation = cache(async (): Promise<Association | null> => {
  const headersList = await headers();
  const hostname = headersList.get("x-hostname") ?? "";

  // Localhost / dev environment — use fallback association
  const isLocalDev =
    !hostname ||
    hostname.startsWith("localhost") ||
    hostname.startsWith("127.0.0.1") ||
    hostname.startsWith("::1");

  if (isLocalDev) {
    return prisma.association.findFirst({
      where: { slug: DEV_FALLBACK_SLUG, active: true },
    });
  }

  // Production — strict domain match
  const association = await prisma.association.findUnique({
    where: { domain: hostname },
  });

  // If domain exists but association is inactive, treat as not found
  if (association && !association.active) return null;

  return association;
});

/**
 * getAssociationOrThrow()
 *
 * Same as getAssociation() but throws a notFound() error if no association
 * is resolved. Use this in public page layouts where a missing association
 * should render a 404.
 */
export async function getAssociationOrThrow(): Promise<Association> {
  const { notFound } = await import("next/navigation");
  const association = await getAssociation();
  if (!association) notFound(); // notFound() throws — never returns
  return association as Association;
}
