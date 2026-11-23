/**
 * GET /api/blocks
 * Returns the list of users the authenticated user has blocked.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityBlocks, user } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const rows = await db
    .select({
      id: communityBlocks.id,
      blockedId: communityBlocks.blockedId,
      createdAt: communityBlocks.createdAt,
      name: user.name,
      username: user.username,
      image: user.image,
    })
    .from(communityBlocks)
    .innerJoin(user, eq(user.id, communityBlocks.blockedId))
    .where(eq(communityBlocks.blockerId, session.user.id))
    .orderBy(communityBlocks.createdAt);

  res.json({ blocks: rows });
}
