/**
 * POST /api/community/blocks
 * Block a user. Idempotent — safe to call if already blocked.
 * Side effects:
 *   - Removes any existing Coven connection in either direction
 *   - Cancels any pending Coven invitations in either direction
 */
import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityBlocks, covenConnections } from '@/server/db/schema.js';
import { eq, and, or } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  const { userId } = req.body as { userId?: string };
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (userId === session.user.id) return res.status(400).json({ error: 'Cannot block yourself' });

  const myId = session.user.id;

  // Upsert block (ignore if already exists)
  const [existing] = await db
    .select({ id: communityBlocks.id })
    .from(communityBlocks)
    .where(and(eq(communityBlocks.blockerId, myId), eq(communityBlocks.blockedId, userId)))
    .limit(1);

  if (!existing) {
    await db.insert(communityBlocks).values({ blockerId: myId, blockedId: userId });
  }

  // Remove any Coven connection or pending invitation in either direction
  await db.delete(covenConnections).where(
    or(
      and(eq(covenConnections.requesterId, myId), eq(covenConnections.receiverId, userId)),
      and(eq(covenConnections.requesterId, userId), eq(covenConnections.receiverId, myId)),
    ),
  );

  res.json({ blocked: true });
}
