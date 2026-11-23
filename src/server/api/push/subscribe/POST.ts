/**
 * POST /api/push/subscribe
 * Saves a Web Push subscription for the authenticated user.
 */
import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { pushSubscriptions } from '../../../db/schema.js';
import { getAuthSession } from '../../../lib/auth-session.js';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: Request, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session?.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { endpoint, keys } = req.body as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: 'Invalid subscription' });
    return;
  }

  try {
    // Upsert: replace existing subscription for this user+endpoint
    const existing = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.userId, session.user.id),
        eq(pushSubscriptions.endpoint, endpoint),
      ))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(pushSubscriptions)
        .set({ p256dh: keys.p256dh, auth: keys.auth, updatedAt: new Date() })
        .where(eq(pushSubscriptions.id, existing[0].id));
    } else {
      await db.insert(pushSubscriptions).values({
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('push.subscribe.error', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
}
