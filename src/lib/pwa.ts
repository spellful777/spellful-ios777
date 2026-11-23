/**
 * PWA helpers — service worker registration + push subscription.
 * Called once after the user is confirmed signed-in.
 */

const VAPID_PUBLIC_KEY = ''; // populated server-side via /api/push/vapid-key

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.warn('[PWA] SW registration failed:', err);
    return null;
  }
}

export async function requestPushPermission(reg: ServiceWorkerRegistration): Promise<boolean> {
  if (!('Notification' in window) || !('PushManager' in window)) return false;

  // Already granted — subscribe straight away
  if (Notification.permission === 'granted') {
    await subscribeToPush(reg);
    return true;
  }

  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  if (result === 'granted') {
    await subscribeToPush(reg);
    return true;
  }
  return false;
}

async function subscribeToPush(reg: ServiceWorkerRegistration): Promise<void> {
  try {
    // Fetch the server's VAPID public key
    const keyRes = await fetch('/api/push/vapid-key', { credentials: 'include' });
    if (!keyRes.ok) return;
    const { publicKey } = await keyRes.json() as { publicKey: string };
    if (!publicKey) return;

    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      // Already subscribed — make sure server has it
      await sendSubscriptionToServer(existing);
      return;
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
    });

    await sendSubscriptionToServer(subscription);
  } catch (err) {
    console.warn('[PWA] Push subscription failed:', err);
  }
}

async function sendSubscriptionToServer(sub: PushSubscription): Promise<void> {
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(sub.toJSON()),
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export { VAPID_PUBLIC_KEY };
