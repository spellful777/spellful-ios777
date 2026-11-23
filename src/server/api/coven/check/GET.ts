/**
 * GET /api/coven/check?userId=xxx
 * Returns whether the calling user and the target user have an accepted Coven connection.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { covenConnections } from '@/server/db/schema.js';
import { eq, or, and } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const targetId = req.query.userId as string;
  if (!targetId) return res.status(400).json({ error: 'userId required' });

  const [conn] = await db
    .select({ id: covenConnections.id })
    .from(covenConnections)
    .where(
      and(
        or(
          and(eq(covenConnections.requesterId, myId), eq(covenConnections.receiverId, targetId)),
          and(eq(covenConnections.requesterId, targetId), eq(covenConnections.receiverId, myId)),
        ),
        eq(covenConnections.status, 'accepted'),
      ),
    )
    .limit(1);

  res.json({ isCoven: !!conn });
}
