import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const articles = await prisma.news.findMany({ orderBy: { publishedAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News</h1>
          <p className="text-sm text-gray-500 mt-0.5">{articles.length} articles</p>
        </div>
        <Link
          href="/admin/news/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0a1040] text-white text-sm rounded-lg hover:bg-[#0d1550] transition-colors"
        >
          <Plus size={14} />
          Add article
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Title</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Category</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Author</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Published</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{a.title}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full capitalize">
                    {a.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{a.author}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(a.publishedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      href={`/admin/news/${a.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <Pencil size={11} />
                      Edit
                    </Link>
                    <DeleteButton id={a.id} entity="news" redirectTo="/admin/news" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
