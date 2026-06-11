import NewsForm from "@/components/admin/NewsForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewArticlePage() {
  return (
    <div>
      <Link href="/admin/news" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={14} />
        Back to news
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Article</h1>
        <p className="text-sm text-gray-500 mt-0.5">Follow the steps to publish a new news article.</p>
      </div>
      <NewsForm />
    </div>
  );
}
