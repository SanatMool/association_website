"use client";

import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";

// Extracted from components/sections/StatsSection.tsx's Counter — same ease-out
// count-up, reused here so panel StatCards animate consistently with the public site.
export function useCountUp(value: number, duration = 1.4) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(value);
    };

    requestAnimationFrame(tick);
  }, [inView, value, duration]);

  return { count, ref };
}
