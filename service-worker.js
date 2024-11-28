// service-worker.js
self.addEventListener('install', (event) => {
  console.log('Service Worker: Установлен');
  event.waitUntil(
    caches.open('static-v1').then((cache) => {
      return cache.addAll([
        '/', // Главная страница
        '/index.html',
        '/script.js',
        '/manifest.json',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  console.log('Service Worker: Обрабатываю запрос', event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Активирован');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'static-v1') {
            console.log('Service Worker: Удаляю старый кэш', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
