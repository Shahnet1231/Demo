// SHAH GROUP - Service Worker
// Maqsad: PWA installable banana + app shell (index.html) ko cache karna
// taake app jaldi khule. NOTE: Ye sirf app ka "shell" cache karta hai —
// aapka asal data (Sales, Purchases, waghera) hamesha live Google Sheet se
// hi aata hai, is service worker ka data se koi lena dena nahi.

const CACHE_NAME = 'shahgroup-shell-v1'; // is version ko badal ke purana cache clear kar sakte hain
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: app shell ko cache mein daal do
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate: purane cache versions hata do
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: sirf apna page navigation/shell request cache-first, baaki (jaise
// Google Apps Script API calls, Google Fonts, CDN libraries) seedha
// internet se hi jayen — cache karne ki koshish na karein, warna data
// purana/stale dikh sakta hai.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // API/backend calls aur external CDN — hamesha network se (kabhi cache nahi)
  if (url.includes('script.google.com') || url.includes('cdnjs.cloudflare.com') || event.request.method !== 'GET') {
    return; // browser ka default fetch behavior chalne dein
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // internet na ho to jo cache mein hai wahi dikha do

      return cached || networkFetch;
    })
  );
});
