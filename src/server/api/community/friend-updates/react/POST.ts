/**
 * POST /api/community/friend-updates/react
 * Toggle an emoji reaction on a friend feed event.
 * Body: { eventId: number, emoji: string }
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '../../../../lib/auth-session.js';
import { db } from '../../../../db/client.js';
import { sql } from 'drizzle-orm';

const ALLOWED_EMOJIS = new Set(['✨', '🌙', '💜', '🔥', '🌿', '⭐', '🫶', '🌸']);

interface EventRow { id: number; actor_id: string; audience: string; }

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const myId = session.user.id;
  const eventId = Number(req.body?.eventId);
  const emoji = String(req.body?.emoji ?? '');

  if (!eventId || !ALLOWED_EMOJIS.has(emoji)) {
    return res.status(400).json({ error: 'Invalid eventId or emoji' });
  }

  try {
    // Verify the event exists and viewer is allowed to see it
    const [rows] = await db.execute(sql`
      SELECT id, actor_id, audience FROM friend_feed_events WHERE id = ${eventId} LIMIT 1
    `) as unknown as [EventRow[], unknown];
    const event = (rows as EventRow[])[0];
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check viewer follows the actor
    const [followRows] = await db.execute(sql`
      SELECT id FROM user_follows WHERE follower_id = ${myId} AND following_id = ${event.actor_id} LIMIT 1
    `) as unknown as [Array<{ id: number }>, unknown];
    if ((followRows as Array<{ id: number }>).length === 0 && event.actor_id !== myId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Toggle: if reaction exists, remove it; otherwise add it
    const [existingRows] = await db.execute(sql`
      SELECT id FROM friend_feed_reactions
      WHERE event_id = ${eventId} AND user_id = ${myId} AND emoji = ${emoji}
      LIMIT 1
    `) as unknown as [Array<{ id: number }>, unknown];

    if ((existingRows as Array<{ id: number }>).length > 0) {
      await db.execute(sql`
        DELETE FROM friend_feed_reactions
        WHERE event_id = ${eventId} AND user_id = ${myId} AND emoji = ${emoji}
      `);
      return res.json({ ok: true, action: 'removed' });
    } else {
      await db.execute(sql`
        INSERT IGNORE INTO friend_feed_reactions (event_id, user_id, emoji)
        VALUES (${eventId}, ${myId}, ${emoji})
      `);
      return res.json({ ok: true, action: 'added' });
    }
  } catch (err) {
    console.error(JSON.stringify({ event: 'friend_updates.react.error', msg: String(err).slice(0, 200) }));
    return res.status(500).json({ error: 'Failed to react' });
  }
}
