/**
 * GET /api/conversations/:id/receipts
 * Returns the readAt timestamp of the most recently read message sent by the caller.
 * Used to show "Read" receipts under outgoing messages.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { conversations, messages } from '@/server/db/schema.js';
import { eq, and, isNotNull, desc } from 'drizzle-orm';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;
  const convId = parseInt(req.params.id);
  if (isNaN(convId)) return res.status(400).json({ error: 'Invalid id' });

  // Verify participant
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1);
  if (!conv) return res.status(404).json({ error: 'Not found' });
  if (conv.participant1Id !== myId && conv.participant2Id !== myId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Find the most recently read message that I sent
  const [lastRead] = await db
    .select({ id: messages.id, readAt: messages.readAt })
    .from(messages)
    .where(and(
      eq(messages.conversationId, convId),
      eq(messages.senderId, myId),
      isNotNull(messages.readAt),
    ))
    .orderBy(desc(messages.readAt))
    .limit(1);

  res.json({ lastReadMessageId: lastRead?.id ?? null, readAt: lastRead?.readAt ?? null });
}
