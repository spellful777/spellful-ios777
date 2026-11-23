/* Spellful PWA Service Worker */
const CACHE_NAME = 'spellful-v1';
const OFFLINE_URL = '/messages';

// ── Install: cache the messages shell ────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/messages'])
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first, fall back to cache for navigation ──────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL)
      )
    );
  }
});

// ── Push: show notification ───────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Spellful', body: 'You have a new message ✨', url: '/messages' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/airo-assets/images/pwa/app-icon',
      badge: '/airo-assets/images/pwa/app-icon',
      tag: 'spellful-message',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url },
      actions: [
        { action: 'open', title: 'Open Messages' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

// ── Notification click: open or focus the messages tab ───────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/messages';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus an existing messages tab if open
      for (const client of clients) {
        if (client.url.includes('/messages') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
