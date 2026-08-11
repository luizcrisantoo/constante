'use strict';
const CACHE = 'constante-v6';
const ARQUIVOS = [
  './', 'index.html', 'privacidade.html', 'css/variables.css', 'css/styles.css',
  'js/config.js', 'js/vendor-supabase.js', 'js/data.js', 'js/core.js', 'js/ui.js',
  'js/auth.js', 'js/views.js', 'js/views2.js', 'js/views-auth.js', 'js/script.js',
  'manifest.webmanifest', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png'
];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE)

      .then(c => Promise.all(ARQUIVOS.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', ev => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== 'GET' || url.hostname.endsWith('.supabase.co')) return;

  if (ev.request.mode === 'navigate') {
    ev.respondWith(
      fetch(ev.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put('index.html', clone));
        return resp;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }

  if (url.origin === location.origin) {
    ev.respondWith(
      caches.match(ev.request, { ignoreSearch: true }).then(hit => {
        const rede = fetch(ev.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(ev.request, clone));
          }
          return resp;
        }).catch(() => hit);
        return hit || rede;
      })
    );
  }
});
