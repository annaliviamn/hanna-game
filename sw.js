const CACHE_NAME = "hanna-cache-v56";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js"
];

// INSTALL
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// ACTIVATE
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// CACHE FIRST
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// CLIQUE NA NOTIFICAÇÃO
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(clients => {
        if (clients.length > 0) return clients[0].focus();
        return self.clients.openWindow("./");
      })
  );
});
