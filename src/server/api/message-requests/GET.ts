/**
 * GET /api/message-requests
 * Returns pending message requests for the current user.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { messageRequests, user } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const myId = session.user.id;

  const rows = await db
    .select({
      id: messageRequests.id,
      conversationId: messageRequests.conversationId,
      requesterId: messageRequests.requesterId,
      status: messageRequests.status,
      createdAt: messageRequests.createdAt,
      requesterName: user.name,
      requesterUsername: user.username,
      requesterImage: user.image,
    })
    .from(messageRequests)
    .leftJoin(user, eq(messageRequests.requesterId, user.id))
    .where(and(eq(messageRequests.recipientId, myId), eq(messageRequests.status, 'pending')));

  res.json({ requests: rows });
}
