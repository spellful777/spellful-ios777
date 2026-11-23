/**
 * POST /api/share
 * Share a public content item into a conversation as a content reference/deep link.
 * Only public content types are shareable — never private Grimoire entries.
 *
 * Body: {
 *   conversationId: number,
 *   contentType: 'spell' | 'herb' | 'tarot' | 'moon' | 'post' | 'profile',
 *   contentId: string,
 *   contentTitle: string,
 *   contentUrl: string,
 * }
 */
import type { Request, Response } from 'express';
import { getAuthSession } from '@/server/lib/auth-session.js';
import { db } from '@/server/db/client.js';
import { conversations, messages, messageRequests } from '@/server/db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { isBlocked } from '@/server/lib/block-check.js';

const ALLOWED_CONTENT_TYPES = ['spell', 'herb', 'tarot', 'moon', 'post', 'profile'] as const;
type ContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

export default async function handler(req: Request, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });
  const myId = session.user.id;

  const { conversationId, contentType, contentId, contentTitle, contentUrl } = req.body as {
    conversationId?: number;
    contentType?: string;
    contentId?: string;
    contentTitle?: string;
    contentUrl?: string;
  };

  if (!conversationId || !contentType || !contentId || !contentTitle || !contentUrl) {
    return res.status(400).json({ error: 'conversationId, contentType, contentId, contentTitle, contentUrl required' });
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType as ContentType)) {
    return res.status(400).json({ error: `contentType must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}` });
  }

  // Validate URL is relative (site-internal) — never allow external URLs to be shared as system messages
  if (!contentUrl.startsWith('/')) {
    return res.status(400).json({ error: 'contentUrl must be a relative path' });
  }

  if (!db) return res.status(503).json({ error: 'Database unavailable' });

  // Verify participant
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.participant1Id !== myId && conv.participant2Id !== myId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const recipientId = conv.participant1Id === myId ? conv.participant2Id : conv.participant1Id;

  // Block check
  if (recipientId && await isBlocked(myId, recipientId)) {
    return res.status(403).json({ error: 'Unable to share' });
  }

  // Message-request enforcement
  const [existingRequest] = await db
    .select({ status: messageRequests.status, requesterId: messageRequests.requesterId })
    .from(messageRequests)
    .where(and(eq(messageRequests.conversationId, conversationId), eq(messageRequests.requesterId, myId)))
    .limit(1);

  if (existingRequest?.status === 'pending') {
    return res.status(403).json({ error: 'Message request pending' });
  }
  if (existingRequest?.status === 'declined') {
    return res.status(403).json({ error: 'Message request was declined' });
  }

  // Build a system message that renders as a content card
  const shareBody = JSON.stringify({
    type: 'share',
    contentType,
    contentId,
    contentTitle: contentTitle.slice(0, 200),
    contentUrl,
  });

  await db.insert(messages).values({
    conversationId,
    senderId: myId,
    ciphertext: '',
    iv: '',
    status: 'sent',
    systemMessage: shareBody,
  });

  await db.execute(
    sql`UPDATE conversations SET updated_at = NOW() WHERE id = ${conversationId}`,
  );

  res.status(201).json({ ok: true });
}
