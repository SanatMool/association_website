"use client";

import { useState } from "react";

interface Props {
  description: string;
  descriptionNe: string | null;
}

export default function DescriptionSection({ description, descriptionNe }: Props) {
  const [lang, setLang] = useState<"en" | "ne">("en");
  const showToggle = !!descriptionNe;

  const text = lang === "ne" && descriptionNe ? descriptionNe : description;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-navy-900">About this event</h2>
        {showToggle && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1 rounded-md transition-all ${
                lang === "en"
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang("ne")}
              className={`px-3 py-1 rounded-md transition-all ${
                lang === "ne"
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              नेपाली
            </button>
          </div>
        )}
      </div>

      <div className="prose prose-slate max-w-none">
        {text.split("\n").filter(Boolean).map((para, i) => (
          <p key={i} className={`text-slate-600 leading-relaxed mb-4 ${lang === "ne" ? "font-normal" : ""}`}>
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}
