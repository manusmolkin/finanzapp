// FinanzApp Service Worker — hace que la app funcione offline
const CACHE = 'finanzapp-v13';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

// Instalar: guarda todos los archivos en caché
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar: limpia cachés viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => keys.filter(k => k !== CACHE))
      .then(old => Promise.all(old.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: sirve desde caché primero, luego red
self.addEventListener('fetch', e => {
  // Solo cachear requests del mismo origen (no APIs externas como dolarapi.com)
  if (!e.request.url.startsWith(self.location.origin)) {
    return; // Deja pasar requests a APIs externas sin interceptar
  }
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request).then(res => {
        // Cachear nuevas respuestas dinámicamente
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }))
      .catch(() => caches.match('./index.html')) // Fallback offline
  );
});
