/**
 * GET /api/messages/:id/reactions
 * Returns all reactions for a message, grouped by emoji.
 * Response: { reactions: { emoji: string; count: number; userIds: string[] }[] }
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { messages, conversations } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const msgId = parseInt(req.params.id);
  if (isNaN(msgId)) return res.status(400).json({ error: 'Invalid id' });

  // Verify participant
  const [msg] = await db
    .select({ id: messages.id, conversationId: messages.conversationId })
    .from(messages)
    .where(eq(messages.id, msgId))
    .limit(1);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  const [conv] = await db
    .select({ p1: conversations.participant1Id, p2: conversations.participant2Id })
    .from(conversations)
    .where(eq(conversations.id, msg.conversationId))
    .limit(1);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.p1 !== myId && conv.p2 !== myId) return res.status(403).json({ error: 'Forbidden' });

  const rawResult = await db.execute(sql`
    SELECT emoji, user_id
    FROM message_reactions
    WHERE message_id = ${msgId}
    ORDER BY created_at ASC
  `) as unknown as [{ emoji: string; user_id: string }[], unknown];

  // db.execute returns a [rows, fields] tuple — take the first element
  const rawRows = rawResult[0] as { emoji: string; user_id: string }[];

  // Group by emoji
  const grouped: Record<string, string[]> = {};
  for (const row of rawRows) {
    if (!grouped[row.emoji]) grouped[row.emoji] = [];
    grouped[row.emoji].push(row.user_id);
  }

  const reactions = Object.entries(grouped).map(([emoji, userIds]) => ({
    emoji,
    count: userIds.length,
    userIds,
  }));

  res.json({ reactions });
}
