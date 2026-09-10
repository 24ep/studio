// Service Worker for application PWA
// v2.1.3: Force cleanup of stale Next.js asset mappings from older workers.
const CACHE_NAME = 'app-v2.1.3';
const urlsToCache = [
  '/api/manifest.json',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Opened cache');
        // Cache resources, but don't fail if some fail
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Service Worker: Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed:', error);
        // Don't fail installation if caching fails
      })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Helper function to check if request should be handled by service worker
function shouldHandleRequest(request) {
  const url = new URL(request.url);
  
  // Don't intercept API routes
  if (url.pathname.startsWith('/api/')) {
    return false;
  }
  
  // Don't intercept authentication-related pages (prevents cached authenticated pages after logout)
  if (url.pathname.startsWith('/auth/') || 
      url.pathname.startsWith('/login') ||
      url.pathname.includes('signin') ||
      url.pathname.includes('signout') ||
      url.pathname.includes('callback')) {
    return false;
  }
  
  // Don't intercept _next routes (Next.js internal)
  if (url.pathname.startsWith('/_next/')) {
    return false;
  }
  
  // Don't intercept hot reload and development routes
  if (url.pathname.includes('webpack') || url.pathname.includes('hot-update')) {
    return false;
  }
  
  // Don't intercept external resources
  if (url.origin !== self.location.origin) {
    return false;
  }
  
  // Don't intercept non-GET requests
  if (request.method !== 'GET') {
    return false;
  }
  
  // Don't intercept requests with cache-control: no-cache
  const cacheControl = request.headers.get('cache-control');
  if (cacheControl && cacheControl.includes('no-cache')) {
    return false;
  }
  
  return true;
}

// Fetch event - network first, then cache (for better PWA experience)
self.addEventListener('fetch', (event) => {
  // Skip requests that shouldn't be handled by service worker
  if (!shouldHandleRequest(event.request)) {
    return;
  }
  
  const request = event.request;
  const url = new URL(request.url);
  
  // Always fetch navigations from the network. Cached HTML can point at old
  // Next.js assets after a deploy and trigger MIME/chunk loading errors.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch((error) => {
          console.log('Service Worker: Network failed for navigation:', error);
          return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }
  
  // For other requests (assets, images, etc.), use cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Try to fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache).catch((error) => {
                  console.warn('Service Worker: Failed to cache response:', error);
                });
              });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.warn('Service Worker: Network fetch failed:', error);
            // Instead of returning a 408, just let the fetch fail naturally 
            // for non-navigation requests so the browser handles it appropriately.
            // This prevents MIME type errors when the browser expects a script/css
            // but gets our 'Network error' text/plain response.
            throw error;
          });
      })
      .catch((error) => {
        console.error('Service Worker: Cache match failed:', error);
        // Fallback to network
        return fetch(request).catch((networkError) => {
          console.error('Service Worker: All fetch attempts failed:', networkError);
          throw networkError;
        });
      })
  );
});

