import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getAssociation } from "@/lib/getAssociation";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const association = await getAssociation();

  // Fallback base URL if no association resolved
  const baseUrl = association?.domain
    ? `https://${association.domain}`
    : "https://evanepal.org";

  const associationId = association?.id;

  const [memberLinks, news] = await Promise.all([
    prisma.memberAssociation.findMany({
      where: associationId ? { associationId, visible: true } : { visible: true },
      select: { member: { select: { slug: true, updatedAt: true } } },
    }),
    prisma.news.findMany({
      where: associationId ? { associationId } : {},
      select: { slug: true, publishedAt: true },
    }),
  ]);

  const memberUrls = memberLinks.map(({ member: m }) => ({
    url: `${baseUrl}/members/${m.slug}`,
    lastModified: m.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const newsUrls = news.map((n) => ({
    url: `${baseUrl}/news/${n.slug}`,
    lastModified: n.publishedAt,
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/members`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/events`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    ...memberUrls,
    ...newsUrls,
  ];
}
