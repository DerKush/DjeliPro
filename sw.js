// Service worker : l'application s'ouvre même avec une connexion faible ou coupée.
// Après chaque mise à jour du site, augmentez le numéro de version ci-dessous.
const VERSION = 'djelipro-v1';
const SHELL = ['./', './index.html', './css/style.css', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png',
  './js/app.js', './js/config.js', './js/data.js', './js/search.js', './js/store.js', './js/ui.js', './js/searchbox.js',
  './js/pages/home.js', './js/pages/explore.js', './js/pages/catalog.js', './js/pages/seller.js', './js/pages/account.js', './js/pages/info.js', './js/pages/missions.js', './js/pages/projects.js'];

self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('tile.openstreetmap.org') || url.hostname.endsWith('supabase.co')) return; // toujours en ligne
  if (url.origin === location.origin) {
    // Réseau d'abord : on a toujours la dernière version du site ; le cache ne sert que hors connexion.
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
  } else {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); if (res.ok || res.type === 'opaque') caches.open(VERSION).then(c => c.put(req, copy)); return res; }).catch(() => caches.match(req)));
  }
});
