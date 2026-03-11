import { prisma } from "@/lib/prisma";
import { NewsType } from "@/lib/types";
import NewsClient from "./NewsClient";

export const revalidate = 3600;

export default async function NewsPage() {
  const dbNews = await prisma.news.findMany({ orderBy: { publishedAt: "desc" } });

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
