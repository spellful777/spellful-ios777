/**
 * POST /api/community/friend-updates/hide
 * Hides a friend feed event from the viewer's feed.
 * Body: { eventId: number }
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '../../../../lib/auth-session.js';
import { db } from '../../../../db/client.js';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const myId = session.user.id;
  const eventId = Number(req.body?.eventId);
  if (!eventId) return res.status(400).json({ error: 'eventId required' });

  try {
    await db.execute(sql`
      INSERT IGNORE INTO friend_feed_hidden (user_id, event_id)
      VALUES (${myId}, ${eventId})
    `);
    return res.json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ event: 'friend_updates.hide.error', msg: String(err).slice(0, 200) }));
    return res.status(500).json({ error: 'Failed to hide event' });
  }
}
