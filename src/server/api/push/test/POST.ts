/**
 * POST /api/push/test
 * Sends a test push notification to the authenticated user's own devices.
 * Only works when the user has an active push subscription saved.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '../../../lib/auth-session.js';
import { sendPushToUser } from '../../../lib/push-notify.js';

export default async function handler(req: Request, res: Response): Promise<void> {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    await sendPushToUser(session.user.id, {
      title: '✨ Spellful Messages',
      body: 'Push notifications are working! You\'ll be alerted when new messages arrive.',
      url: '/messages',
    });
    res.json({ ok: true, message: 'Test notification sent' });
  } catch (err) {
    console.error('push.test.error', err);
    console.error(JSON.stringify({ event: 'push.test.error', msg: String(err).slice(0, 120) }));
    res.status(500).json({ error: 'Failed to send test notification' });
  }
}
