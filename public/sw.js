/**
 * QueueEase Service Worker (PWA Offline Citizen Shell)
 * sw.js
 */

const CACHE_NAME = 'queueease-v1.2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/citizen/home.html',
  '/citizen/services.html',
  '/citizen/issue.html',
  '/citizen/token.html',
  '/citizen/track.html',
  '/citizen/assist.html',
  '/citizen/profile.html',
  '/assets/css/tokens.css',
  '/assets/css/base.css',
  '/assets/css/components.css',
  '/assets/css/citizen.css',
  '/assets/css/dashboard.css',
  '/assets/js/store.js',
  '/assets/js/ui.js',
  '/assets/js/ticket.js',
  '/assets/js/track.js',
  '/assets/js/a11y.js',
  '/assets/icons/icon.svg',
  '/assets/icons/pwa-192x192.png',
  '/assets/icons/pwa-512x512.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache non-critical asset warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return networkRes;
      })
      .catch(async () => {
        const cachedRes = await caches.match(event.request);
        if (cachedRes) return cachedRes;

        if (event.request.headers.get('accept')?.includes('text/html')) {
          const offlineFallback = await caches.match('/citizen/track.html') || await caches.match('/citizen/home.html');
          if (offlineFallback) return offlineFallback;
        }

        return caches.match('/404.html');
      })
  );
});
