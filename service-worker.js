/**
 * SERVICE WORKER - CRYPTO FUTURES TRADEMATH
 * Cache-Only Strategy - 100% Offline
 */

// Changed version to v2 to force the browser to update your icons
var CACHE_NAME = 'crypto-futures-trademath-v2';

var FILES_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192.png'
];

// Install - Pre-cache all files
self.addEventListener('install', function(event) {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('[ServiceWorker] Pre-caching files');
            // We use a simple loop or return the promise to ensure it doesn't fail 
            // if one file is missing during transition
            return cache.addAll(FILES_TO_CACHE);
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

// Activate - Clean old caches (Removes v1 automatically)
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

// Fetch - Cache-only strategy
self.addEventListener('fetch', function(event) {
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                return response;
            }

            return caches.open(CACHE_NAME).then(function(cache) {
                return fetch(event.request).then(function(response) {
                    if (response.status === 200) {
                        cache.put(event.request, response.clone());
                    }
                    return response;
                }).catch(function() {
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
