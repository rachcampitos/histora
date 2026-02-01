/**
 * Custom Service Worker for Web Push Notifications
 * This extends the Angular service worker to handle push events
 */

// Import the Angular service worker
importScripts('./ngsw-worker.js');

// Handle push events
self.addEventListener('push', (event) => {
  console.log('[SW Push] Push received:', event);

  let data = { notification: {} };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('[SW Push] Failed to parse push data:', e);
      data = {
        notification: {
          title: 'NurseLite',
          body: event.data.text() || 'Nueva notificacion',
        },
      };
    }
  }

  const notification = data.notification || {};
  const title = notification.title || 'NurseLite';
  const options = {
    body: notification.body || '',
    icon: notification.icon || '/assets/icons/icon-192x192.png',
    badge: notification.badge || '/assets/icons/badge-72x72.png',
    image: notification.image,
    tag: notification.tag || 'default',
    data: notification.data || {},
    actions: notification.actions || [],
    requireInteraction: notification.requireInteraction || false,
    vibrate: notification.vibrate || [100, 50, 100],
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW Push] Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;
  let url = '/';

  // Determine URL based on action or data
  if (data.url) {
    url = data.url;
  } else {
    switch (data.type) {
      case 'ACCOUNT_VERIFIED':
        url = '/nurse/dashboard';
        break;
      case 'ACCOUNT_REJECTED':
        url = '/nurse/verification';
        break;
      case 'NEW_SERVICE_REQUEST':
        url = data.requestId ? `/nurse/requests/${data.requestId}` : '/nurse/requests';
        break;
      case 'SERVICE_ACCEPTED':
      case 'NURSE_ON_THE_WAY':
      case 'NURSE_ARRIVED':
        url = data.requestId ? `/patient/tracking/${data.requestId}` : '/patient/requests';
        break;
      case 'SERVICE_COMPLETED':
        url = data.requestId ? `/patient/requests/${data.requestId}/review` : '/patient/history';
        break;
      case 'PAYMENT_RECEIVED':
        url = '/nurse/earnings';
        break;
      default:
        url = '/home';
    }
  }

  // Handle specific action clicks
  if (action === 'accept' && data.requestId) {
    url = `/nurse/requests/${data.requestId}?action=accept`;
  } else if (action === 'view' && data.requestId) {
    url = data.type?.includes('SERVICE') && !data.type?.includes('REQUEST')
      ? `/patient/tracking/${data.requestId}`
      : `/nurse/requests/${data.requestId}`;
  } else if (action === 'chat' && data.requestId) {
    url = `/chat/${data.requestId}`;
  } else if (action === 'rate' && data.requestId) {
    url = `/patient/requests/${data.requestId}/review`;
  } else if (action === 'track' && data.requestId) {
    url = `/patient/tracking/${data.requestId}`;
  } else if (action === 'retry') {
    url = '/nurse/verification';
  } else if (action === 'open') {
    url = '/nurse/dashboard';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW Push] Notification closed:', event);
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW Push] Custom service worker loaded');
