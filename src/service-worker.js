/* =============================================
   SmartPOS Service Worker - Full Offline Support
   ============================================= */

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

clientsClaim();

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// SPA routing - serve index.html for navigation requests
registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') return false;
    if (url.pathname.startsWith('/_')) return false;
    if (url.pathname.match(new RegExp('/[^/?]+\\.[^/]+$'))) return false;
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// =============================================
// CACHE STRATEGIES
// =============================================

// Static assets - Cache First (images, fonts, css)
registerRoute(
  ({ request }) => ['image', 'font', 'style'].includes(request.destination),
  new CacheFirst({
    cacheName: 'pos-static-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);

// API: Products and Categories - StaleWhileRevalidate (show cached, update in bg)
registerRoute(
  ({ url }) => url.pathname.includes('/api/products') || url.pathname.includes('/api/categories') || url.pathname.includes('/api/units'),
  new StaleWhileRevalidate({
    cacheName: 'pos-products-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 })
    ]
  })
);

// API: Customers and Suppliers - StaleWhileRevalidate
registerRoute(
  ({ url }) => url.pathname.includes('/api/customers') || url.pathname.includes('/api/suppliers'),
  new StaleWhileRevalidate({
    cacheName: 'pos-people-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 1000, maxAgeSeconds: 30 * 60 })
    ]
  })
);

// API: Dashboard - Network First (fresh data preferred, fallback to cache)
registerRoute(
  ({ url }) => url.pathname.includes('/api/dashboard'),
  new NetworkFirst({
    cacheName: 'pos-dashboard-v1',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 5 * 60 })
    ]
  })
);

// =============================================
// BACKGROUND SYNC - Offline Order Queue
// =============================================
const bgSyncPlugin = new BackgroundSyncPlugin('pos-order-queue', {
  maxRetentionTime: 24 * 60  // 24 hours in minutes
});

// Orders POST - Queue when offline
registerRoute(
  ({ url, request }) => url.pathname.includes('/api/orders') && request.method === 'POST',
  new NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

// Sync API calls - Queue when offline
registerRoute(
  ({ url, request }) => url.pathname.includes('/api/sync') && request.method === 'POST',
  new NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

// =============================================
// OFFLINE FALLBACK & SYNC NOTIFICATIONS
// =============================================

// Notify clients when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'pos-order-queue') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SYNC_COMPLETE', message: 'Offline orders synced successfully!' });
      });
    });
  }
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/pos'));
});

console.log('[SmartPOS SW] Service worker loaded - Offline support active');
