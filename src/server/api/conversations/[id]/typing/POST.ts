/**
 * POST /api/conversations/:id/typing
 * Record that the current user is typing in this conversation.
 * Upserts a row with the current timestamp; TTL enforced on read.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { conversations } from '@/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';

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

  await db.execute(sql`
    INSERT INTO typing_indicators (user_id, conversation_id, updated_at)
    VALUES (${myId}, ${convId}, NOW())
    ON DUPLICATE KEY UPDATE updated_at = NOW()
  `);

  res.json({ ok: true });
}
