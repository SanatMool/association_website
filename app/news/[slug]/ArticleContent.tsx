"use client";

import { useState } from "react";

interface Props {
  excerpt: string;
  excerptNe: string | null;
  content: string;
  contentNe: string | null;
}

export default function ArticleContent({ excerpt, excerptNe, content, contentNe }: Props) {
  const [lang, setLang] = useState<"en" | "ne">("en");
  const showToggle = !!(excerptNe || contentNe);

  const displayExcerpt = lang === "ne" && excerptNe ? excerptNe : excerpt;
  const displayContent = lang === "ne" && contentNe ? contentNe : content;

  return (
    <>
      {showToggle && (
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1 rounded-md transition-all ${
                lang === "en" ? "bg-white text-navy-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang("ne")}
              className={`px-3 py-1 rounded-md transition-all ${
                lang === "ne" ? "bg-white text-navy-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              नेपाली
            </button>
          </div>
        </div>
      )}

      <p className="text-lg text-slate-600 leading-relaxed font-medium mb-8 border-l-4 border-gold-400 pl-5">
        {displayExcerpt}
      </p>

      <div className="prose prose-slate max-w-none">
        {displayContent.split("\n").filter(Boolean).map((para, i) => (
          <p key={i} className="text-slate-600 leading-relaxed mb-4">
            {para}
          </p>
        ))}
      </div>
    </>
  );
}
