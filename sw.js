const CACHE_NAME = "hanna-cache-v18";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js"
];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── CACHE FIRST ───────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// ── INDEXEDDB — persiste lembretes mesmo com SW reiniciado ────
function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("hanna-lembretes", 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore("lembretes", { keyPath: "id" });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function salvarLembrete(lembrete) {
  const db   = await abrirDB();
  const tx   = db.transaction("lembretes", "readwrite");
  tx.objectStore("lembretes").put(lembrete);
  return new Promise(r => tx.oncomplete = r);
}

async function removerLembrete(id) {
  const db   = await abrirDB();
  const tx   = db.transaction("lembretes", "readwrite");
  tx.objectStore("lembretes").delete(id);
  return new Promise(r => tx.oncomplete = r);
}

async function listarLembretes() {
  const db   = await abrirDB();
  const tx   = db.transaction("lembretes", "readonly");
  return new Promise((resolve, reject) => {
    const req = tx.objectStore("lembretes").getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

// ── VERIFICAR E DISPARAR LEMBRETES PENDENTES ─────────────────
async function verificarLembretes() {
  const agora     = Date.now();
  const lembretes = await listarLembretes();

  for (const l of lembretes) {
    if (l.timestamp <= agora) {
      await self.registration.showNotification("Hanna lembrou você!", {
        body:     l.texto,
        icon:     "assets/sprites/hanna/contente.png",
        badge:    "assets/sprites/hanna/contente.png",
        tag:      `lembrete-${l.id}`,
        renotify: true,
        data:     { id: l.id },
      });
      await removerLembrete(l.id);
    }
  }
}

// Verifica lembretes pendentes a cada sync periódico
self.addEventListener("periodicsync", e => {
  if (e.tag === "hanna-lembretes") e.waitUntil(verificarLembretes());
});

// ── MENSAGENS DO APP ──────────────────────────────────────────
self.addEventListener("message", async (event) => {
  const { tipo, id, texto, timestamp } = event.data || {};

  if (tipo === "AGENDAR_LEMBRETE") {
    if (!timestamp || timestamp <= Date.now()) return;

    // Salva no IndexedDB — persiste mesmo se o SW for reiniciado
    await salvarLembrete({ id, texto, timestamp });

    // Tenta agendar via setTimeout também (funciona se o SW estiver vivo)
    const atraso = timestamp - Date.now();
    setTimeout(async () => {
      await self.registration.showNotification("Hanna lembrou você!", {
        body:     texto,
        icon:     "assets/sprites/hanna/contente.png",
        badge:    "assets/sprites/hanna/contente.png",
        tag:      `lembrete-${id}`,
        renotify: true,
        data:     { id },
      });
      await removerLembrete(id);
    }, atraso);
  }

  if (tipo === "CANCELAR_LEMBRETE") {
    await removerLembrete(id);
    const notifs = await self.registration.getNotifications({ tag: `lembrete-${id}` });
    notifs.forEach(n => n.close());
  }
});

// ── CLIQUE NA NOTIFICAÇÃO ─────────────────────────────────────
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