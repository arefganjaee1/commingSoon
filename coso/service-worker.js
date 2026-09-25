const CACHE = 'gharzi-v1.2';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/icon-192.png'
];

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE).map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

// network-first: همیشه اول از شبکه (آخرین نسخه) میاره، فقط وقتی آفلاینه از cache استفاده می‌کنه
self.addEventListener('fetch', e => {
    if(e.request.url.includes('workers.dev')) return;
    e.respondWith(
        fetch(e.request).then(res => {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
            return res;
        }).catch(() => caches.match(e.request))
    );
});