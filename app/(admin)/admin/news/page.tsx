import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/adminAuth";
import NewsClient from "./NewsClient";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const ctx = await getAdminContext();
  const associationId = ctx?.associationId ?? null;

  const articles = await prisma.news.findMany({
    where: { associationId },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true, title: true, category: true, author: true,
      publishedAt: true, featured: true, image: true, slug: true, status: true,
    },
  });

  const rows = articles.map((a) => ({
    id:          a.id,
    title:       a.title,
    category:    a.category,
    author:      a.author,
    publishedAt: a.publishedAt.toISOString(),
    featured:    a.featured,
    image:       a.image,
    slug:        a.slug,
    status:      a.status,
  }));

  return <NewsClient articles={rows} />;
}
