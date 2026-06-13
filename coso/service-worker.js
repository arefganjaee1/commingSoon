const CACHE = 'gharzi-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/logo.png'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
    if(e.request.url.includes('workers.dev')) return;
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
    );
});