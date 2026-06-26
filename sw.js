// SPIN VINYL — Service Worker
// Strategy: cache-first for static assets, network-first for API calls.
// The app shell (HTML/CSS/JS) loads instantly from cache; Supabase and
// Spotify API calls always go to the network.

const CACHE_NAME = "spinvinyl-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon.png",
  "/favicon-32.png",
];

// Hosts that should always go to the network (never cached)
const NETWORK_ONLY_HOSTS = [
  "supabase.co",
  "spotify.com",
  "musicbrainz.org",
  "coverartarchive.org",
  "discogs.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdn.jsdelivr.net",
  "unpkg.com",
];

// ---- Install: pre-cache static app shell ----
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // Don't fail install if some assets are missing
        console.warn("[SW] Pre-cache partial failure:", err);
      });
    })
  );
  // Take control immediately without waiting for old SW to expire
  self.skipWaiting();
});

// ---- Activate: clean up old caches ----
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---- Fetch: cache-first for static, network-first for everything else ----
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Always network for API calls, external fonts, CDN scripts
  const isNetworkOnly = NETWORK_ONLY_HOSTS.some((host) =>
    url.hostname.includes(host)
  );
  if (isNetworkOnly) return;

  // For navigation requests and static assets: cache-first with network fallback
  if (
    event.request.method === "GET" &&
    (event.request.mode === "navigate" ||
      STATIC_ASSETS.some((path) => url.pathname === path))
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          // Serve from cache and update cache in background
          fetch(event.request)
            .then((fresh) => {
              if (fresh && fresh.status === 200) {
                caches.open(CACHE_NAME).then((cache) =>
                  cache.put(event.request, fresh)
                );
              }
            })
            .catch(() => {});
          return cached;
        }
        // Not in cache — fetch from network and cache the response
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, clone)
          );
          return response;
        });
      })
    );
  }
});
