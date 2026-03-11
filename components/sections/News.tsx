"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Tag, User, ChevronRight } from "lucide-react";
import { news, NewsItem } from "@/data/news";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLocale } from "@/context/LocaleContext";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const categoryStyles: Record<NewsItem["category"], { color: string; bg: string; dot: string }> = {
  announcement: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", dot: "bg-blue-500" },
  training: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  event: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  industry: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", dot: "bg-purple-500" },
  member: { color: "text-rose-700", bg: "bg-rose-50 border-rose-200", dot: "bg-rose-500" },
};

function FeaturedNewsCard({ item }: { item: NewsItem }) {
  const style = categoryStyles[item.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="group relative bg-navy-900 rounded-2xl overflow-hidden col-span-2"
      style={{ minHeight: 320 }}
    >
      {/* Background image */}
      {item.image && (
        <>
          <div
            className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage: `url("${item.image}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-900/60 to-navy-900/20" />
        </>
      )}

      {/* Gold line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500" />

      <div className="relative p-8 h-full flex flex-col justify-end" style={{ minHeight: 320 }}>
        <div className="mb-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full mb-3 capitalize">
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {item.category}
          </span>
        </div>

        <div className="mt-32">
          <h3 className="font-serif font-bold text-white text-xl sm:text-2xl leading-snug mb-3 group-hover:text-gold-100 transition-colors">
            {item.title}
          </h3>
          <p className="text-white/65 text-sm leading-relaxed mb-5 line-clamp-2">
            {item.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-white/50 text-xs">
              <span className="flex items-center gap-1.5">
                <Calendar size={11} />
                {formatDate(item.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <User size={11} />
                {item.author}
              </span>
            </div>
            <Link
              href={`/news/${item.slug}`}
              className="inline-flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold text-sm px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5"
            >
              Read More
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SmallNewsCard({ item, index }: { item: NewsItem; index: number }) {
  const style = categoryStyles[item.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
    >
      {/* Image */}
      {item.image && (
        <div className="h-40 overflow-hidden relative">
          <div
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
            style={{
              backgroundImage: `url("${item.image}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-navy-900/20 group-hover:bg-navy-900/10 transition-colors" />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border capitalize",
            style.bg, style.color
          )}>
            <Tag size={9} />
            {item.category}
          </span>
          <span className="text-slate-400 text-xs">{formatDate(item.date)}</span>
        </div>

        <h3 className="font-serif font-bold text-navy-900 text-sm leading-snug mb-2 group-hover:text-navy-700 transition-colors flex-1 line-clamp-3">
          {item.title}
        </h3>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
          <span className="text-xs text-slate-400 truncate">{item.author}</span>
          <Link
            href={`/news/${item.slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gold-600 hover:text-gold-700 transition-colors flex-shrink-0"
          >
            Read more
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function NewsListRow({ item, index }: { item: NewsItem; index: number }) {
  const style = categoryStyles[item.category];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="group flex items-start gap-4 py-4 border-b border-slate-100 last:border-b-0"
    >
      <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${style.dot}`} />
      <div className="flex-1">
        <Link
          href={`/news/${item.slug}`}
          className="font-semibold text-navy-900 text-sm hover:text-gold-600 transition-colors line-clamp-2 group-hover:text-gold-600"
        >
          {item.title}
        </Link>
        <div className="flex items-center gap-3 mt-1">
          <span className={cn("text-xs capitalize font-medium", style.color)}>
            {item.category}
          </span>
          <span className="text-slate-400 text-xs">{formatDate(item.date)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function News() {
  const { t } = useLocale();

  const featured = news[0];
  const cards = news.slice(1, 4);

  return (
    <section id="news" className="section-padding bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh-light opacity-60 pointer-events-none" />
      <div className="container-max">
        {/* Header */}
        <div className="text-center mb-16">
          <AnimatedSection>
            <span className="section-label justify-center">
              <span className="w-8 h-px bg-gold-500" />
              {t.news.label}
              <span className="w-8 h-px bg-gold-500" />
            </span>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="heading-lg text-navy-900 mt-4">{t.news.title}</h2>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <p className="text-body mt-3 max-w-xl mx-auto">{t.news.subtitle}</p>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="gold-divider mx-auto mt-5" />
          </AnimatedSection>
        </div>

        {/* Editorial grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Featured (large) + cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Featured article */}
            <div className="grid sm:grid-cols-2 gap-6">
              <FeaturedNewsCard item={featured} />
            </div>

            {/* 3 cards below */}
            <div className="grid sm:grid-cols-3 gap-5">
              {cards.map((item, i) => (
                <SmallNewsCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </div>

          {/* Sidebar: list of recent news */}
          <div>
            <AnimatedSection delay={0.2}>
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sticky top-28">
                <h3 className="font-serif font-bold text-navy-900 text-base mb-1">
                  More from EVA Nepal
                </h3>
                <p className="text-slate-500 text-xs mb-5">Industry news and updates</p>

                <div>
                  {/* Show all news in sidebar list */}
                  {news.slice(0, 6).map((item, i) => (
                    <NewsListRow key={item.id} item={item} index={i} />
                  ))}
                </div>

                <Link
                  href="/news"
                  className="mt-5 flex items-center justify-center gap-2 w-full bg-navy-900 hover:bg-navy-800 text-gold-400 font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  View All News
                  <ArrowRight size={13} />
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
}
