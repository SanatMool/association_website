import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

interface Props {
  params: { slug: string };
}

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await prisma.news.findUnique({ where: { slug: params.slug } });
  if (!item) return { title: "Article Not Found" };

  return {
    title: item.title,
    description: item.excerpt,
    openGraph: {
      title: item.title,
      description: item.excerpt,
      type: "article",
      publishedTime: item.publishedAt.toISOString(),
      authors: [item.author],
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const item = await prisma.news.findUnique({ where: { slug: params.slug } });
  if (!item) notFound();

  const related = await prisma.news.findMany({
    where: { category: item.category, NOT: { id: item.id } },
    take: 3,
    orderBy: { publishedAt: "desc" },
  });

  const dateStr = item.publishedAt.toISOString();

  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-navy-700">Home</Link>
            <span>/</span>
            <Link href="/news" className="hover:text-navy-700">News</Link>
            <span>/</span>
            <span className="text-navy-900 font-medium truncate">{item.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/news" className="inline-flex items-center gap-2 text-slate-500 hover:text-navy-700 text-sm font-medium mb-8 transition-colors">
          <ArrowLeft size={15} />
          Back to News
        </Link>

        <article className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-gold-500 to-navy-700" />
          <div className="p-8 sm:p-12">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                <Tag size={10} />
                {item.category}
              </span>
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                <Calendar size={13} />
                {formatDate(dateStr)}
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                <User size={13} />
                {item.author}
              </div>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy-900 leading-tight mb-6">
              {item.title}
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed font-medium mb-8 border-l-4 border-gold-400 pl-5">
              {item.excerpt}
            </p>

            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed mb-4">{item.content}</p>
              <p className="text-slate-600 leading-relaxed mb-4">
                EVA Nepal continues to work diligently to represent the interests of event venues across Kathmandu Valley. The association invites all venue owners and event industry professionals to join and be part of this growing community.
              </p>
              <p className="text-slate-600 leading-relaxed">
                For more information, please contact EVA Nepal at{" "}
                <a href="mailto:info@evanepal.org" className="text-gold-600 hover:text-gold-700 font-medium">
                  info@evanepal.org
                </a>{" "}
                or visit the association office at Maitidevi, Kathmandu.
              </p>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="font-serif font-bold text-navy-900 text-xl mb-6">Related News</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {related.map((n) => (
                <Link key={n.id} href={`/news/${n.slug}`} className="bg-white rounded-xl border border-slate-100 p-5 hover:border-gold-200 hover:shadow-card transition-all group">
                  <span className="text-xs text-gold-600 font-medium capitalize">{n.category}</span>
                  <h3 className="font-serif font-bold text-navy-900 text-sm mt-2 mb-2 leading-snug group-hover:text-navy-700 line-clamp-3">{n.title}</h3>
                  <span className="text-xs text-slate-400">{formatDate(n.publishedAt.toISOString())}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
