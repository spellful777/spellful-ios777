/**
 * DELETE /api/message-requests/:id
 * Delete a message request (recipient can delete/dismiss).
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { messageRequests } from '@/server/db/schema.js';
import { eq, and, or } from 'drizzle-orm';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  if (!db) return res.status(503).json({ error: 'Database unavailable' });
  const myId = session.user.id;
  const reqId = parseInt(req.params.id);
  if (isNaN(reqId)) return res.status(400).json({ error: 'Invalid id' });

  await db.delete(messageRequests).where(
    and(
      eq(messageRequests.id, reqId),
      or(eq(messageRequests.recipientId, myId), eq(messageRequests.requesterId, myId)),
    ),
  );
  res.json({ ok: true });
}
