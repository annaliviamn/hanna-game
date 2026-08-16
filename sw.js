const CACHE_NAME = "hanna-cache-v66";
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

// NETWORK FIRST — tenta buscar da rede, cai no cache se offline
self.addEventListener("fetch", (e) => {
  // Só intercepta requisições GET (POST do Firebase passa direto, sem cache)
  if (e.request.method !== "GET") {
    return; // deixa a requisição seguir normal, sem passar pelo Service Worker
  }

  // Ignora chamadas pro Firebase (Auth/Firestore) — nunca devem ser cacheadas
  if (e.request.url.includes("googleapis.com") || e.request.url.includes("firebaseio.com") || e.request.url.includes("firestore.googleapis.com")) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Só cacheia respostas completas e válidas (200), nunca parciais (206) ou erros
        if (response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
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
