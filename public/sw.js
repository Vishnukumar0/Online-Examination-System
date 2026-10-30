/* ── Service Worker for PWA & Offline Quiz Caching ─────────── */
const CACHE_NAME = 'quizmaster-pro-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/api.js',
  '/js/auth.js',
  '/js/utils/audio.js',
  '/js/utils/confetti.js',
  '/js/utils/certificate.js',
  '/js/utils/charts.js',
  '/js/utils/voice.js',
  '/js/utils/calculator.js',
  '/js/utils/ai-tutor.js',
  '/js/utils/exam-exporter.js',
  '/js/views/dashboard.js',
  '/js/views/quizzes.js',
  '/js/views/quiz-take.js',
  '/js/views/results.js',
  '/js/views/leaderboard.js',
  '/js/views/duel.js',
  '/js/views/admin-quizzes.js',
  '/js/views/admin-users.js',
  '/js/views/profile.js',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Try network first, fallback to cache
  if (e.request.method === 'GET') {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
