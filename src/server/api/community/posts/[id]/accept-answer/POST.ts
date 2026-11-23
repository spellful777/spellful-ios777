import type { Request, Response } from 'express';
import { db } from '@/server/db/client.js';
import { communityPosts, communityReplies, communityNotifications } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/server/lib/auth-session.js';

export default async function handler(req: Request<{ id: string }>, res: Response) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  const postId = parseInt(req.params.id);
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid id' });

  const [post] = await db.select({ userId: communityPosts.userId, type: communityPosts.type }).from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.userId !== session.user.id) return res.status(403).json({ error: 'Only the post author can accept an answer' });
  if (post.type !== 'question') return res.status(400).json({ error: 'Only question posts can have accepted answers' });

  const { replyId } = req.body as { replyId?: number };
  if (!replyId) return res.status(400).json({ error: 'replyId required' });

  const [reply] = await db.select({ userId: communityReplies.userId }).from(communityReplies).where(and(eq(communityReplies.id, replyId), eq(communityReplies.postId, postId))).limit(1);
  if (!reply) return res.status(404).json({ error: 'Reply not found on this post' });

  await db.update(communityPosts).set({ acceptedReplyId: replyId }).where(eq(communityPosts.id, postId));

  // Notify reply author
  if (reply.userId !== session.user.id) {
    await db.insert(communityNotifications).values({
      userId: reply.userId,
      type: 'accepted',
      actorId: session.user.id,
      postId,
      replyId,
      message: 'Your answer was accepted!',
    }).catch(() => {});
  }

  res.json({ ok: true });
}
