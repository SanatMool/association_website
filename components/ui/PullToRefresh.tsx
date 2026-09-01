"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const PULL_THRESHOLD = 70;
const MAX_PULL = 90;
const RESISTANCE = 0.5;

/**
 * Installed PWAs have no browser chrome — no pull-to-refresh (that's a Safari/Chrome-tab-only
 * feature), no reload button. iOS also resumes a backgrounded PWA from memory instead of
 * performing a real navigation, so reopening it can show stale content with no obvious way to
 * force a refresh. This adds the gesture back, but only inside an installed PWA
 * (`display-mode: standalone`) — a normal browser tab already has its own native pull-to-refresh,
 * and running both at once would just be a confusing double gesture.
 */
export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    setEnabled(window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    function onTouchStart(e: TouchEvent) {
      startY.current = window.scrollY === 0 ? e.touches[0].clientY : null;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      setPull(delta > 0 ? Math.min(delta * RESISTANCE, MAX_PULL) : 0);
    }

    function onTouchEnd() {
      if (startY.current === null) return;
      startY.current = null;
      setPull((p) => {
        if (p >= PULL_THRESHOLD) {
          setRefreshing(true);
          window.location.reload();
          return PULL_THRESHOLD;
        }
        return 0;
      });
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled]);

  if (!enabled) return <>{children}</>;

  return (
    <>
      <div
        aria-hidden
        className="fixed left-0 right-0 top-3 z-[200] flex justify-center pointer-events-none"
        style={{ opacity: pull / PULL_THRESHOLD, transform: `translateY(${pull - 40}px)` }}
      >
        <div className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center border border-slate-100">
          <RefreshCw
            size={16}
            className={`text-navy-700${refreshing ? " animate-spin" : ""}`}
            style={refreshing ? undefined : { transform: `rotate(${(pull / MAX_PULL) * 360}deg)` }}
          />
        </div>
      </div>
      <div
        style={{
          transform: pull ? `translateY(${pull}px)` : undefined,
          transition: pull === 0 ? "transform 0.25s ease" : undefined,
        }}
      >
        {children}
      </div>
    </>
  );
}
