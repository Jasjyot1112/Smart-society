const CACHE_NAME = 'smart-society-cache-v1';
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/vite.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // If API request, use Network First, fallback to cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Use Stale-While-Revalidate for other requests, with offline fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          // Only cache valid responses
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            cache.put(event.request, networkResponse.clone());
          }
        });
        return networkResponse;
      }).catch(() => {
        // If fetch fails (offline) and not in cache, return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
      return cachedResponse || fetchPromise;
    })
  );
});
