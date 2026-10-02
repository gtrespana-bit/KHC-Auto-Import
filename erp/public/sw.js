/* ============================================================================
   Service worker — PWA de KHC Auto Import.
   Estrategia:
     · Navegación: red primero, con respaldo en caché (funciona sin conexión
       una vez cargada la app).
     · Estáticos same-origin (assets con hash, iconos, manifest): caché primero
       y actualización en segundo plano.
     · Los datos NO pasan por el service worker: viven en IndexedDB.
   ========================================================================== */
// El ámbito del service worker depende de dónde se sirva el ERP: en
// desarrollo es la raíz ('/') y en producción '/erp/' (el mismo despliegue
// sirve la web pública en la raíz). Se deduce del propio ámbito de registro,
// así no hay ninguna ruta escrita a mano.
const BASE = new URL(self.registration.scope).pathname;
const CACHE = 'khc-autoimport-v3';
const SHELL = [
  BASE,
  `${BASE}manifest.webmanifest`,
  `${BASE}icons/icon-192.png`,
  `${BASE}icons/icon-512.png`,
  `${BASE}icons/apple-touch-icon.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegación: red primero, caché como respaldo offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(BASE, copy));
          return res;
        })
        .catch(() => caches.match(BASE)),
    );
    return;
  }

  // Estáticos: caché primero + actualización en segundo plano.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
