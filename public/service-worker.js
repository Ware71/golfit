const CACHE_NAME = 'golfit-cache-v2.1.3'; // Change version to bust old cache
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/styles.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/courses.js',
  '/js/rounds.js',
  '/js/ui.js',
  '/js/stats.js',
  '/js/profile.js',
  '/js/clubs.js',
  '/js/addRound.js'
];

// Install event – cache core files
self.addEventListener('install', (event) => {
  self.skipWaiting(); // 🔁 Immediately take control
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

// Activate event – clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // 🔁 Force update for all clients
});

// Fetch event – serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
