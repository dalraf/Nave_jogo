const CACHE_NAME = "aerobatalha-cache-v1";

// Liste todos os assets essenciais para funcionar offline
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
  // Adicione aqui quaisquer outros arquivos estáticos que existirem:
  // "./icons/icon-192.png",
  // "./icons/icon-512.png",
  // "./icons/icon-192-maskable.png",
  // "./icons/icon-512-maskable.png",
  // "./assets/sprites.png",
  // "./assets/audio/laser.mp3",
  // "./assets/styles.css",
  // "./src/main.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") {
    return;
  }

  event.respondWith(
    (async () => {
      const url = new URL(req.url);

      // Tentar cache primeiro
      const cached = await caches.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);

        // Cachear respostas de mesma origem e status OK
        if (res.ok && url.origin === location.origin) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
        }
        return res;
      } catch (err) {
        // Fallback de navegação para index.html quando offline
        if (req.headers.get("accept")?.includes("text/html")) {
          const cache = await caches.open(CACHE_NAME);
          const index = await cache.match("./index.html");
          if (index) return index;
        }
        throw err;
      }
    })()
  );
});