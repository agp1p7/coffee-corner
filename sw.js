const CACHE_NAME = 'yiyu-coffee-shell-v7';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest?v=corner-2',
  './coffee-header.css?v=1',
  './coffee-step-model.js?v=1',
  './coffee-grinder-guide.js?v=2',
  './recipe-draft-fix.js',
  './coffee-i18n.js?v=3',
  './coffee-equipment.js?v=11',
  './coffee-brew-flow.js?v=10',
  './coffee-bean-scanner.js?v=3',
  './coffee-workspace.js?v=17',
  './coffee-champion-recipes.js?v=14',
  './coffee-visual-ui.js?v=15',
  './coffee-onboarding.js?v=2',
  './coffee-pwa.js?v=6',
  './coffee-recipe-share.js?v=5',
  './coffee-share-card-renderer.js?v=layout-c-dual-1',
  './coffee-icon-180.png?v=corner-1',
  './coffee-icon-192.png?v=corner-1',
  './coffee-icon-512.png?v=corner-1',
  './coffee-icon-192.svg?v=corner-1'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(PRECACHE_URLS.map(u => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k.startsWith('yiyu-coffee-shell-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const exact = await cache.match(req, { ignoreSearch: false });
        if (exact) return exact;
        const loose = await cache.match(req, { ignoreSearch: true });
        if (loose) return loose;
        if (req.mode === 'navigate') {
          const fallback = await cache.match('./index.html') || await cache.match('./');
          if (fallback) return fallback;
        }
        return Response.error();
      })
  );
});
