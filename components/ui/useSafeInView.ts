"use client";

import { useRef, useState, useEffect } from "react";
import { useInView } from "framer-motion";

const FORCE_VISIBLE_AFTER_MS = 1500;

/**
 * Same safety net as AnimatedSection.tsx, extracted for the handful of sections that animate
 * their own motion.div directly (via `whileInView`+`viewport`) instead of going through that
 * shared wrapper — News/Events/Stats/Timeline card lists. If the IntersectionObserver behind
 * `useInView` never fires (the failure mode behind Hero.tsx's still-unsolved stuck-opacity bug,
 * and the one actually reproduced in the Events section — see PROGRESS.md 2026-09-01), force
 * the content visible after a grace period instead of leaving it invisible indefinitely.
 *
 * Use with `ref`/`animate` instead of `whileInView`, e.g.:
 *   const { ref, isInView } = useSafeInView();
 *   <motion.div ref={ref} initial={hidden} animate={isInView ? shown : hidden} .../>
 */
export function useSafeInView(viewportMargin = "-40px") {
  const ref = useRef(null);
  const observedInView = useInView(ref, { once: true, margin: viewportMargin as `${number}px` });
  const [forcedVisible, setForcedVisible] = useState(false);

  useEffect(() => {
    if (observedInView) return;
    const timer = setTimeout(() => setForcedVisible(true), FORCE_VISIBLE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [observedInView]);

  return { ref, isInView: observedInView || forcedVisible };
}

/** Bounds a per-item stagger delay so a long list can't push the last item's animation start
 * past a visible amount of time (see AnimatedSection.tsx for the full "why"). */
export function clampStagger(delay: number, max = 0.4) {
  return Math.min(delay, max);
}
