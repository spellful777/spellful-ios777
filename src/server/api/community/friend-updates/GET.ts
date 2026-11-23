/**
 * GET /api/community/friend-updates
 *
 * Returns a paginated feed of friend_feed_events from users the viewer follows,
 * respecting blocks, visibility settings, and share_birthday_in_feed opt-in.
 *
 * Query: ?page=1&limit=20
 * Response: { events: FeedEvent[], hasMore: boolean, total: number }
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '../../../lib/auth-session.js';
import { db } from '../../../db/client.js';
import { sql } from 'drizzle-orm';

interface FeedEventRow {
  id: number;
  actor_id: string;
  event_type: string;
  payload: string | null;
  audience: string;
  created_at: Date;
  actor_name: string | null;
  actor_username: string | null;
  actor_image: string | null;
  actor_account_type: string | null;
  my_reaction: string | null;
  reaction_count: number;
}

interface CountRow {
  total: number;
}

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const myId = session.user.id;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  try {
    // Get IDs the viewer follows
    const [followRows] = await db.execute(sql`
      SELECT following_id FROM user_follows WHERE follower_id = ${myId}
    `) as unknown as [Array<{ following_id: string }>, unknown];
    const followingIds = (followRows as Array<{ following_id: string }>).map((r) => r.following_id);

    if (followingIds.length === 0) {
      return res.json({ events: [], hasMore: false, total: 0 });
    }

    // Get blocked user IDs (both directions)
    const [blockRows] = await db.execute(sql`
      SELECT blocker_id, blocked_id FROM community_blocks
      WHERE blocker_id = ${myId} OR blocked_id = ${myId}
    `) as unknown as [Array<{ blocker_id: string; blocked_id: string }>, unknown];
    const blockedSet = new Set<string>();
    for (const b of blockRows as Array<{ blocker_id: string; blocked_id: string }>) {
      if (b.blocker_id === myId) blockedSet.add(b.blocked_id);
      else blockedSet.add(b.blocker_id);
    }

    // Filter out blocked users from following list
    const visibleIds = followingIds.filter((id) => !blockedSet.has(id));
    if (visibleIds.length === 0) {
      return res.json({ events: [], hasMore: false, total: 0 });
    }

    // Build IN clause
    const idList = visibleIds.map((id) => sql`${id}`);
    const inClause = sql.join(idList, sql`, `);

    // Count total (excluding hidden events)
    const [countRows] = await db.execute(sql`
      SELECT COUNT(*) AS total
      FROM friend_feed_events ffe
      WHERE ffe.actor_id IN (${inClause})
        AND ffe.audience IN ('public', 'followers')
        AND NOT EXISTS (
          SELECT 1 FROM friend_feed_hidden ffh
          WHERE ffh.user_id = ${myId} AND ffh.event_id = ffe.id
        )
        AND (
          ffe.event_type != 'birthday'
          OR EXISTS (
            SELECT 1 FROM user u
            WHERE u.id = ffe.actor_id AND u.share_birthday_in_feed = TRUE
          )
        )
    `) as unknown as [CountRow[], unknown];
    const total = Number((countRows as CountRow[])[0]?.total ?? 0);

    // Fetch paginated events with actor info and reaction summary
    const [eventRows] = await db.execute(sql`
      SELECT
        ffe.id,
        ffe.actor_id,
        ffe.event_type,
        ffe.payload,
        ffe.audience,
        ffe.created_at,
        u.name AS actor_name,
        u.username AS actor_username,
        u.image AS actor_image,
        u.account_type AS actor_account_type,
        (
          SELECT emoji FROM friend_feed_reactions
          WHERE event_id = ffe.id AND user_id = ${myId}
          LIMIT 1
        ) AS my_reaction,
        (
          SELECT COUNT(*) FROM friend_feed_reactions
          WHERE event_id = ffe.id
        ) AS reaction_count
      FROM friend_feed_events ffe
      JOIN user u ON u.id = ffe.actor_id
      WHERE ffe.actor_id IN (${inClause})
        AND ffe.audience IN ('public', 'followers')
        AND NOT EXISTS (
          SELECT 1 FROM friend_feed_hidden ffh
          WHERE ffh.user_id = ${myId} AND ffh.event_id = ffe.id
        )
        AND (
          ffe.event_type != 'birthday'
          OR u.share_birthday_in_feed = TRUE
        )
      ORDER BY ffe.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as [FeedEventRow[], unknown];

    const events = (eventRows as FeedEventRow[]).map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      eventType: row.event_type,
      payload: row.payload ? (typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload) : null,
      audience: row.audience,
      createdAt: row.created_at,
      actor: {
        id: row.actor_id,
        name: row.actor_name,
        username: row.actor_username,
        image: row.actor_image,
        accountType: row.actor_account_type,
      },
      myReaction: row.my_reaction ?? null,
      reactionCount: Number(row.reaction_count ?? 0),
    }));

    return res.json({ events, hasMore: offset + events.length < total, total });
  } catch (err) {
    console.error(JSON.stringify({ event: 'friend_updates.get.error', msg: String(err).slice(0, 200) }));
    return res.status(500).json({ error: 'Failed to load friend updates' });
  }
}
