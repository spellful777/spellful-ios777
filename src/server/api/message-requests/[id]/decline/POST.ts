/**
 * POST /api/message-requests/:id/decline
 * Decline a pending message request.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { messageRequests } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const myId = session.user.id;
  const reqId = parseInt(req.params.id);
  if (isNaN(reqId)) return res.status(400).json({ error: 'Invalid id' });

  const [row] = await db.select().from(messageRequests)
    .where(and(eq(messageRequests.id, reqId), eq(messageRequests.recipientId, myId))).limit(1);
  if (!row) return res.status(404).json({ error: 'Request not found' });

  await db.update(messageRequests).set({ status: 'declined' }).where(eq(messageRequests.id, reqId));
  res.json({ ok: true });
}
