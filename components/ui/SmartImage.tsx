"use client";

import { useState, useEffect, useRef } from "react";
import { ImageOff, RotateCw } from "lucide-react";

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string; // positioning classes applied to the wrapper (e.g. "absolute inset-0 w-full h-full")
  imgClassName?: string; // extra classes applied to the <img> itself (e.g. hover scale/transform effects)
  fit?: "cover" | "contain";
  loading?: "lazy" | "eager";
}

const MAX_AUTO_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

/**
 * Drop-in replacement for a plain <img> rendering a user-uploaded or dynamic image: shows a
 * shimmer skeleton while loading, automatically retries a couple of times on failure (a network
 * blip on mobile shouldn't leave a permanently broken icon — especially inside an installed PWA,
 * which has no pull-to-refresh gesture to fall back on), and falls back to a clean "tap to
 * retry" state instead of the browser's native broken-image icon if it still fails.
 */
export default function SmartImage({ src, alt, className = "", imgClassName = "", fit = "cover", loading = "lazy" }: SmartImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset when the image URL itself changes (e.g. list re-renders with different data).
  useEffect(() => {
    setStatus("loading");
    setAttempt(0);
  }, [src]);

  // A browser-cached (or service-worker-cached) image can finish loading — and fire its
  // native `load` event — before React attaches the onLoad listener below, especially on a
  // PWA where the SW serves static images cache-first (near-instant, every repeat visit).
  // When that happens `img.complete` is already true and onLoad never (re)fires, so the
  // shimmer stays up forever over an image that actually loaded fine. Catch that case
  // explicitly right after mount/update instead of relying solely on the onLoad event.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setStatus("loaded");
    }
  });

  useEffect(() => {
    return () => { if (retryTimer.current) clearTimeout(retryTimer.current); };
  }, []);

  function handleError() {
    if (attempt < MAX_AUTO_RETRIES) {
      retryTimer.current = setTimeout(() => {
        setAttempt((a) => a + 1);
        setStatus("loading");
      }, RETRY_DELAY_MS);
    } else {
      setStatus("error");
    }
  }

  function manualRetry() {
    setAttempt(0);
    setStatus("loading");
  }

  // Cache-bust each retry so a flaky CDN/proxy response isn't served from a broken cache entry.
  const effectiveSrc = attempt > 0 ? `${src}${src.includes("?") ? "&" : "?"}_retry=${attempt}` : src;

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {status !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={attempt}
          ref={imgRef}
          src={effectiveSrc}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => setStatus("loaded")}
          onError={handleError}
          className={`absolute inset-0 w-full h-full ${fit === "cover" ? "object-cover" : "object-contain"} transition-opacity duration-300 ${status === "loaded" ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        />
      )}

      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]" style={{ animation: "smart-image-shimmer 1.6s ease-in-out infinite" }} />
      )}

      {status === "error" && (
        <button
          type="button"
          onClick={manualRetry}
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-1.5 bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          title="Tap to retry loading this image"
        >
          <ImageOff size={20} />
          <span className="flex items-center gap-1 text-[11px] font-medium">
            <RotateCw size={10} /> Retry
          </span>
        </button>
      )}

      <style jsx>{`
        @keyframes smart-image-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
