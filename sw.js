const CACHE_NAME = "hanna-cache-v46";

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

// INDEXEDDB
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
  const db = await abrirDB();
  const tx = db.transaction("lembretes", "readwrite");
  tx.objectStore("lembretes").put(lembrete);
  return new Promise(r => tx.oncomplete = r);
}

async function removerLembrete(id) {
  const db = await abrirDB();
  const tx = db.transaction("lembretes", "readwrite");
  tx.objectStore("lembretes").delete(id);
  return new Promise(r => tx.oncomplete = r);
}

async function listarLembretes() {
  const db = await abrirDB();
  const tx = db.transaction("lembretes", "readonly");
  return new Promise((resolve, reject) => {
    const req = tx.objectStore("lembretes").getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

// VERIFICAR E DISPARAR LEMBRETES PENDENTES
// Chamada tanto pelo periodicsync quanto pelo alarm (quando disponível)
// e também ao receber mensagem CHECK_LEMBRETES do app
async function verificarLembretes() {
  const agora     = Date.now();
  const lembretes = await listarLembretes();

  for (const l of lembretes) {
    if (l.timestamp <= agora) {
      await self.registration.showNotification("Hanna lembrou você! 🐾", {
        body:     l.texto,
        icon:     "assets/sprites/hanna/contente.png",
        badge:    "assets/sprites/hanna/contente.png",
        tag:      `lembrete-${l.id}`,
        renotify: true,
        data:     { id: l.id },
        vibrate:  [200, 100, 200],
      });
      await removerLembrete(l.id);
    }
  }
}

// ALARME INTERNO: verifica a cada 1 min enquanto SW vivo 
// (funciona enquanto o app está em foreground ou SW não foi morto)
let _alarmeInterval = null;

function iniciarAlarmeInterno() {
  if (_alarmeInterval) return;
  _alarmeInterval = setInterval(() => {
    verificarLembretes().catch(() => {});
  }, 60 * 1000);
}

// Inicia o alarme interno assim que o SW ativa
self.addEventListener("activate", () => {
  iniciarAlarmeInterno();
});

// PERIODIC SYNC (background, Android)
self.addEventListener("periodicsync", e => {
  if (e.tag === "hanna-lembretes") e.waitUntil(verificarLembretes());
});

// MENSAGENS DO APP
self.addEventListener("message", async (event) => {
  const { tipo, id, texto, timestamp } = event.data || {};

  // App abrindo — verifica imediatamente se tem algo vencido
  if (tipo === "CHECK_LEMBRETES") {
    await verificarLembretes();
    return;
  }

  if (tipo === "AGENDAR_LEMBRETE") {
    if (!timestamp) return;

    // Sempre salva no IndexedDB (persiste se SW for morto e reiniciado)
    await salvarLembrete({ id, texto, timestamp });

    // Se ainda não venceu, verifica no momento exato via setTimeout
    // (funciona enquanto o SW estiver vivo — complementa o IndexedDB)
    const atraso = timestamp - Date.now();
    if (atraso > 0) {
      setTimeout(() => {
        verificarLembretes().catch(() => {});
      }, atraso);
    } else {
      // Já venceu — dispara agora
      await verificarLembretes();
    }
  }

  if (tipo === "CANCELAR_LEMBRETE") {
    await removerLembrete(id);
    const notifs = await self.registration.getNotifications({ tag: `lembrete-${id}` });
    notifs.forEach(n => n.close());
  }
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
