/**
 * Server-side push notification helper.
 * Call sendPushToUser(userId, payload) from any API handler after a new message is saved.
 *
 * web-push is CommonJS. We load it via a dynamic import() so Rollup's CJS interop
 * handles it without injecting a second `createRequire` declaration into the bundle
 * (which caused the "symbol already declared" build error).
 */
import { db } from '../db/client.js';
import { pushSubscriptions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { getSecret } from '#airo/secrets';
import type webpushType from 'web-push';

// Lazily loaded so the dynamic import runs once at first use
let webpush: typeof webpushType | null = null;
let configured = false;

async function getWebPush(): Promise<typeof webpushType> {
  if (webpush) return webpush;
  // Dynamic import lets Rollup's CJS interop handle web-push without a
  // top-level createRequire that would collide with Rollup's own injection.
  const mod = await import('web-push');
  webpush = (mod.default ?? mod) as typeof webpushType;
  return webpush;
}

async function ensureConfigured(): Promise<typeof webpushType | null> {
  const wp = await getWebPush();
  if (configured) return wp;
  const publicKey = getSecret('VAPID_PUBLIC_KEY');
  const privateKey = getSecret('VAPID_PRIVATE_KEY');
  if (!publicKey || !privateKey) return null;
  wp.setVapidDetails('mailto:hello@spellful.com', String(publicKey), String(privateKey));
  configured = true;
  return wp;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const wp = await ensureConfigured();
  if (!wp) return;

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  const results = await Promise.allSettled(
    subs.map(sub =>
      wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      )
    )
  );

  // Remove expired/invalid subscriptions (410 Gone or 404 Not Found)
  for (let i = 0; i < results.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const r = results[i];
    if (r.status === 'rejected') {
      const err = r.reason as { statusCode?: number };
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        // eslint-disable-next-line security/detect-object-injection
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subs[i].id));
      }
    }
  }
}
