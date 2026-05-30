const CACHE_NAME =
"hanna-cache-v14";

const ASSETS = [

  "./",

  "./index.html",

  "./style.css",

  "./script.js"

];

// SERVICE WORKER — Hanna App

self.addEventListener("install", (e) => {

  self.skipWaiting();

  e.waitUntil(

    caches.open(CACHE_NAME)

      .then(cache => {

        return cache.addAll(ASSETS);

      })

  );

});

self.addEventListener("activate", (e) => {

  e.waitUntil(

    caches.keys().then(keys => {

      return Promise.all(

        keys

          .filter(
            key =>
            key !== CACHE_NAME
          )

          .map(
            key =>
            caches.delete(key)
          )

      );

    }).then(() => self.clients.claim())

  );

});

// CACHE FIRST

self.addEventListener("fetch", (e) => {

  e.respondWith(

    caches.match(e.request)

      .then(response => {

        return response ||

        fetch(e.request);

      })

  );

});

// Recebe mensagem do app principal para agendar uma notificação
self.addEventListener("message", (event) => {
  const { tipo, id, texto, timestamp } = event.data || {};

  if (tipo === "AGENDAR_LEMBRETE") {
    const agora   = Date.now();
    const atraso  = timestamp - agora;

    if (atraso <= 0) return; // horário já passou

    // Agenda a notificação com setTimeout dentro do SW
    setTimeout(() => {
      self.registration.showNotification("🐾 Hanna lembrou você!", {
        body:    texto,
        icon:    "assets/sprites/hanna/contente.png",
        badge:   "assets/sprites/hanna/contente.png",
        tag:     `lembrete-${id}`,
        renotify: true,
        data:    { id },
      });
    }, atraso);
  }

  if (tipo === "CANCELAR_LEMBRETE") {
    // Fecha notificação se ainda estiver visível
    self.registration.getNotifications({ tag: `lembrete-${id}` })
      .then(notifs => notifs.forEach(n => n.close()));
  }
});

// Clique na notificação → abre o app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(clients => {
        if (clients.length > 0) {
          clients[0].focus();
        } else {
          self.clients.openWindow("./");
        }
      })
  );
});
