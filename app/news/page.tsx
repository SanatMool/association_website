import { prisma } from "@/lib/prisma";
import { NewsType } from "@/lib/types";
import { getAssociationOrThrow } from "@/lib/getAssociation";
import NewsClient from "./NewsClient";

export const revalidate = 3600;

export default async function NewsPage() {
  const association = await getAssociationOrThrow();

  const dbNews = await prisma.news.findMany({
    where: { associationId: association.id },
    orderBy: { publishedAt: "desc" },
  });

  const news: NewsType[] = dbNews.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    titleNe: n.titleNe,
    excerpt: n.excerpt,
    content: n.content,
    date: n.publishedAt.toISOString(),
    category: n.category,
    author: n.author,
    image: n.image,
    featured: n.featured,
  }));

  return <NewsClient news={news} />;
}
