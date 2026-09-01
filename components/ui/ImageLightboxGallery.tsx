"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";

interface Props {
  images: string[];
  title: string;
}

export default function ImageLightboxGallery({ images, title }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(() => setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)), [images.length]);
  const next = useCallback(() => setOpenIndex((i) => (i === null ? null : (i + 1) % images.length)), [images.length]);

  // Keyboard navigation + close
  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close, prev, next]);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = openIndex !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [openIndex]);

  if (images.length === 0) return null;

  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
        <ImageIcon size={14} className="text-gold-500" /> {title}
      </h3>

      {/* Horizontally-scrollable thumbnail strip */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide" style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}>
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="flex-shrink-0 w-32 h-32 sm:w-36 sm:h-36 rounded-xl overflow-hidden bg-slate-100 border border-gray-100 hover:opacity-90 hover:border-gold-300 transition-all snap-start"
          >
            <SmartImage src={img} alt={`${title} ${i + 1}`} className="w-full h-full" fit="cover" />
          </button>
        ))}
      </div>

      {/* Lightbox modal */}
      <AnimatePresence>
        {openIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            onClick={close}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            >
              <X size={20} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  aria-label="Previous image"
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  aria-label="Next image"
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            <motion.div
              key={openIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl max-h-[85vh] w-full flex flex-col items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[openIndex]}
                alt={`${title} ${openIndex + 1}`}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
              {images.length > 1 && (
                <span className="text-white/50 text-xs font-mono">{openIndex + 1} / {images.length}</span>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
