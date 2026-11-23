/**
 * POST /api/conversations/:id/messages
 * Send an encrypted message. Body: { ciphertext: string, iv: string }
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { conversations, user, messageRequests } from '@/server/db/schema.js';
import { eq, sql, and } from 'drizzle-orm';
import { sendPushToUser } from '@/server/lib/push-notify.js';
import { isBlocked } from '@/server/lib/block-check.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;
  const convId = parseInt(req.params.id);
  if (isNaN(convId)) return res.status(400).json({ error: 'Invalid id' });

  const { ciphertext, iv, status, replyToId } = req.body as { ciphertext?: string; iv?: string; status?: string; replyToId?: number };
  if (!ciphertext || !iv) return res.status(400).json({ error: 'ciphertext and iv required' });
  const msgStatus = status === 'draft' ? 'draft' : 'sent';

  // Verify participant
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1);
  if (!conv) return res.status(404).json({ error: 'Not found' });
  if (conv.participant1Id !== myId && conv.participant2Id !== myId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Block check — silently accept the message on the sender's side but don't deliver it
  const recipientId = conv.participant1Id === myId ? conv.participant2Id : conv.participant1Id;
  const blocked = recipientId ? await isBlocked(myId, recipientId) : false;
  if (blocked) {
    // Return a fake success so the sender's UI behaves normally
    return res.status(201).json({ id: -1, blocked: true });
  }

  // Message-request enforcement: if a pending request exists and I am the requester,
  // I cannot send additional messages until the recipient accepts.
  const [existingRequest] = await db
    .select({ id: messageRequests.id, status: messageRequests.status, requesterId: messageRequests.requesterId })
    .from(messageRequests)
    .where(and(eq(messageRequests.conversationId, convId), eq(messageRequests.requesterId, myId)))
    .limit(1);

  if (existingRequest && existingRequest.status === 'pending') {
    return res.status(403).json({ error: 'Message request pending — wait for the recipient to accept before sending more messages.' });
  }
  if (existingRequest && existingRequest.status === 'declined') {
    return res.status(403).json({ error: 'Message request was declined.' });
  }

  // Use raw SQL so we can include the optional reply_to_id column added by migration
  const result = await db.execute(sql`
    INSERT INTO messages (conversation_id, sender_id, ciphertext, iv, status, reply_to_id)
    VALUES (${convId}, ${myId}, ${ciphertext}, ${iv}, ${msgStatus}, ${replyToId ?? null})
  `);
  const insertId = (result as unknown as [{ insertId: number }])[0].insertId;

  // Bump conversation updatedAt
  await db.execute(sql`UPDATE conversations SET updated_at = NOW() WHERE id = ${convId}`);

  // Send push notification to the recipient (fire-and-forget, non-blocking)
  if (msgStatus === 'sent') {
    const recipientId = conv.participant1Id === myId ? conv.participant2Id : conv.participant1Id;
    if (recipientId) {
      const [sender] = await db.select({ name: user.name, username: user.username }).from(user).where(eq(user.id, myId)).limit(1);
      const senderName = sender?.name ?? sender?.username ?? 'Someone';
      void sendPushToUser(recipientId, {
        title: `New message from ${senderName}`,
        body: '✨ You have a new encrypted message on Spellful',
        url: '/messages',
      });
    }
  }

  res.status(201).json({ id: insertId });
}
