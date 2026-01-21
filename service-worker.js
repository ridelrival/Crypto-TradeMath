/**
 * SERVICE WORKER - CRYPTO FUTURES TRADEMATH
 * Cache-Only Strategy - 100% Offline
 */

var CACHE_NAME = 'crypto-futures-trademath-v1';

var FILES_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icons/icon-72.png',
    './icons/icon-96.png',
    './icons/icon-128.png',
    './icons/icon-144.png',
    './icons/icon-152.png',
    './icons/icon-192.png',
    './icons/icon-384.png',
    './icons/icon-512.png'
];

// Install - Pre-cache all files
self.addEventListener('install', function(event) {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('[ServiceWorker] Pre-caching files');
            return cache.addAll(FILES_TO_CACHE);
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

// Activate - Clean old caches
self.addEventListener('activate', function(event) {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
                if (key !== CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch - Cache-only strategy (no network fallback)
self.addEventListener('fetch', function(event) {
    // Only handle same-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                return response;
            }

            // If not in cache, try to fetch (but this shouldn't happen for our files)
            return caches.open(CACHE_NAME).then(function(cache) {
                return fetch(event.request).then(function(response) {
                    // Cache the fetched response
                    if (response.status === 200) {
                        cache.put(event.request, response.clone());
                    }
                    return response;
                }).catch(function() {
                    // Return a fallback for HTML requests
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('./index.html');
                    }
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            });
        })
    );
});
