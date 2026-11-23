/**
 * GET /api/conversations
 * Returns paginated conversations for the current user, with the other participant's
 * profile info, last message preview, unread count, and message-request status.
 *
 * Batches all user lookups, last-message fetches, and unread counts into a small
 * number of queries to eliminate the N+1 pattern.
 *
 * Query: ?limit=30&offset=0&tab=chats|requests
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { conversations, user, messageRequests } from '@/server/db/schema.js';
import { or, eq, desc, sql, inArray } from 'drizzle-orm';
import { SPELLFUL_TEAM_ID, SPELLFUL_TEAM_NAME } from '@/server/lib/welcome-message.js';
import { getBlockedUserIds } from '@/server/lib/block-check.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const limit = Math.min(parseInt((req.query.limit as string) || '30'), 100);
  const offset = parseInt((req.query.offset as string) || '0');
  const tab = (req.query.tab as string) || 'chats'; // 'chats' | 'requests'

  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  // Get all conversations where I'm a participant
  const convRows = await db
    .select()
    .from(conversations)
    .where(or(eq(conversations.participant1Id, myId), eq(conversations.participant2Id, myId)))
    .orderBy(desc(conversations.updatedAt));

  if (!convRows.length) return res.json({ conversations: [], hasMore: false });

  // Filter out conversations with blocked users
  const blockedIds = await getBlockedUserIds(myId);

  const visibleConvs = convRows.filter((conv) => {
    const otherId = conv.participant1Id === myId ? conv.participant2Id : conv.participant1Id;
    return !otherId || !blockedIds.has(otherId);
  });

  // Batch: fetch all message requests for these conversations
  const convIds = visibleConvs.map((c) => c.id);
  const requestRows = convIds.length
    ? await db
        .select()
        .from(messageRequests)
        .where(inArray(messageRequests.conversationId, convIds))
    : [];
  const requestByConvId = new Map(requestRows.map((r) => [r.conversationId, r]));

  // Filter by tab: 'requests' = conversations where I am the recipient of a pending request
  // 'chats' = accepted conversations (no pending request, or I am the requester)
  const tabFiltered = visibleConvs.filter((conv) => {
    const req_ = requestByConvId.get(conv.id);
    if (tab === 'requests') {
      // Show only conversations where I'm the recipient of a pending request
      return req_ && req_.status === 'pending' && req_.recipientId === myId;
    } else {
      // 'chats': no request, or accepted, or I'm the requester (my sent requests)
      if (!req_) return true;
      if (req_.status === 'accepted') return true;
      if (req_.requesterId === myId) return true; // show my own pending sends in chats
      return false;
    }
  });

  const paginated = tabFiltered.slice(offset, offset + limit);
  const hasMore = tabFiltered.length > offset + limit;

  if (!paginated.length) return res.json({ conversations: [], hasMore: false });

  // Batch: collect all other-user IDs (excluding team account)
  const otherUserIds = paginated
    .map((conv) => (conv.participant1Id === myId ? conv.participant2Id : conv.participant1Id))
    .filter((id): id is string => !!id && id !== SPELLFUL_TEAM_ID);

  const uniqueOtherIds = [...new Set(otherUserIds)];

  // Batch user lookup
  const userRows = uniqueOtherIds.length
    ? await db
        .select({ id: user.id, name: user.name, image: user.image, username: user.username })
        .from(user)
        .where(inArray(user.id, uniqueOtherIds))
    : [];
  const userById = new Map(userRows.map((u) => [u.id, u]));

  // Batch: last message per conversation using a subquery approach
  const lastMsgRows = paginated.length
    ? (await db.execute(sql`
        SELECT m.*
        FROM messages m
        INNER JOIN (
          SELECT conversation_id, MAX(id) AS max_id
          FROM messages
          WHERE conversation_id IN (${sql.join(paginated.map((c) => sql`${c.id}`), sql`, `)})
            AND status = 'sent'
          GROUP BY conversation_id
        ) latest ON m.id = latest.max_id
      `)) as unknown as [Array<{
        id: number;
        conversation_id: number;
        sender_id: string;
        ciphertext: string;
        iv: string;
        system_message: string | null;
        created_at: Date;
      }>, unknown]
    : [[], undefined];
  const lastMsgByConvId = new Map(
    (lastMsgRows[0] as Array<{ id: number; conversation_id: number; sender_id: string; ciphertext: string; iv: string; system_message: string | null; created_at: Date }>)
      .map((m) => [m.conversation_id, m]),
  );

  // Batch: unread counts per conversation
  const unreadRows = paginated.length
    ? (await db.execute(sql`
        SELECT conversation_id, COUNT(*) AS cnt
        FROM messages
        WHERE conversation_id IN (${sql.join(paginated.map((c) => sql`${c.id}`), sql`, `)})
          AND sender_id != ${myId}
          AND read_at IS NULL
          AND status = 'sent'
        GROUP BY conversation_id
      `)) as unknown as [Array<{ conversation_id: number; cnt: number }>, unknown]
    : [[], undefined];
  const unreadByConvId = new Map(
    (unreadRows[0] as Array<{ conversation_id: number; cnt: number }>).map((r) => [
      r.conversation_id,
      Number(r.cnt),
    ]),
  );

  const result = paginated.map((conv) => {
    const otherId = conv.participant1Id === myId ? conv.participant2Id : conv.participant1Id;
    const isTeamConv = otherId === SPELLFUL_TEAM_ID;
    const otherUser = isTeamConv
      ? { id: SPELLFUL_TEAM_ID, name: SPELLFUL_TEAM_NAME, image: '/airo-assets/images/logo/email', username: 'spellful' }
      : (otherId ? userById.get(otherId) ?? null : null);

    const lastMsg = lastMsgByConvId.get(conv.id);
    const request = requestByConvId.get(conv.id);

    return {
      id: conv.id,
      updatedAt: conv.updatedAt,
      otherUser,
      lastMessage: lastMsg
        ? {
            ciphertext: lastMsg.ciphertext,
            iv: lastMsg.iv,
            senderId: lastMsg.sender_id,
            createdAt: lastMsg.created_at,
            systemMessage: lastMsg.system_message ?? null,
          }
        : null,
      unreadCount: unreadByConvId.get(conv.id) ?? 0,
      requestStatus: request?.status ?? null,
      requesterId: request?.requesterId ?? null,
    };
  });

  res.json({ conversations: result, hasMore });
}
