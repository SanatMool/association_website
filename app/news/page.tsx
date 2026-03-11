"use client";

import { useState } from "react";
import { news } from "@/data/news";
import NewsCard from "@/components/ui/NewsCard";
import { useLocale } from "@/context/LocaleContext";
import { motion } from "framer-motion";

export default function NewsPage() {
  const { t } = useLocale();
  const [filter, setFilter] = useState("all");

  const categories = ["all", "announcement", "training", "event", "industry", "member"];

  const filtered = news.filter(
    (n) => filter === "all" || n.category === filter
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      <div className="bg-navy-900 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 text-gold-400 text-sm font-medium mb-4">
              <span className="w-6 h-px bg-gold-500" />
              {t.news.label}
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-3">
              {t.news.title}
            </h1>
            <p className="text-white/60 text-lg">{t.news.subtitle}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-sm font-medium px-4 py-2 rounded-full capitalize transition-all ${
                filter === cat
                  ? "bg-navy-900 text-gold-400"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {cat === "all" ? "All News" : cat}
            </button>
          ))}
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <NewsCard item={item} />
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">No news in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
