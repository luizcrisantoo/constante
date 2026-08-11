/* Constante — service worker
   - navegação: rede primeiro (atualização chega sempre), cache como fallback offline
   - estáticos: cache primeiro + revalidação em segundo plano (stale-while-revalidate)
   - Supabase: nunca intercepta (sync sempre online) */
'use strict';
const CACHE = 'constante-v5';
const ARQUIVOS = [
  './', 'index.html', 'css/variables.css', 'css/styles.css',
  'js/data.js', 'js/core.js', 'js/ui.js', 'js/views.js', 'js/views2.js', 'js/script.js',
  'manifest.webmanifest', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png'
];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE)
      // cache:'reload' força buscar da rede, nunca do HTTP-cache velho do navegador
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

  // páginas: rede primeiro (pega versão nova), cache se offline
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

  // estáticos do próprio site: responde do cache e revalida por trás
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
