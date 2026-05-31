const CACHE_NAME = 'cobbra-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/login',
  '/dashboard',
  '/dashboard/loading.js'
];

// 1. Service Worker Installation: Pre-cache core shell pages
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 [PWA Service Worker] Pre-caching static core shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Service Worker Activation: Clean up old obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ [PWA Service Worker] Clearing obsolete cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. High-performance offline-first fetch strategy with network fallback
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests and avoid API routes
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Cache dynamic assets temporarily
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return custom offline indicator if offline
        if (event.request.mode === 'navigate') {
          return caches.match('/dashboard');
        }
      });
    })
  );
});

// 4. Web Push Notification Listener (Frente 16)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Cobbra.ai 🐍',
    body: 'Você recebeu uma nova atualização no seu painel de cobranças!',
    icon: '/uploads/manifest_logo_192.png',
    badge: '/uploads/manifest_logo_192.png',
    data: { url: '/dashboard' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: data.data || { url: '/dashboard' },
    actions: [
      { action: 'open_url', title: 'Ver Painel ➔' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. Native click-through redirection routing
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and redirect
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => client.navigate(urlToOpen));
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
