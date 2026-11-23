/**
 * GET /api/conversations/:id/messages
 * Returns all messages in a conversation (caller must be a participant).
 * Also marks unread messages from the other user as read.
 * Includes replyToId, editedAt, deletedAt, and per-message reactions.
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { conversations, messages } from '@/server/db/schema.js';
import { eq, desc, sql, and, ne, lt } from 'drizzle-orm';

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

  // Mark incoming unread messages as read
  await db.execute(sql`
    UPDATE messages
    SET read_at = NOW()
    WHERE conversation_id = ${convId}
      AND sender_id != ${myId}
      AND read_at IS NULL
  `);

  // ?status=draft returns only the caller's drafts; default returns all non-deleted sent messages
  const statusFilter = (req.query as Record<string, string>).status;
  let whereClause;
  if (statusFilter === 'draft') {
    whereClause = and(
      eq(messages.conversationId, convId),
      eq(messages.senderId, myId),
      eq(messages.status, 'draft'),
    );
  } else if (statusFilter === 'trashed') {
    whereClause = and(
      eq(messages.conversationId, convId),
      eq(messages.senderId, myId),
      eq(messages.status, 'trashed'),
    );
  } else {
    // Default: sent messages only (exclude drafts and deleted)
    whereClause = and(
      eq(messages.conversationId, convId),
      eq(messages.status, 'sent'),
      ne(messages.status, 'deleted'),
    );
  }

  // Cursor-based pagination: ?before=<messageId>&limit=50
  // Returns messages older than the cursor, newest-first, then reversed for display
  const beforeId = req.query.before ? parseInt(req.query.before as string) : null;
  const pageLimit = Math.min(parseInt((req.query.limit as string) || '50'), 100);

  const paginatedWhere = beforeId && !isNaN(beforeId)
    ? and(whereClause, lt(messages.id, beforeId))
    : whereClause;

  const msgs = await db
    .select()
    .from(messages)
    .where(paginatedWhere)
    .orderBy(desc(messages.createdAt))
    .limit(pageLimit + 1); // fetch one extra to determine hasMore

  const hasMore = msgs.length > pageLimit;
  if (hasMore) msgs.pop();
  msgs.reverse(); // return in chronological order

  if (!msgs.length) return res.json({ messages: [], hasMore: false, oldestId: null });

  // Fetch reactions for all messages in one query
  const msgIds = msgs.map(m => m.id);
  const reactionsRaw = await db.execute(sql`
    SELECT message_id, emoji, user_id
    FROM message_reactions
    WHERE message_id IN (${sql.join(msgIds.map(id => sql`${id}`), sql`, `)})
    ORDER BY created_at ASC
  `) as unknown as [{ message_id: number; emoji: string; user_id: string }[], unknown];

  // db.execute returns a [rows, fields] tuple — take the first element
  const reactionsRows = reactionsRaw[0] as { message_id: number; emoji: string; user_id: string }[];

  // Group reactions by message_id → emoji → userIds
  const reactionsByMsg: Record<number, { emoji: string; count: number; userIds: string[] }[]> = {};
  for (const row of reactionsRows) {
    if (!reactionsByMsg[row.message_id]) reactionsByMsg[row.message_id] = [];
    const existing = reactionsByMsg[row.message_id].find(r => r.emoji === row.emoji);
    if (existing) {
      existing.count++;
      existing.userIds.push(row.user_id);
    } else {
      reactionsByMsg[row.message_id].push({ emoji: row.emoji, count: 1, userIds: [row.user_id] });
    }
  }

  const mapped = msgs.map(m => ({
    ...m,
    systemMessage: m.systemMessage ?? null,
    replyToId: (m as unknown as Record<string, unknown>).reply_to_id ?? null,
    editedAt: (m as unknown as Record<string, unknown>).edited_at ?? null,
    deletedAt: (m as unknown as Record<string, unknown>).deleted_at ?? null,
    reactions: reactionsByMsg[m.id] ?? [],
  }));

  res.json({
    messages: mapped,
    hasMore,
    oldestId: mapped.length > 0 ? mapped[0].id : null,
  });
}
