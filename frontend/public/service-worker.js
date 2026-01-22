/* eslint-disable no-restricted-globals */

// Dynamic Service Worker for Multi-Client PWA
// Detects brand from hostname and caches accordingly

const getBrand = () => {
  const host = self.location.hostname.toLowerCase();
  return host.includes('amari') ? 'amari' : 'tytaj';
};

const brand = getBrand();
const CACHE_NAME = `inphora-${brand}-v2`;

const urlsToCache = [
  '/',
  '/index.html',
  `/manifest-${brand}.json`,
  `/${brand}-icon.png`,
  `/${brand}-favicon.png`,
];

// Install event - cache brand-specific resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log(`[${brand}] Caching PWA resources`);
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches including 'amariflow-v1'
          if (cacheName !== CACHE_NAME) {
            console.log(`[${brand}] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first for manifest, cache first for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Bypass cache for API requests
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Always fetch fresh manifest
  if (url.pathname.includes('manifest')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
