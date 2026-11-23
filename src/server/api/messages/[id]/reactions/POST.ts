/**
 * POST /api/messages/:id/reactions
 * Toggle a reaction emoji on a message. Allowed: 👍 ❤️ ✨ 🌙
 * If the user already reacted with this emoji, it is removed (toggle).
 * Body: { emoji: string }
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { messages, conversations } from '@/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const ALLOWED_EMOJIS = ['👍', '❤️', '✨', '🌙'];

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const msgId = parseInt(req.params.id);
  if (isNaN(msgId)) return res.status(400).json({ error: 'Invalid id' });

  const { emoji } = req.body as { emoji?: string };
  if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
    return res.status(400).json({ error: `emoji must be one of: ${ALLOWED_EMOJIS.join(' ')}` });
  }

  // Verify the message exists and the user is a participant in its conversation
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

  // Check if reaction already exists
  const existingRaw = await db.execute(sql`
    SELECT id FROM message_reactions
    WHERE message_id = ${msgId} AND user_id = ${myId} AND emoji = ${emoji}
    LIMIT 1
  `) as unknown as [{ id: number }[], unknown];

  // db.execute returns a [rows, fields] tuple — take the first element
  const rows = existingRaw[0] as { id: number }[];
  if (rows.length > 0) {
    // Toggle off
    await db.execute(sql`
      DELETE FROM message_reactions
      WHERE message_id = ${msgId} AND user_id = ${myId} AND emoji = ${emoji}
    `);
    res.json({ ok: true, action: 'removed', emoji });
  } else {
    // Toggle on
    await db.execute(sql`
      INSERT INTO message_reactions (message_id, user_id, emoji, created_at)
      VALUES (${msgId}, ${myId}, ${emoji}, NOW())
    `);
    res.json({ ok: true, action: 'added', emoji });
  }
}
