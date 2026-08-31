"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface PublicChromeProps {
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
}

// Clears the fixed navbar so the target section's heading isn't tucked underneath it.
const HASH_SCROLL_OFFSET = 90;
const HASH_SCROLL_TIMEOUT_MS = 10000;

export default function PublicChrome({ children, navbar, footer }: PublicChromeProps) {
  const pathname = usePathname();
  const isAdmin    = pathname?.startsWith("/admin");
  const isPlatform = pathname?.startsWith("/platform");
  const isPortal   = pathname?.startsWith("/portal");
  const isChrome   = !(isAdmin || isPlatform || isPortal);

  // Both Next.js's own scroll-restoration and the browser's native anchor-scroll fail to land on
  // sections far down this heavily client-rendered homepage — the target section can still be
  // hydrating/mounting well after this effect first runs, so a fixed-count retry loop gives up
  // too early. Watch the DOM with a MutationObserver instead, which reacts the moment the target
  // actually appears no matter how long that takes (bounded by a generous overall timeout).
  //
  // Uses an instant (non-animated) scroll rather than `behavior: "smooth"` — the homepage's Hero
  // carousel re-renders continuously while auto-playing (a progress-bar timer firing every 50ms),
  // and each of those repaints was silently cancelling the smooth-scroll animation before it ever
  // completed, leaving the page stuck at the top no matter how many times it was reasserted.
  useEffect(() => {
    if (!isChrome) return;

    let observer: MutationObserver | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function scrollToHash() {
      const hash = window.location.hash.slice(1);
      observer?.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
      if (!hash) return;

      const scrollToEl = (el: HTMLElement) => {
        const top = el.getBoundingClientRect().top + window.scrollY - HASH_SCROLL_OFFSET;
        window.scrollTo({ top, behavior: "instant" });
      };

      const existing = document.getElementById(hash);
      if (existing) {
        scrollToEl(existing);
        // The browser's own delayed native hash-scroll (or Next's router) sometimes resets the
        // position back to 0 shortly after — reassert a few times so ours actually wins.
        [150, 400, 800].forEach((delay) => setTimeout(() => scrollToEl(existing), delay));
        return;
      }

      observer = new MutationObserver(() => {
        const el = document.getElementById(hash);
        if (el) {
          observer?.disconnect();
          if (timeoutId) clearTimeout(timeoutId);
          scrollToEl(el);
          [150, 400, 800].forEach((delay) => setTimeout(() => scrollToEl(el), delay));
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      timeoutId = setTimeout(() => observer?.disconnect(), HASH_SCROLL_TIMEOUT_MS);
    }

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      window.removeEventListener("hashchange", scrollToHash);
      observer?.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isChrome, pathname]);

  if (!isChrome) return <>{children}</>;

  return (
    <>
      {navbar}
      <main>{children}</main>
      {footer}
    </>
  );
}
