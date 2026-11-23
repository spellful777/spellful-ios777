/**
 * DELETE /api/blocks/:userId
 * Unblock a user. Does not restore Coven connections.
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityBlocks } from '@/server/db/schema.js';
import { and, eq } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ userId: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { userId } = req.params;
  await db
    .delete(communityBlocks)
    .where(
      and(
        eq(communityBlocks.blockerId, session.user.id),
        eq(communityBlocks.blockedId, userId),
      ),
    );

  res.json({ ok: true });
}
