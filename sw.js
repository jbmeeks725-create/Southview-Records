// ── SPIN VINYL Service Worker ──
// Strategy:
//   • App shell (HTML, CSS, JS, fonts, icons) → Cache First
//   • Supabase API calls → Network First (never cache auth/data)
//   • CDN assets (Chart.js, Tabler icons, etc.) → Stale While Revalidate
//   • Everything else → Network First with offline fallback

const CACHE_VERSION = 'spinvinyl-v2';
const SHELL_CACHE   = `${CACHE_VERSION}-shell`;
const CDN_CACHE     = `${CACHE_VERSION}-cdn`;

// Core app shell — these are cached on install and served immediately
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/site.webmanifest',
  '/favicon.png',
  '/favicon-32.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  // Room / tour cover art
  '/ledzeppelin4.jpg',
  '/kindofblue.jpg',
  '/alovesupreme.jpg',
  '/rumours.jpg',
  '/disraeligears.jpg',
  '/atfillmoreeast.jpg',
  '/inasilentway.jpg',
];

// CDN domains — cache aggressively but allow revalidation
const CDN_DOMAINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
];

// Never cache these — always go to network
const NEVER_CACHE = [
  'supabase.co',
  'supabase.com',
  'anthropic.com',
  'spotify.com',
  'discogs.com',
  'musicbrainz.org',
  'coverartarchive.org',
];


// ── Install: pre-cache the app shell ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()) // activate immediately
      .catch(err => console.warn('[SW] Shell cache failed:', err))
  );
});


// ── Activate: clean up old caches ─────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k.startsWith('spinvinyl-') && k !== SHELL_CACHE && k !== CDN_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // take control of all open tabs
  );
});


// ── Fetch: routing logic ───────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests entirely
  if (request.method !== 'GET') return;

  // Skip browser-extension and chrome-extension requests
  if (!url.protocol.startsWith('http')) return;

  // Never cache: Supabase, APIs, external services
  if (NEVER_CACHE.some(domain => url.hostname.includes(domain))) {
    return; // fall through to network
  }

  // CDN assets: stale-while-revalidate
  if (CDN_DOMAINS.some(domain => url.hostname.includes(domain))) {
    event.respondWith(staleWhileRevalidate(request, CDN_CACHE));
    return;
  }

  // App shell and local assets: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirstWithFallback(request));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirst(request));
});


// ── Cache strategies ───────────────────────────────────────────────────────

// Cache First: serve from cache, fall back to network, update cache
async function cacheFirstWithFallback(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline fallback: return the cached index.html for navigation requests
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network First: try network, fall back to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate: serve cache immediately, update in background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise;
}


// ── Push notifications (future use) ───────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'SPIN VINYL', {
      body:  data.body  || '',
      icon:  data.icon  || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag:   data.tag   || 'spinvinyl',
      data:  data.url   ? { url: data.url } : {},
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        const existing = clientList.find(c => c.url === url && 'focus' in c);
        if (existing) return existing.focus();
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
