const CACHE_NAME = "eva-static-v1";

// Static assets worth caching (images, fonts, favicons)
const STATIC_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".woff", ".woff2"];

function isStatic(url) {
  return STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

function isApiOrNext(url) {
  return url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/");
}

// Install — no pre-caching needed; cache fills on first use
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
//   - Static assets (images/fonts): cache-first, fall back to network
//   - _next/ chunks and API routes: network-only (always fresh)
//   - Everything else (pages): network-first, fall back to cache
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // API and Next.js internals — always network
  if (isApiOrNext(url)) return;

  if (isStatic(url)) {
    // Cache-first for images / fonts
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
  } else {
    // Network-first for pages
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
