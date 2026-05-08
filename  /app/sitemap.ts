import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://evanepal.org";

  const [members, news] = await Promise.all([
    prisma.member.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.news.findMany({ select: { slug: true, publishedAt: true } }),
  ]);

  const memberUrls = members.map((m) => ({
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
