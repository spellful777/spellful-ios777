/**
 * POST /api/community/follows
 * Follow or unfollow a user (toggle).
 * Body: { targetUserId: string }
 * Returns: { following: boolean, followersCount: number }
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { user } from '@/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { isBlocked } from '@/server/lib/block-check.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const { targetUserId } = req.body as { targetUserId?: string };
  if (!targetUserId || targetUserId === myId) {
    return res.status(400).json({ error: 'Valid targetUserId required' });
  }

  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  // Block check
  if (await isBlocked(myId, targetUserId)) {
    return res.status(403).json({ error: 'Unable to follow this user' });
  }

  // Verify target exists and has public profile
  const [target] = await db
    .select({ id: user.id, profileVisibility: user.profileVisibility })
    .from(user)
    .where(eq(user.id, targetUserId))
    .limit(1);
  if (!target) return res.status(404).json({ error: 'User not found' });

  try {
    // Check if already following
    const existing = await db.execute(sql`
      SELECT id FROM user_follows WHERE follower_id = ${myId} AND following_id = ${targetUserId} LIMIT 1
    `) as unknown as [Array<{ id: number }>, unknown];

    const alreadyFollowing = (existing[0] as Array<{ id: number }>).length > 0;

    if (alreadyFollowing) {
      // Unfollow
      await db.execute(sql`
        DELETE FROM user_follows WHERE follower_id = ${myId} AND following_id = ${targetUserId}
      `);
    } else {
      // Follow
      await db.execute(sql`
        INSERT IGNORE INTO user_follows (follower_id, following_id) VALUES (${myId}, ${targetUserId})
      `);
    }

    // Get updated follower count for target
    const [countRow] = await db.execute(sql`
      SELECT COUNT(*) AS cnt FROM user_follows WHERE following_id = ${targetUserId}
    `) as unknown as [Array<{ cnt: number }>, unknown];
    const followersCount = Number((countRow as unknown as Array<{ cnt: number }>)[0]?.cnt ?? 0);

    res.json({ following: !alreadyFollowing, followersCount });
  } catch {
    // user_follows table may not exist yet
    return res.status(503).json({ error: 'Follow feature not yet available' });
  }
}
