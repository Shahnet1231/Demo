// SHAH Group App - Service Worker
// IMPORTANT: Jab bhi naya update deploy karein, ye CACHE_VERSION number badha dein
// (e.g. v1 -> v2). Isi se app ko pata chalta hai ke naya version aaya hai.
const CACHE_VERSION = 'shahgroup-v1';

const FILES_TO_CACHE = [
  './index.html',
  './manifest.json'
];

// Install: naya service worker aate hi fresh files cache karta hai
self.addEventListener('install', (event) => {
  self.skipWaiting(); // naya version turant activate hone do, wait na kare
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// Activate: purane cache versions delete kar deta hai
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: pehle network se try karta hai (latest version milay), fail ho to cache se serve (offline support)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
