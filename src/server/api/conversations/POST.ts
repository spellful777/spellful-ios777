/**
 * POST /api/conversations
 * Find or create a conversation between the current user and another user.
 * Enforces messagePermission and block rules.
 * Body: { recipientId: string }
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { conversations, user, covenConnections, messageRequests } from '@/server/db/schema.js';
import { and, eq, or } from 'drizzle-orm';
import { isBlocked } from '@/server/lib/block-check.js';

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const { recipientId } = req.body as { recipientId?: string };
  if (!recipientId || recipientId === myId) {
    return res.status(400).json({ error: 'Valid recipientId required' });
  }

  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  // Block check — discreet: return generic error
  if (await isBlocked(myId, recipientId)) {
    return res.status(403).json({ error: 'Unable to start conversation' });
  }

  // Verify recipient exists and get their messagePermission
  const [recipient] = await db
    .select({ id: user.id, messagePermission: user.messagePermission })
    .from(user).where(eq(user.id, recipientId)).limit(1);
  if (!recipient) return res.status(404).json({ error: 'User not found' });

  const perm = recipient.messagePermission ?? 'everyone';

  // 'nobody' — hard block on new conversations
  if (perm === 'nobody') {
    return res.status(403).json({ error: 'This member is not accepting messages' });
  }

  // Check if they are Coven members
  const [covenConn] = await db.select({ id: covenConnections.id })
    .from(covenConnections)
    .where(and(
      or(
        and(eq(covenConnections.requesterId, myId), eq(covenConnections.receiverId, recipientId)),
        and(eq(covenConnections.requesterId, recipientId), eq(covenConnections.receiverId, myId)),
      ),
      eq(covenConnections.status, 'accepted'),
    )).limit(1);

  const isCoven = !!covenConn;

  // 'coven' — only Coven members can start a conversation
  if (perm === 'coven' && !isCoven) {
    return res.status(403).json({ error: 'This member only accepts messages from their Coven' });
  }

  // Canonical order: smaller id is always participant1
  const [p1, p2] = myId < recipientId ? [myId, recipientId] : [recipientId, myId];

  // Check if conversation already exists
  const existing = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.participant1Id, p1), eq(conversations.participant2Id, p2)))
    .limit(1);

  if (existing.length) {
    const convId = existing[0].id;
    // Check if there's a pending request for this conversation
    const [req_] = await db.select({ id: messageRequests.id, status: messageRequests.status })
      .from(messageRequests).where(eq(messageRequests.conversationId, convId)).limit(1);
    return res.json({ id: convId, existing: true, requestStatus: req_?.status ?? null });
  }

  const result = await db.insert(conversations).values({ participant1Id: p1, participant2Id: p2 });
  const insertId = (result as unknown as [{ insertId: number }])[0].insertId;

  // 'everyone' + non-Coven → create a message request
  let requestStatus: string | null = null;
  if (perm === 'everyone' && !isCoven) {
    await db.insert(messageRequests).values({
      conversationId: insertId,
      requesterId: myId,
      recipientId,
      status: 'pending',
    });
    requestStatus = 'pending';
  }

  res.status(201).json({ id: insertId, existing: false, requestStatus });
}
