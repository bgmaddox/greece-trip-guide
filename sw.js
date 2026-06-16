/* Athens 2026 Trip Guide — service worker
   Bump CACHE version whenever you edit the guide so phones pull fresh content. */
const CACHE = 'athens-2026-v9';

const CORE = [
  './',
  'index.html',
  'greece_trip_guide.html',
  'athens_culture.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Navigations: serve the guide from cache first, fall back to network.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).catch(() => caches.match('greece_trip_guide.html'))
      )
    );
    return;
  }

  // Cross-origin (Google Fonts + Unsplash photos) and same-origin assets:
  // cache-first, then fetch and store so the guide works fully offline.
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        // Cache successful or opaque (cross-origin) responses.
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => hit);
    })
  );
});
