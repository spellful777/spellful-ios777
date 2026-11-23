/**
 * GET /api/community/follows
 * Get follow status and counts for a target user.
 * Query: ?targetUserId=<id>
 * Returns: { following: boolean, followersCount: number, followingCount: number }
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  const myId = session?.user?.id ?? null;

  const targetUserId = (req.query.targetUserId as string) || '';
  if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' });

  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  try {
    const [followersRow, followingRow] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) AS cnt FROM user_follows WHERE following_id = ${targetUserId}`) as unknown as Promise<[Array<{ cnt: number }>, unknown]>,
      db.execute(sql`SELECT COUNT(*) AS cnt FROM user_follows WHERE follower_id = ${targetUserId}`) as unknown as Promise<[Array<{ cnt: number }>, unknown]>,
    ]);

    let isFollowing = false;
    if (myId) {
      const [checkRow] = await db.execute(sql`
        SELECT id FROM user_follows WHERE follower_id = ${myId} AND following_id = ${targetUserId} LIMIT 1
      `) as unknown as [Array<{ id: number }>, unknown];
      isFollowing = (checkRow as Array<{ id: number }>).length > 0;
    }

    res.json({
      following: isFollowing,
      followersCount: Number((followersRow[0] as Array<{ cnt: number }>)[0]?.cnt ?? 0),
      followingCount: Number((followingRow[0] as Array<{ cnt: number }>)[0]?.cnt ?? 0),
    });
  } catch {
    res.json({ following: false, followersCount: 0, followingCount: 0 });
  }
}
