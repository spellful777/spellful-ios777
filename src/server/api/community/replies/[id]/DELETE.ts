import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityReplies, communityPosts } from '@/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const replyId = parseInt(req.params.id);
  if (isNaN(replyId)) return res.status(400).json({ error: 'Invalid id' });

  const [reply] = await db.select({ userId: communityReplies.userId, postId: communityReplies.postId }).from(communityReplies).where(eq(communityReplies.id, replyId)).limit(1);
  if (!reply) return res.status(404).json({ error: 'Reply not found' });

  const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin;
  if (reply.userId !== session.user.id && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

  await db.delete(communityReplies).where(eq(communityReplies.id, replyId));
  await db.update(communityPosts).set({ replyCount: sql`GREATEST(reply_count - 1, 0)` }).where(eq(communityPosts.id, reply.postId));
  res.json({ ok: true });
}
