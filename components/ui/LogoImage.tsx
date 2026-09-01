"use client";

import { useState, useEffect, type CSSProperties } from "react";

interface LogoImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
  fallbackSrc?: string;
}

const MAX_AUTO_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

/**
 * Drop-in replacement for a plain logo <img> (navbar, footer, admin/portal sidebars, login
 * pages): auto-retries a couple of times on failure — a network blip reopening an installed
 * PWA shouldn't leave the logo broken with nothing to recover it — and falls back to the
 * generic placeholder logo instead of the browser's native broken-image icon if it still
 * fails. Unlike SmartImage, this renders a plain unwrapped <img> (no sized/positioned wrapper
 * div), so it preserves a logo's natural "fixed height, auto width" sizing exactly as before.
 */
export default function LogoImage({ src, alt, className = "", width, height, style, fallbackSrc = "/default-logo.png" }: LogoImageProps) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
  }, [src]);

  function handleError() {
    if (attempt < MAX_AUTO_RETRIES) {
      setTimeout(() => setAttempt((a) => a + 1), RETRY_DELAY_MS);
    } else {
      setFailed(true);
    }
  }

  const effectiveSrc = failed
    ? fallbackSrc
    : attempt > 0
    ? `${src}${src.includes("?") ? "&" : "?"}_retry=${attempt}`
    : src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={attempt}
      src={effectiveSrc}
      alt={alt}
      width={width}
      height={height}
      style={style}
      decoding="async"
      onError={failed ? undefined : handleError}
      className={className}
    />
  );
}
