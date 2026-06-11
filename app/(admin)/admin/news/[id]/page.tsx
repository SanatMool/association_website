import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import NewsForm from "@/components/admin/NewsForm";
import Link from "next/link";
import { ChevronLeft, FileEdit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  const article = await prisma.news.findUnique({ where: { id: params.id } });
  if (!article) notFound();

  return (
    <div>
      <Link href="/admin/news" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={14} />
        Back to news
      </Link>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <FileEdit size={22} className="text-indigo-500" /> Edit Article
        </h1>
        <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xl">{article.title}</p>
      </div>
      <NewsForm article={article} />
    </div>
  );
}
